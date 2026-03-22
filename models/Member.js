const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide member name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Please select a plan']
  },
  join_date: {
    type: Date,
    required: [true, 'Please provide join date']
  },
  expiry_date: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
memberSchema.index({ name: 'text', phone: 'text' });
memberSchema.index({ expiry_date: 1 });
memberSchema.index({ is_deleted: 1 });

module.exports = mongoose.model('Member', memberSchema);
