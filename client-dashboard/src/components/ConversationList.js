import React from 'react';

const ConversationList = ({
  conversations,
  activeConversation,
  loading,
  filters,
  onFiltersChange,
  onConversationSelect,
  onAssignConversation,
  onCloseConversation,
  currentAgent
}) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Đang chờ</span>;
      case 'active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Hoạt động</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Đã đóng</span>;
      default:
        return null;
    }
  };

  const canAssign = (conversation) => {
    return !conversation.assignedAgent || conversation.assignedAgent._id === currentAgent._id;
  };

  const canClose = (conversation) => {
    return conversation.assignedAgent?._id === currentAgent._id && conversation.status !== 'closed';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header với filters */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cuộc hội thoại</h2>
        
        <div className="space-y-3">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Tìm theo tên, số điện thoại..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="waiting">Đang chờ</option>
              <option value="active">Hoạt động</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="spinner border-primary-500 border-t-transparent w-6 h-6 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Không có cuộc hội thoại nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  activeConversation?.conversationId === conversation.conversationId
                    ? 'bg-primary-50 border-r-2 border-primary-500'
                    : ''
                }`}
                onClick={() => onConversationSelect(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.customer.name}
                      </h3>
                      {getStatusBadge(conversation.status)}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-1">
                      {conversation.customer.phone}
                    </p>

                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {conversation.lastMessage.sender === 'customer' ? '👤 ' : '🧑‍💼 '}
                        {conversation.lastMessage.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {conversation.lastMessage 
                          ? formatTime(conversation.lastMessage.timestamp)
                          : formatTime(conversation.createdAt)
                        }
                      </span>
                      
                      {conversation.assignedAgent && (
                        <span className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-1 ${
                            conversation.assignedAgent.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          {conversation.assignedAgent.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="ml-2 flex flex-col space-y-1">
                    {!conversation.assignedAgent && conversation.status === 'waiting' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssignConversation(conversation.conversationId);
                        }}
                        className="text-xs bg-primary-500 text-white px-2 py-1 rounded hover:bg-primary-600 transition-colors"
                        title="Nhận cuộc hội thoại"
                      >
                        Nhận
                      </button>
                    )}

                    {canClose(conversation) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Bạn có chắc muốn đóng cuộc hội thoại này?')) {
                            onCloseConversation(conversation.conversationId);
                          }
                        }}
                        className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                        title="Đóng cuộc hội thoại"
                      >
                        Đóng
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer online status */}
                {conversation.isCustomerOnline && (
                  <div className="flex items-center mt-2 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Khách hàng đang online
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;