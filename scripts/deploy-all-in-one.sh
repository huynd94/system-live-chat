#!/bin/bash

# All-in-one deploy script for system-live-chat on Ubuntu 20.04
# Usage: bash deploy-all-in-one.sh [DOMAIN]

set -e

REPO_URL="https://github.com/huynd94/system-live-chat.git"
APP_DIR="system-live-chat"
DOMAIN=${1:-""}
EMAIL="admin@${DOMAIN:-yourdomain.com}"

# Lấy IP public của VPS
IP=$(curl -s ifconfig.me)

echo "=============================="
echo "🚀 Triển khai hệ thống chat real-time"
echo "=============================="
sleep 1

# 1. Cập nhật hệ thống & cài Docker, Docker Compose
echo "🔧 Cài đặt Docker & Docker Compose..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git

if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
  sudo apt install -y docker-compose
fi

# 2. Clone source code
if [ ! -d "$APP_DIR" ]; then
  echo "📦 Clone source code từ $REPO_URL ..."
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "🔄 Source code đã tồn tại, pull latest..."
  cd "$APP_DIR"
  git pull
  cd ..
fi

cd "$APP_DIR"

# 3. Tạo file .env nếu chưa có
if [ ! -f ".env" ]; then
  echo "📝 Tạo file .env ..."
  cp .env.example .env
  if [ -n "$DOMAIN" ]; then
    sed -i "s|yourdomain.com|$DOMAIN|g" .env
    sed -i "s|admin@yourdomain.com|$EMAIL|g" .env
    sed -i "s|REACT_APP_SERVER_URL=.*|REACT_APP_SERVER_URL=https://$DOMAIN|g" .env
  fi
fi

# 4. Build & start Docker Compose
echo "🐳 Build và start Docker Compose ..."
sudo docker-compose pull
sudo docker-compose up -d --build

# 5. Đợi các service khởi động
echo "⏳ Đợi các service khởi động (30s)..."
sleep 30

# 6. Tạo agents mặc định
echo "👥 Tạo agents mặc định ..."
sudo docker-compose exec -T server node scripts/create-agents.js

# 7. Hướng dẫn SSL nếu có domain
if [ -n "$DOMAIN" ]; then
  echo ""
  echo "🔐 Để cài đặt SSL Let's Encrypt, chạy lệnh sau:"
  echo "   sudo bash scripts/setup-ssl.sh $DOMAIN"
  echo ""
  echo "🌐 Truy cập Dashboard: https://$DOMAIN"
  echo "🌐 Nhúng widget: <script src=\"https://$DOMAIN/widget/chat-widget.js\"></script>"
else
  echo ""
  echo "🌐 Truy cập Dashboard: http://$IP:3000"
  echo "🌐 Widget demo: http://$IP:3001"
  echo "🌐 API: http://$IP:5000/api"
fi

echo ""
echo "👤 Tài khoản demo:"
echo "   Agent 1: agent1@example.com / 123456"
echo "   Agent 2: agent2@example.com / 123456"
echo ""
echo "🎉 Hoàn tất triển khai!"
echo "Xem logs: sudo docker-compose logs -f"
echo "Dừng hệ thống: sudo docker-compose down"