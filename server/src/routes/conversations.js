const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách cuộc hội thoại
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const query = {};
    
    // Lọc theo trạng thái
    if (status && ['waiting', 'active', 'closed'].includes(status)) {
      query.status = status;
    }
    
    // Tìm kiếm theo tên hoặc số điện thoại
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const conversations = await Conversation.find(query)
      .populate('assignedAgent', 'name email avatar isOnline')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: conversations.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Lấy chi tiết cuộc hội thoại
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findOne({ conversationId })
      .populate('assignedAgent', 'name email avatar isOnline');
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại'
      });
    }

    res.json({
      success: true,
      data: {
        conversation
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Lấy tin nhắn của cuộc hội thoại
router.get('/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ conversationId });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Đảo ngược để hiển thị từ cũ đến mới
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: messages.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Gán agent cho cuộc hội thoại
router.post('/:conversationId/assign', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const agentId = req.agent._id;
    
    const conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại'
      });
    }

    // Kiểm tra xem cuộc hội thoại đã được gán cho agent khác chưa
    if (conversation.assignedAgent && conversation.assignedAgent.toString() !== agentId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cuộc hội thoại đã được gán cho agent khác'
      });
    }

    conversation.assignedAgent = agentId;
    conversation.status = 'active';
    await conversation.save();

    await conversation.populate('assignedAgent', 'name email avatar isOnline');

    res.json({
      success: true,
      message: 'Gán agent thành công',
      data: {
        conversation
      }
    });
  } catch (error) {
    console.error('Assign agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Đóng cuộc hội thoại
router.post('/:conversationId/close', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại'
      });
    }

    // Chỉ agent được gán mới có thể đóng cuộc hội thoại
    if (conversation.assignedAgent?.toString() !== req.agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đóng cuộc hội thoại này'
      });
    }

    conversation.status = 'closed';
    await conversation.save();

    res.json({
      success: true,
      message: 'Đã đóng cuộc hội thoại',
      data: {
        conversation
      }
    });
  } catch (error) {
    console.error('Close conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

module.exports = router;