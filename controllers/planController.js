const Plan = require('../models/Plan');
const { validationResult } = require('express-validator');

// Create a new plan (Admin only)
exports.createPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, duration_days, price } = req.body;

    // Check if plan already exists
    let plan = await Plan.findOne({ name });
    if (plan) {
      return res.status(400).json({ error: 'Plan with this name already exists' });
    }

    plan = new Plan({
      name,
      duration_days,
      price: price || null,
      is_active: true
    });

    await plan.save();

    res.status(201).json({
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Server error creating plan' });
  }
};

// Get all active plans
exports.getAllPlans = async (req, res) => {
  try {
    // Get active flag from query, default to true
    const isActive = req.query.active !== 'false';
    
    let query = {};
    if (isActive) {
      query.is_active = true;
    }

    const plans = await Plan.find(query).sort({ duration_days: 1 });

    res.status(200).json({
      total: plans.length,
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Server error fetching plans' });
  }
};

// Get plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.status(200).json({ plan });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Server error fetching plan' });
  }
};

// Update plan (Admin only)
exports.updatePlan = async (req, res) => {
  try {
    let plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { name, duration_days, price, is_active } = req.body;

    // Update fields if provided
    if (name) plan.name = name;
    if (duration_days) plan.duration_days = duration_days;
    if (price !== undefined) plan.price = price;
    if (is_active !== undefined) plan.is_active = is_active;

    plan.updated_at = Date.now();

    await plan.save();

    res.status(200).json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Server error updating plan' });
  }
};

// Delete plan (soft delete - deactivate)
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { is_active: false, updated_at: Date.now() },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.status(200).json({
      message: 'Plan deleted successfully',
      plan
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Server error deleting plan' });
  }
};
