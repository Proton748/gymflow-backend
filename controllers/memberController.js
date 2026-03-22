const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// Helper function to calculate member status
const getMemberStatus = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) {
    return 'expired';
  }
  return 'active';
};

// Helper to check if expiring soon (within 3 days)
const isExpiringsoon = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
};

// Create a new member
exports.createMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, plan_id, join_date, notes } = req.body;

    // Verify plan exists
    const plan = await Plan.findById(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Calculate expiry date
    const joinDate = new Date(join_date);
    const expiryDate = new Date(joinDate);
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

    // Create member
    const member = new Member({
      name,
      phone,
      plan_id,
      join_date: joinDate,
      expiry_date: expiryDate,
      notes: notes || '',
      created_by: req.user.id
    });

    await member.save();

    // Create notification for before expiry (2 days before)
    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(notificationDate.getDate() - 2);
    
    await Notification.create({
      member_id: member._id,
      type: 'before_expiry',
      scheduled_date: notificationDate,
      sent: false
    });

    // Create notification for expiry day
    await Notification.create({
      member_id: member._id,
      type: 'on_expiry',
      scheduled_date: expiryDate,
      sent: false
    });

    // Populate for response
    await member.populate('plan_id created_by');

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        ...member.toObject(),
        status: getMemberStatus(member.expiry_date)
      }
    });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Server error creating member' });
  }
};

// Get all members (excluding deleted)
exports.getAllMembers = async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = { is_deleted: false };

    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (status === 'active') {
      query.expiry_date = { $gte: today };
    } else if (status === 'expired') {
      query.expiry_date = { $lt: today };
    } else if (status === 'expiring_soon') {
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      query.expiry_date = { $gte: today, $lte: threeDaysLater };
    }

    const members = await Member.find(query)
      .populate('plan_id', 'name duration_days price')
      .populate('created_by', 'name email')
      .sort({ created_at: -1 });

    // Add status to each member
    const membersWithStatus = members.map(member => ({
      ...member.toObject(),
      status: getMemberStatus(member.expiry_date)
    }));

    res.status(200).json({
      total: membersWithStatus.length,
      members: membersWithStatus
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error fetching members' });
  }
};

// Get member by ID
exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('plan_id')
      .populate('created_by', 'name email');

    if (!member || member.is_deleted) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.status(200).json({
      member: {
        ...member.toObject(),
        status: getMemberStatus(member.expiry_date)
      }
    });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ error: 'Server error fetching member' });
  }
};

// Update member
exports.updateMember = async (req, res) => {
  try {
    let member = await Member.findById(req.params.id);

    if (!member || member.is_deleted) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const { name, phone, plan_id, join_date, notes } = req.body;

    // Update fields if provided
    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (notes !== undefined) member.notes = notes;

    // If plan or join date changed, recalculate expiry
    if (plan_id || join_date) {
      const plan = await Plan.findById(plan_id || member.plan_id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const newJoinDate = join_date ? new Date(join_date) : member.join_date;
      const newExpiryDate = new Date(newJoinDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + plan.duration_days);

      member.plan_id = plan_id || member.plan_id;
      member.join_date = newJoinDate;
      member.expiry_date = newExpiryDate;
    }

    member.updated_at = Date.now();
    await member.save();

    await member.populate('plan_id created_by');

    res.status(200).json({
      message: 'Member updated successfully',
      member: {
        ...member.toObject(),
        status: getMemberStatus(member.expiry_date)
      }
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Server error updating member' });
  }
};

// Soft delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { is_deleted: true, updated_at: Date.now() },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.status(200).json({
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Server error deleting member' });
  }
};
