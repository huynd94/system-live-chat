const mongoose = require('mongoose');
require('dotenv').config();

// Import model
const Agent = require('../src/models/Agent');

const agents = [
  {
    name: 'Agent 1',
    email: 'agent1@example.com',
    password: '123456',
    avatar: null,
    isActive: true
  },
  {
    name: 'Agent 2', 
    email: 'agent2@example.com',
    password: '123456',
    avatar: null,
    isActive: true
  }
];

async function createAgents() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_system');
    console.log('🗃️  Kết nối MongoDB thành công');

    // Xóa tất cả agents cũ (nếu có)
    await Agent.deleteMany({});
    console.log('🗑️  Đã xóa tất cả agents cũ');

    // Tạo agents mới
    for (const agentData of agents) {
      const agent = new Agent(agentData);
      await agent.save();
      console.log(`✅ Đã tạo agent: ${agent.name} (${agent.email})`);
    }

    console.log('\n🎉 Hoàn thành tạo agents!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log('Agent 1: agent1@example.com / 123456');
    console.log('Agent 2: agent2@example.com / 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo agents:', error);
    process.exit(1);
  }
}

createAgents();