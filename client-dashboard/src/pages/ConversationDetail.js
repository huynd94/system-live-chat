import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ChatArea from '../components/ChatArea';
import axios from 'axios';

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { agent } = useAuth();
  const { setActiveConversation, activeConversation } = useSocket();
  
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/conversations/${conversationId}`);
      
      if (response.data.success) {
        const conv = response.data.data.conversation;
        setConversation(conv);
        setActiveConversation(conv);
      } else {
        setError('Không tìm thấy cuộc hội thoại');
      }
    } catch (error) {
      console.error('Load conversation error:', error);
      setError('Lỗi khi tải cuộc hội thoại');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner border-primary-500 border-t-transparent w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải cuộc hội thoại...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={handleBack}
            className="btn-primary"
          >
            Quay về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Chat với {conversation?.customer?.name}
              </h1>
              <p className="text-sm text-gray-500">
                {conversation?.customer?.phone} • {conversation?.customer?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              conversation?.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : conversation?.status === 'waiting'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {conversation?.status === 'active' && 'Đang hoạt động'}
              {conversation?.status === 'waiting' && 'Đang chờ'}
              {conversation?.status === 'closed' && 'Đã đóng'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        <ChatArea 
          conversation={conversation}
          agent={agent}
          fullPage={true}
        />
      </div>
    </div>
  );
};

export default ConversationDetail;