import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';
import './styles.css';

// Hàm khởi tạo widget
const initChatWidget = (config = {}) => {
  // Cấu hình mặc định
  const defaultConfig = {
    serverUrl: 'http://localhost:5000',
    position: 'bottom-right',
    welcomeMessage: 'Xin chào! Chúng tôi có thể giúp gì cho bạn?',
    theme: {
      primaryColor: '#3B82F6',
      textColor: '#374151',
      backgroundColor: '#FFFFFF'
    },
    fields: [
      { name: 'name', label: 'Họ tên', type: 'text', required: true },
      { name: 'phone', label: 'Số điện thoại', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email', required: false },
      { name: 'address', label: 'Địa chỉ', type: 'text', required: false },
      { name: 'content', label: 'Nội dung cần hỗ trợ', type: 'textarea', required: true }
    ]
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Tạo container cho widget
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'chat-widget-container';
  widgetContainer.style.cssText = `
    position: fixed;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  `;

  // Xác định vị trí widget
  const position = mergedConfig.position || 'bottom-right';
  const positions = {
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;',
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;'
  };

  widgetContainer.style.cssText += positions[position] || positions['bottom-right'];

  document.body.appendChild(widgetContainer);

  // Render React component
  const root = createRoot(widgetContainer);
  root.render(<ChatWidget config={mergedConfig} />);

  return {
    destroy: () => {
      root.unmount();
      document.body.removeChild(widgetContainer);
    },
    updateConfig: (newConfig) => {
      const updatedConfig = { ...mergedConfig, ...newConfig };
      root.render(<ChatWidget config={updatedConfig} />);
    }
  };
};

// Export cho sử dụng với module systems
export default initChatWidget;

// Global variable cho việc nhúng trực tiếp
if (typeof window !== 'undefined') {
  window.initChatWidget = initChatWidget;
  
  // Auto-init nếu có cấu hình sẵn
  if (window.ChatWidgetConfig) {
    window.addEventListener('DOMContentLoaded', () => {
      initChatWidget(window.ChatWidgetConfig);
    });
  }
}