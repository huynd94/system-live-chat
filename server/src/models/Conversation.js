const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: null
    },
    address: {
      type: String,
      default: null
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    }
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'closed'],
    default: 'waiting'
  },
  isCustomerOnline: {
    type: Boolean,
    default: true
  },
  lastMessage: {
    content: String,
    timestamp: Date,
    sender: {
      type: String,
      enum: ['customer', 'agent']
    }
  },
  websiteUrl: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
conversationSchema.index({ conversationId: 1 });
conversationSchema.index({ assignedAgent: 1 });
conversationSchema.index({ 'customer.phone': 1 });
conversationSchema.index({ 'customer.name': 1 });
conversationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);