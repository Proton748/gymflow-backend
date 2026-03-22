const Member = require('../models/Member');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // Total members (non-deleted)
    const totalMembers = await Member.countDocuments({ is_deleted: false });

    // Active members (expiry_date >= today)
    const activeMembers = await Member.countDocuments({
      is_deleted: false,
      expiry_date: { $gte: today }
    });

    // Expired members (expiry_date < today)
    const expiredMembers = await Member.countDocuments({
      is_deleted: false,
      expiry_date: { $lt: today }
    });

    // Expiring today (expiry_date is today)
    const expiringToday = await Member.countDocuments({
      is_deleted: false,
      expiry_date: { $gte: today, $lt: tomorrow }
    });

    // Expiring soon (within 3 days, including today)
    const expiringSoon = await Member.countDocuments({
      is_deleted: false,
      expiry_date: { $gte: today, $lte: threeDaysLater }
    });

    // Get recent members (last 10)
    const recentMembers = await Member.find({ is_deleted: false })
      .populate('plan_id', 'name')
      .sort({ created_at: -1 })
      .limit(10);

    res.status(200).json({
      stats: {
        total_members: totalMembers,
        active_members: activeMembers,
        expired_members: expiredMembers,
        expiring_today: expiringToday,
        expiring_soon: expiringSoon
      },
      recent_members: recentMembers.map(member => ({
        id: member._id,
        name: member.name,
        plan: member.plan_id?.name || 'N/A',
        expiry_date: member.expiry_date,
        created_at: member.created_at
      }))
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard stats' });
  }
};
