const express = require('express');
const jwt = require('jsonwebtoken');
const Agent = require('../models/Agent');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Đăng nhập agent
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm agent
    const agent = await Agent.findOne({ email });
    if (!agent) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await agent.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra tài khoản có hoạt động không
    if (!agent.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: agent._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Cập nhật trạng thái online
    agent.isOnline = true;
    agent.lastSeen = new Date();
    await agent.save();

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        agent: agent.toJSON()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Đăng xuất agent
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.agent._id);
    agent.isOnline = false;
    agent.lastSeen = new Date();
    agent.socketId = null;
    await agent.save();

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Lấy thông tin agent hiện tại
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        agent: req.agent
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Cập nhật thông tin agent
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const agent = await Agent.findById(req.agent._id);
    if (name) agent.name = name;
    if (avatar !== undefined) agent.avatar = avatar;
    
    await agent.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        agent: agent.toJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

module.exports = router;