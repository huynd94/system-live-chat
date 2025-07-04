import React from 'react';

const ChatButton = ({ onClick, primaryColor = '#3B82F6' }) => {
  return (
    <button
      onClick={onClick}
      className="chat-button"
      style={{ backgroundColor: primaryColor }}
      aria-label="Mở chat hỗ trợ"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="white"
        className="chat-icon"
      >
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
      
      {/* Pulse animation */}
      <div className="chat-button-pulse"></div>
    </button>
  );
};

export default ChatButton;