import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import ContactForm from './components/ContactForm';
import ChatWindow from './components/ChatWindow';
import ChatButton from './components/ChatButton';

const ChatWidget = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [socket, setSocket] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAgentOnline, setIsAgentOnline] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Kết nối Socket.IO
  useEffect(() => {
    if (isFormSubmitted && !socket) {
      const newSocket = io(`${config.serverUrl}/customer`, {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🔌 Kết nối server thành công');
      });

      newSocket.on('conversation_started', (data) => {
        setConversationId(data.conversationId);
        console.log('💬 Cuộc hội thoại đã được khởi tạo:', data.conversationId);
      });

      newSocket.on('new_message', (data) => {
        setMessages(prev => [...prev, data.message]);
        
        // Cập nhật trạng thái agent online
        if (data.conversation?.assignedAgent) {
          setIsAgentOnline(data.conversation.assignedAgent.isOnline);
        }
      });

      newSocket.on('agent_typing', () => {
        setIsAgentTyping(true);
      });

      newSocket.on('agent_stop_typing', () => {
        setIsAgentTyping(false);
      });

      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isFormSubmitted, config.serverUrl]);

  // Khởi tạo cuộc hội thoại khi form được submit
  const handleFormSubmit = (formData) => {
    if (socket) {
      const customerData = {
        customer: formData,
        websiteUrl: window.location.href,
        userAgent: navigator.userAgent,
        ipAddress: null // Sẽ được backend xác định
      };

      socket.emit('start_conversation', customerData);
      setCustomerInfo(formData);
      setIsFormSubmitted(true);

      // Thêm tin nhắn chào mừng
      if (config.welcomeMessage) {
        setMessages([{
          _id: 'welcome',
          content: config.welcomeMessage,
          sender: 'agent',
          senderInfo: {
            name: 'Hệ thống',
            avatar: null
          },
          createdAt: new Date().toISOString()
        }]);
      }
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = (content) => {
    if (socket && conversationId && content.trim()) {
      const messageData = {
        conversationId,
        content: content.trim(),
        senderInfo: {
          name: customerInfo?.name || 'Khách hàng',
          avatar: null
        }
      };

      socket.emit('send_message', messageData);

      // Thêm tin nhắn vào danh sách local
      const newMessage = {
        _id: Date.now().toString(),
        content: content.trim(),
        sender: 'customer',
        senderInfo: messageData.senderInfo,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);
    }
  };

  // Xử lý typing indicator
  const handleTyping = () => {
    if (socket && conversationId) {
      socket.emit('typing', { conversationId });

      // Clear timeout hiện tại
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout để ngừng typing sau 3 giây
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId });
      }, 3000);
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  return (
    <div 
      className="chat-widget"
      style={{
        '--primary-color': config.theme?.primaryColor || '#3B82F6',
        '--text-color': config.theme?.textColor || '#374151',
        '--background-color': config.theme?.backgroundColor || '#FFFFFF'
      }}
    >
      {!isOpen && (
        <ChatButton 
          onClick={toggleWidget}
          primaryColor={config.theme?.primaryColor}
        />
      )}
      
      {isOpen && (
        <div className="chat-window">
          {!isFormSubmitted ? (
            <ContactForm 
              config={config}
              onSubmit={handleFormSubmit}
              onClose={closeWidget}
            />
          ) : (
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onClose={closeWidget}
              isAgentOnline={isAgentOnline}
              isAgentTyping={isAgentTyping}
              customerInfo={customerInfo}
              config={config}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;