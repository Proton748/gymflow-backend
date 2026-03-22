const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  type: {
    type: String,
    enum: ['before_expiry', 'on_expiry'],
    required: true
  },
  scheduled_date: {
    type: Date,
    required: true
  },
  sent: {
    type: Boolean,
    default: false
  },
  sent_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
