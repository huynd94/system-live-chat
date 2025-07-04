const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Agent = require('../models/Agent');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const socketHandler = (io) => {
  // Middleware xác thực socket cho agent
  const authenticateAgent = async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const agent = await Agent.findById(decoded.id);
      
      if (!agent || !agent.isActive) {
        return next(new Error('Invalid token'));
      }

      socket.agent = agent;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  };

  // Namespace cho agents
  const agentNamespace = io.of('/agent');
  agentNamespace.use(authenticateAgent);

  agentNamespace.on('connection', async (socket) => {
    console.log(`👤 Agent ${socket.agent.name} kết nối: ${socket.id}`);

    // Cập nhật trạng thái online và socketId
    await Agent.findByIdAndUpdate(socket.agent._id, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date()
    });

    // Join room agent để nhận thông báo
    socket.join(`agent_${socket.agent._id}`);

    // Agent join các cuộc hội thoại đã được gán
    const assignedConversations = await Conversation.find({ 
      assignedAgent: socket.agent._id,
      status: { $in: ['waiting', 'active'] }
    });
    
    assignedConversations.forEach(conv => {
      socket.join(`conversation_${conv.conversationId}`);
    });

    // Gửi tin nhắn từ agent
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;

        // Kiểm tra quyền gửi tin nhắn
        const conversation = await Conversation.findOne({ conversationId });
        if (!conversation || conversation.assignedAgent?.toString() !== socket.agent._id.toString()) {
          socket.emit('error', { message: 'Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này' });
          return;
        }

        // Tạo tin nhắn mới
        const message = new Message({
          conversationId,
          content,
          sender: 'agent',
          senderInfo: {
            id: socket.agent._id.toString(),
            name: socket.agent.name,
            avatar: socket.agent.avatar
          }
        });

        await message.save();

        // Cập nhật tin nhắn cuối cùng trong conversation
        conversation.lastMessage = {
          content,
          timestamp: message.createdAt,
          sender: 'agent'
        };
        await conversation.save();

        // Gửi tin nhắn đến customer và các agent khác
        io.to(`conversation_${conversationId}`).emit('new_message', {
          message: message.toObject(),
          conversation: await conversation.populate('assignedAgent', 'name email avatar isOnline')
        });

        console.log(`💬 Agent ${socket.agent.name} gửi tin nhắn: ${content}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
      }
    });

    // Agent join cuộc hội thoại
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        socket.join(`conversation_${conversationId}`);
        
        // Cập nhật agent đang xem cuộc hội thoại
        socket.to(`conversation_${conversationId}`).emit('agent_viewing', {
          agentId: socket.agent._id,
          agentName: socket.agent.name
        });
      } catch (error) {
        console.error('Join conversation error:', error);
      }
    });

    // Agent rời cuộc hội thoại
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
    });

    // Agent đang gõ
    socket.on('typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('agent_typing', {
        agentId: socket.agent._id,
        agentName: socket.agent.name
      });
    });

    // Agent ngừng gõ
    socket.on('stop_typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('agent_stop_typing', {
        agentId: socket.agent._id
      });
    });

    // Xử lý disconnect
    socket.on('disconnect', async () => {
      console.log(`👤 Agent ${socket.agent.name} ngắt kết nối`);
      
      // Cập nhật trạng thái offline
      await Agent.findByIdAndUpdate(socket.agent._id, {
        isOnline: false,
        socketId: null,
        lastSeen: new Date()
      });
    });
  });

  // Namespace cho customers
  const customerNamespace = io.of('/customer');

  customerNamespace.on('connection', (socket) => {
    console.log(`👥 Customer kết nối: ${socket.id}`);

    // Khởi tạo cuộc hội thoại mới
    socket.on('start_conversation', async (data) => {
      try {
        const { customer, websiteUrl, userAgent, ipAddress } = data;

        // Tạo ID cuộc hội thoại duy nhất
        const conversationId = uuidv4();

        // Tạo cuộc hội thoại mới
        const conversation = new Conversation({
          conversationId,
          customer,
          websiteUrl,
          userAgent,
          ipAddress,
          status: 'waiting'
        });

        await conversation.save();

        // Customer join room cuộc hội thoại
        socket.join(`conversation_${conversationId}`);
        socket.conversationId = conversationId;

        // Thông báo cho tất cả agents về cuộc hội thoại mới
        agentNamespace.emit('new_conversation', {
          conversation: conversation.toObject()
        });

        // Gửi lại thông tin cuộc hội thoại cho customer
        socket.emit('conversation_started', {
          conversationId,
          conversation: conversation.toObject()
        });

        console.log(`💬 Cuộc hội thoại mới: ${conversationId} từ ${customer.name}`);
      } catch (error) {
        console.error('Start conversation error:', error);
        socket.emit('error', { message: 'Lỗi khi khởi tạo cuộc hội thoại' });
      }
    });

    // Customer gửi tin nhắn
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, senderInfo } = data;

        // Kiểm tra cuộc hội thoại tồn tại
        const conversation = await Conversation.findOne({ conversationId });
        if (!conversation) {
          socket.emit('error', { message: 'Cuộc hội thoại không tồn tại' });
          return;
        }

        // Tạo tin nhắn mới
        const message = new Message({
          conversationId,
          content,
          sender: 'customer',
          senderInfo
        });

        await message.save();

        // Cập nhật tin nhắn cuối cùng trong conversation
        conversation.lastMessage = {
          content,
          timestamp: message.createdAt,
          sender: 'customer'
        };
        await conversation.save();

        // Gửi tin nhắn đến agents
        io.to(`conversation_${conversationId}`).emit('new_message', {
          message: message.toObject(),
          conversation: await conversation.populate('assignedAgent', 'name email avatar isOnline')
        });

        console.log(`💬 Customer gửi tin nhắn: ${content}`);
      } catch (error) {
        console.error('Customer send message error:', error);
        socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
      }
    });

    // Customer đang gõ
    socket.on('typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('customer_typing');
    });

    // Customer ngừng gõ
    socket.on('stop_typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('customer_stop_typing');
    });

    // Xử lý disconnect
    socket.on('disconnect', async () => {
      console.log(`👥 Customer ngắt kết nối: ${socket.id}`);
      
      if (socket.conversationId) {
        // Cập nhật trạng thái customer offline
        await Conversation.findOneAndUpdate(
          { conversationId: socket.conversationId },
          { isCustomerOnline: false }
        );

        // Thông báo cho agents
        socket.to(`conversation_${socket.conversationId}`).emit('customer_offline');
      }
    });
  });

  console.log('🔌 Socket.IO handlers đã được thiết lập');
};

module.exports = socketHandler;