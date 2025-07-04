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

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống

- Docker và Docker Compose
- Node.js 18+ (cho development)
- MongoDB (hoặc sử dụng Docker)

### 1. Clone repository

```bash
git clone <repository-url>
cd realtime-chat-system
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục gốc:

```env
# JWT Secret Key
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Allowed origins (phân cách bằng dấu phẩy)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com

# Server URL cho client
REACT_APP_SERVER_URL=http://localhost:5000
```

### 3. Chạy với Docker Compose

```bash
# Build và start tất cả services
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Tạo agents mặc định

```bash
# Vào container server
docker-compose exec server sh

# Chạy script tạo agents
node scripts/create-agents.js
```

## 📱 Sử dụng

### Dashboard Agent

Truy cập: `http://localhost:3000` (hoặc domain của bạn)

**Tài khoản demo:**
- Agent 1: `agent1@example.com` / `123456`
- Agent 2: `agent2@example.com` / `123456`

### Nhúng Widget vào website

Thêm đoạn code sau vào trang HTML:

```html
<script>
  window.ChatWidgetConfig = {
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
      { name: 'content', label: 'Nội dung', type: 'textarea', required: true }
    ]
  };
</script>
<script src="http://localhost:5000/widget/chat-widget.js"></script>
```

### Demo Widget

Truy cập: `http://localhost:3001` để xem demo widget

## 🔧 Development

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
# Build tất cả
npm run build

# Hoặc build từng phần
npm run server:build
npm run widget:build
npm run dashboard:build
```

## 🚀 Triển khai Production

### 1. Chuẩn bị VPS Ubuntu

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Cài Docker Compose
sudo apt install docker-compose-plugin -y
```

### 2. Clone và cấu hình

```bash
git clone <repository-url>
cd realtime-chat-system

# Sửa cấu hình cho production
cp .env.example .env
nano .env

# Cập nhật domain trong nginx/nginx.conf
nano nginx/nginx.conf
```

### 3. Triển khai

```bash
# Build và start
docker-compose -f docker-compose.prod.yml up -d

# Tạo agents
docker-compose exec server node scripts/create-agents.js
```

### 4. Cấu hình SSL với Let's Encrypt

```bash
# Cài đặt SSL certificate
./scripts/setup-ssl.sh yourdomain.com

# Renew certificate tự động
crontab -e
# Thêm dòng: 0 12 * * * /path/to/certbot renew --quiet
```

## 📊 Monitoring

### Kiểm tra health các services

```bash
# Kiểm tra containers
docker-compose ps

# Xem logs
docker-compose logs -f server
docker-compose logs -f dashboard
docker-compose logs -f widget

# Kiểm tra MongoDB
docker-compose exec mongodb mongosh
```

### Health check endpoints

- Backend: `http://localhost:5000/api/health`
- Dashboard: `http://localhost:3000`
- Widget: `http://localhost:3001`

## 🔧 Tùy chỉnh

### Thêm trường form tùy chỉnh

```javascript
fields: [
  { name: 'name', label: 'Họ tên', type: 'text', required: true },
  { name: 'phone', label: 'Số điện thoại', type: 'tel', required: true },
  { 
    name: 'department', 
    label: 'Phòng ban', 
    type: 'select', 
    required: false,
    options: [
      { value: 'sales', label: 'Kinh doanh' },
      { value: 'support', label: 'Hỗ trợ' },
      { value: 'technical', label: 'Kỹ thuật' }
    ]
  }
]
```

### Tùy chỉnh theme

```javascript
theme: {
  primaryColor: '#10B981',    // Màu chủ đạo
  textColor: '#374151',       // Màu text
  backgroundColor: '#FFFFFF', // Màu nền
  borderRadius: '12px',       // Bo góc
  fontFamily: 'Arial, sans-serif'
}
```

## 📁 Cấu trúc dự án

```
realtime-chat-system/
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── config/        # Cấu hình database
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── socket/        # Socket.IO handlers
│   │   └── middleware/    # Middleware functions
│   └── scripts/           # Scripts tiện ích
├── client-widget/         # Widget React
│   ├── src/
│   │   ├── components/    # React components
│   │   └── styles/        # CSS styles
│   └── public/            # Static files
├── client-dashboard/      # Dashboard React
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── contexts/      # React contexts
│   └── public/            # Static files
├── nginx/                 # Nginx configurations
├── docker-compose.yml     # Docker orchestration
└── README.md             # Tài liệu này
```

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Container không start được**
   ```bash
   docker-compose logs <service-name>
   docker-compose restart <service-name>
   ```

2. **Không kết nối được MongoDB**
   ```bash
   docker-compose exec mongodb mongosh
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

## 📞 Hỗ trợ

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem wiki
- **Email**: support@yourdomain.com

## 📄 License

MIT License - xem file `LICENSE` để biết thêm chi tiết.

---

Made with ❤️ by Your Team