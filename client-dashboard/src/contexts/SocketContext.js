import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, agent } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const socketRef = useRef(null);

  // Khởi tạo socket connection
  useEffect(() => {
    if (token && agent) {
      const newSocket = io(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}/agent`, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        setConnected(false);
      });

      // Cuộc hội thoại mới
      newSocket.on('new_conversation', (data) => {
        setConversations(prev => [data.conversation, ...prev]);
        showNotification('Cuộc hội thoại mới', `${data.conversation.customer.name} cần hỗ trợ`);
      });

      // Tin nhắn mới
      newSocket.on('new_message', (data) => {
        const { message, conversation } = data;
        
        // Cập nhật messages nếu đang xem cuộc hội thoại này
        if (activeConversation?.conversationId === message.conversationId) {
          setMessages(prev => [...prev, message]);
        }

        // Cập nhật danh sách conversations
        setConversations(prev => prev.map(conv => 
          conv.conversationId === conversation.conversationId ? conversation : conv
        ));

        // Hiển thị notification nếu tin nhắn từ customer
        if (message.sender === 'customer') {
          showNotification(
            'Tin nhắn mới',
            `${message.senderInfo.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`
          );
        }
      });

      // Customer typing
      newSocket.on('customer_typing', () => {
        // Handle customer typing indicator
      });

      newSocket.on('customer_stop_typing', () => {
        // Handle customer stop typing
      });

      // Customer offline
      newSocket.on('customer_offline', () => {
        if (activeConversation) {
          setActiveConversation(prev => ({
            ...prev,
            isCustomerOnline: false
          }));
        }
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);
      socketRef.current = newSocket;

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [token, agent, activeConversation]);

  // Notification helper
  const showNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Socket methods
  const sendMessage = (conversationId, content) => {
    if (socket && conversationId && content.trim()) {
      socket.emit('send_message', {
        conversationId,
        content: content.trim()
      });
    }
  };

  const joinConversation = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('join_conversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('leave_conversation', { conversationId });
    }
  };

  const startTyping = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('typing', { conversationId });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('stop_typing', { conversationId });
    }
  };

  const value = {
    socket,
    connected,
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    onlineAgents,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};