#!/bin/bash

# Script triển khai hệ thống chat real-time
# Usage: ./deploy.sh [development|production]

set -e

MODE=${1:-development}
DOMAIN=${2:-localhost}

echo "🚀 Triển khai hệ thống chat real-time - Mode: $MODE"

# Kiểm tra Docker và Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt"
    exit 1
fi

# Tạo file .env nếu chưa có
if [ ! -f .env ]; then
    echo "📝 Tạo file .env..."
    cat > .env << EOF
# JWT Secret Key
JWT_SECRET=$(openssl rand -base64 32)

# Allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://$DOMAIN

# Server URL cho client
REACT_APP_SERVER_URL=http://localhost:5000
EOF
    
    if [ "$MODE" = "production" ]; then
        sed -i "s|http://localhost:5000|https://$DOMAIN|g" .env
        sed -i "s|localhost|$DOMAIN|g" .env
    fi
    
    echo "✅ File .env đã được tạo"
fi

# Build và start services
echo "🏗️  Build và start Docker containers..."
if [ "$MODE" = "production" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
else
    docker-compose up -d --build
fi

# Đợi services khởi động
echo "⏳ Đợi services khởi động..."
sleep 30

# Kiểm tra health của các services
echo "🔍 Kiểm tra health của services..."

# Kiểm tra MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB hoạt động bình thường"
else
    echo "❌ MongoDB có vấn đề"
fi

# Kiểm tra Backend
if curl -f http://localhost:5000/api/health &> /dev/null; then
    echo "✅ Backend hoạt động bình thường"
else
    echo "❌ Backend có vấn đề"
fi

# Kiểm tra Dashboard
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Dashboard hoạt động bình thường"
else
    echo "❌ Dashboard có vấn đề"
fi

# Kiểm tra Widget
if curl -f http://localhost:3001 &> /dev/null; then
    echo "✅ Widget hoạt động bình thường"
else
    echo "❌ Widget có vấn đề"
fi

# Tạo agents mặc định
echo "👥 Tạo agents mặc định..."
docker-compose exec -T server node scripts/create-agents.js

echo ""
echo "🎉 Triển khai hoàn tất!"
echo ""
echo "📱 Các URL truy cập:"
echo "   Dashboard: http://localhost:3000"
echo "   Widget Demo: http://localhost:3001"
echo "   API: http://localhost:5000/api"
echo ""
echo "👤 Tài khoản agents:"
echo "   Agent 1: agent1@example.com / 123456"
echo "   Agent 2: agent2@example.com / 123456"
echo ""

if [ "$MODE" = "production" ]; then
    echo "🔐 Để cài đặt SSL certificate, chạy:"
    echo "   ./scripts/setup-ssl.sh $DOMAIN"
    echo ""
fi

echo "📊 Để xem logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Để dừng hệ thống:"
echo "   docker-compose down"