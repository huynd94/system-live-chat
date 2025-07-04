# Hệ thống Chat Real-time

Hệ thống chat real-time hoàn chỉnh có thể tích hợp vào bất kỳ website nào thông qua đoạn mã nhúng JavaScript.

## ✨ Tính năng chính

- 💬 **Widget chat nhúng**: Tích hợp dễ dàng vào website
- 👥 **Dashboard agent**: Giao diện quản trị cho 2 agents
- 📱 **Real-time**: Tin nhắn tức thời với Socket.IO
- 📋 **Form tùy chỉnh**: Cấu hình trường thông tin linh hoạt
- 🔐 **Bảo mật**: JWT authentication, CORS protection
- 🐳 **Docker**: Triển khai dễ dàng với Docker Compose
- 🔒 **SSL**: Hỗ trợ HTTPS với Let's Encrypt

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Widget   │    │   Dashboard     │    │   Nginx Proxy   │
│   (React)       │    │   (React)       │    │   (SSL/HTTPS)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend API   │
                    │   (Node.js +    │
                    │   Socket.IO)    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Database      │
                    └─────────────────┘
```

---

## 🚀 Triển khai nhanh với All-in-One Script (Ubuntu 20.04)

### 1. SSH vào VPS Ubuntu 20.04

### 2. Tải và chạy script tự động:

```bash
wget -O deploy-all-in-one.sh https://raw.githubusercontent.com/huynd94/system-live-chat/main/scripts/deploy-all-in-one.sh
chmod +x deploy-all-in-one.sh
```

#### **Chạy không domain (test local):**
```bash
bash deploy-all-in-one.sh
```

#### **Chạy với domain (triển khai production):**
```bash
bash deploy-all-in-one.sh yourdomain.com
```

Script sẽ tự động:
- Cài Docker, Docker Compose
- Clone code từ repo: https://github.com/huynd94/system-live-chat
- Build & chạy toàn bộ hệ thống
- Tạo agents mặc định
- Hướng dẫn cài SSL nếu có domain

#### **Cài SSL Let's Encrypt (sau khi hệ thống đã chạy):**
```bash
sudo bash scripts/setup-ssl.sh yourdomain.com
```

---

## 📱 Sử dụng

### Dashboard Agent
- Truy cập: `http://<VPS_IP>:3000` hoặc `https://yourdomain.com`
- **Tài khoản demo:**
  - Agent 1: `agent1@example.com` / `123456`
  - Agent 2: `agent2@example.com` / `123456`

### Nhúng Widget vào website

```html
<script>
  window.ChatWidgetConfig = {
    serverUrl: 'http://<VPS_IP>:5000', // hoặc https://yourdomain.com
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
      { name: 'content', label: 'Nội dung', type: 'textarea', required: true }
    ]
  };
</script>
<script src="http://<VPS_IP>:5000/widget/chat-widget.js"></script>
<!-- hoặc -->
<script src="https://yourdomain.com/widget/chat-widget.js"></script>
```

### Widget demo: `http://<VPS_IP>:3001` hoặc `https://yourdomain.com/widget/demo.html`

---

## 🔧 Development (phát triển thủ công)

### Chạy từng thành phần riêng lẻ
```bash
# Server
cd server
npm install
npm run dev

# Widget
cd client-widget
npm install
npm run dev

# Dashboard
cd client-dashboard
npm install
npm start
```

### Build production
```bash
npm run build
```

---

## 📁 Cấu trúc dự án

```
system-live-chat/
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── config/        # Cấu hình database
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── socket/        # Socket.IO handlers
│   │   └── middleware/    # Middleware functions
│   └── scripts/           # Scripts tiện ích
├── client-widget/         # Widget React
├── client-dashboard/      # Dashboard React
├── nginx/                 # Nginx configurations
├── scripts/               # Script triển khai, SSL
├── docker-compose.yml     # Docker orchestration
└── README.md              # Tài liệu này
```

---

## 🐛 Troubleshooting

1. **Container không start được**
   ```bash
   sudo docker-compose logs <service-name>
   sudo docker-compose restart <service-name>
   ```
2. **Không kết nối được MongoDB**
   ```bash
   sudo docker-compose exec mongodb mongosh
   # Kiểm tra kết nối database
   ```
3. **Widget không hiển thị**
   - Kiểm tra CORS configuration
   - Kiểm tra network connectivity
   - Xem browser console errors
4. **Socket.IO không hoạt động**
   - Kiểm tra firewall/proxy settings
   - Verify WebSocket support
   - Check nginx configuration

---

## 📞 Hỗ trợ
- **Issues**: Tạo issue trên GitHub
- **Email**: support@yourdomain.com

## 📄 License
MIT License

---

Made with ❤️ by Your Team