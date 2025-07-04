import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const ChatArea = ({ conversation, agent, fullPage = false }) => {
  const { 
    messages, 
    setMessages, 
    sendMessage, 
    joinConversation, 
    startTyping, 
    stopTyping 
  } = useSocket();
  
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages khi chọn conversation
  useEffect(() => {
    if (conversation) {
      loadMessages();
      joinConversation(conversation.conversationId);
    }
  }, [conversation]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/conversations/${conversation.conversationId}/messages`);
      
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || sending) {
      return;
    }

    setSending(true);
    
    try {
      sendMessage(conversation.conversationId, inputValue.trim());
      setInputValue('');
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        stopTyping(conversation.conversationId);
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Typing indicator
    startTyping(conversation.conversationId);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversation.conversationId);
    }, 3000);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAvatar = (sender, senderInfo) => {
    const firstLetter = senderInfo?.name?.charAt(0)?.toUpperCase() || '?';
    const bgColor = sender === 'customer' ? '#3B82F6' : '#10B981';
    
    return (
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
        style={{ backgroundColor: bgColor }}
      >
        {firstLetter}
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Chọn cuộc hội thoại để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      {!fullPage && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {conversation.customer.name}
              </h3>
              <p className="text-sm text-gray-500">
                {conversation.customer.phone} • {conversation.customer.email}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${
                conversation.isCustomerOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
              <span className="text-sm text-gray-500">
                {conversation.isCustomerOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="spinner border-primary-500 border-t-transparent w-6 h-6 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message._id || index}
              className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${
                message.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <div className={`flex-shrink-0 ${
                  message.sender === 'agent' ? 'ml-2' : 'mr-2'
                }`}>
                  {getAvatar(message.sender, message.senderInfo)}
                </div>
                
                <div className={`${
                  message.sender === 'agent' ? 'text-right' : 'text-left'
                }`}>
                  <div className={`inline-block p-3 rounded-lg ${
                    message.sender === 'agent'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'agent' ? 'text-right' : 'text-left'
                  }`}>
                    <span>{message.senderInfo?.name}</span>
                    <span className="mx-1">•</span>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Customer info */}
        <div className="mb-3 text-xs text-gray-500 border border-gray-200 rounded p-2 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Tên:</strong> {conversation.customer.name}</div>
            <div><strong>SĐT:</strong> {conversation.customer.phone}</div>
            {conversation.customer.email && (
              <div><strong>Email:</strong> {conversation.customer.email}</div>
            )}
            {conversation.customer.address && (
              <div><strong>Địa chỉ:</strong> {conversation.customer.address}</div>
            )}
          </div>
          
          {/* Custom fields */}
          {conversation.customer.customFields && Object.keys(conversation.customer.customFields).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              {Object.entries(conversation.customer.customFields).map(([key, value]) => (
                <div key={key} className="mb-1">
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message input */}
        {conversation.status !== 'closed' && 
         conversation.assignedAgent?._id === agent._id ? (
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || sending}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="spinner w-4 h-4"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-2 text-gray-500 text-sm">
            {conversation.status === 'closed' 
              ? 'Cuộc hội thoại đã được đóng'
              : 'Bạn không được phép trả lời cuộc hội thoại này'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;