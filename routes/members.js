const express = require('express');
const { body } = require('express-validator');
const {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember
} = require('../controllers/memberController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create member
router.post('/', protect, [
  body('name', 'Member name is required').trim().notEmpty(),
  body('phone', 'Phone number is required').trim().notEmpty(),
  body('plan_id', 'Plan ID is required').notEmpty(),
  body('join_date', 'Join date is required').isISO8601()
], createMember);

// Get all members
router.get('/', protect, getAllMembers);

// Get member by ID
router.get('/:id', protect, getMemberById);

// Update member
router.put('/:id', protect, updateMember);

// Delete member (soft delete)
router.delete('/:id', protect, deleteMember);

module.exports = router;
