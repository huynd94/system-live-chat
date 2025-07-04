import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Sidebar from '../components/Sidebar';
import ConversationList from '../components/ConversationList';
import ChatArea from '../components/ChatArea';
import axios from 'axios';

const Dashboard = () => {
  const { agent, logout } = useAuth();
  const { 
    conversations, 
    setConversations, 
    activeConversation, 
    setActiveConversation,
    connected 
  } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [filters]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const response = await axios.get(`/api/conversations?${params}`);
      
      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleAssignConversation = async (conversationId) => {
    try {
      const response = await axios.post(`/api/conversations/${conversationId}/assign`);
      
      if (response.data.success) {
        // Cập nhật conversation trong danh sách
        setConversations(prev => prev.map(conv => 
          conv.conversationId === conversationId 
            ? response.data.data.conversation 
            : conv
        ));
        
        // Nếu đang xem conversation này, cập nhật activeConversation
        if (activeConversation?.conversationId === conversationId) {
          setActiveConversation(response.data.data.conversation);
        }
      }
    } catch (error) {
      console.error('Assign conversation error:', error);
      alert('Lỗi khi gán cuộc hội thoại: ' + (error.response?.data?.message || 'Lỗi server'));
    }
  };

  const handleCloseConversation = async (conversationId) => {
    try {
      const response = await axios.post(`/api/conversations/${conversationId}/close`);
      
      if (response.data.success) {
        // Cập nhật conversation trong danh sách
        setConversations(prev => prev.map(conv => 
          conv.conversationId === conversationId 
            ? response.data.data.conversation 
            : conv
        ));
        
        // Nếu đang xem conversation này, cập nhật activeConversation
        if (activeConversation?.conversationId === conversationId) {
          setActiveConversation(response.data.data.conversation);
        }
      }
    } catch (error) {
      console.error('Close conversation error:', error);
      alert('Lỗi khi đóng cuộc hội thoại: ' + (error.response?.data?.message || 'Lỗi server'));
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        agent={agent}
        connected={connected}
        onLogout={logout}
      />

      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          loading={loading}
          filters={filters}
          onFiltersChange={setFilters}
          onConversationSelect={handleConversationSelect}
          onAssignConversation={handleAssignConversation}
          onCloseConversation={handleCloseConversation}
          currentAgent={agent}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <ChatArea 
            conversation={activeConversation}
            agent={agent}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn cuộc hội thoại</h3>
              <p className="text-gray-500">Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;