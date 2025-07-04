import React, { useState, useRef, useEffect } from 'react';

const ChatWindow = ({ 
  messages, 
  onSendMessage, 
  onTyping, 
  onClose, 
  isAgentOnline, 
  isAgentTyping,
  customerInfo,
  config 
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping]);

  // Focus vào input khi mở chat
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onTyping();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAvatar = (sender, senderInfo) => {
    if (senderInfo?.avatar) {
      return senderInfo.avatar;
    }

    // Avatar mặc định
    const firstLetter = senderInfo?.name?.charAt(0)?.toUpperCase() || '?';
    const bgColor = sender === 'customer' ? '#3B82F6' : '#10B981';
    
    return (
      <div 
        className="default-avatar"
        style={{ backgroundColor: bgColor }}
      >
        {firstLetter}
      </div>
    );
  };

  return (
    <div className="chat-window-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-info">
          <div className="status-indicator">
            <div className={`status-dot ${isAgentOnline ? 'online' : 'offline'}`}></div>
            <span className="status-text">
              {isAgentOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
            </span>
          </div>
          <h3>Hỗ trợ trực tuyến</h3>
        </div>
        <button 
          onClick={onClose}
          className="close-button"
          aria-label="Đóng chat"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div 
            key={message._id || index}
            className={`message ${message.sender}`}
          >
            <div className="message-avatar">
              {typeof getAvatar(message.sender, message.senderInfo) === 'string' ? (
                <img 
                  src={getAvatar(message.sender, message.senderInfo)} 
                  alt={message.senderInfo?.name || 'Avatar'}
                />
              ) : (
                getAvatar(message.sender, message.senderInfo)
              )}
            </div>
            
            <div className="message-content">
              <div className="message-bubble">
                <div className="message-text">{message.content}</div>
              </div>
              <div className="message-meta">
                <span className="message-sender">{message.senderInfo?.name}</span>
                <span className="message-time">{formatTime(message.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isAgentTyping && (
          <div className="message agent">
            <div className="message-avatar">
              <div className="default-avatar" style={{ backgroundColor: '#10B981' }}>
                A
              </div>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">Đang nhập...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Nhập tin nhắn..."
            className="chat-input"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="send-button"
            aria-label="Gửi tin nhắn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
        
        {/* Customer info badge */}
        <div className="customer-info-badge">
          <span>Chào {customerInfo?.name}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;