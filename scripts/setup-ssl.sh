#!/bin/bash

# Script cài đặt SSL certificate với Let's Encrypt
# Usage: ./setup-ssl.sh yourdomain.com

set -e

DOMAIN=$1
EMAIL="admin@${DOMAIN}"

if [ -z "$DOMAIN" ]; then
    echo "❌ Vui lòng cung cấp domain name"
    echo "Usage: $0 yourdomain.com"
    exit 1
fi

echo "🔐 Cài đặt SSL certificate cho domain: $DOMAIN"

# Kiểm tra Docker Compose đang chạy
if ! docker-compose ps | grep -q "Up"; then
    echo "⚠️  Khởi động Docker Compose trước..."
    docker-compose up -d
fi

# Tạo thư mục cho certbot
mkdir -p certbot/www
mkdir -p certbot/conf

# Tạo certificate đầu tiên
echo "📝 Tạo certificate Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate đã được tạo thành công!"
    
    # Restart nginx để áp dụng SSL
    echo "🔄 Restart Nginx để áp dụng SSL..."
    docker-compose restart nginx
    
    echo "🎉 SSL đã được cấu hình thành công!"
    echo "🌐 Website có thể truy cập tại: https://$DOMAIN"
    
    # Hiển thị thông tin renew certificate
    echo ""
    echo "📅 Để tự động renew certificate, thêm vào crontab:"
    echo "0 12 * * * docker-compose run --rm certbot renew --quiet && docker-compose restart nginx"
    
else
    echo "❌ Lỗi khi tạo SSL certificate"
    echo "💡 Kiểm tra:"
    echo "   - Domain đã trỏ về server này chưa"
    echo "   - Port 80 có bị chặn không"
    echo "   - Firewall có cho phép traffic không"
    exit 1
fi