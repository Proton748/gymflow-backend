const express = require('express');
const { body } = require('express-validator');
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan
} = require('../controllers/planController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Create plan (Admin only)
router.post('/', protect, adminOnly, [
  body('name', 'Plan name is required').trim().notEmpty(),
  body('duration_days', 'Duration in days is required').isInt({ min: 1 })
], createPlan);

// Get all plans
router.get('/', protect, getAllPlans);

// Get plan by ID
router.get('/:id', protect, getPlanById);

// Update plan (Admin only)
router.put('/:id', protect, adminOnly, updatePlan);

// Delete plan (Admin only)
router.delete('/:id', protect, adminOnly, deletePlan);

module.exports = router;
