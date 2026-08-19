#!/bin/bash
# ============================================
# ClipForge — Полная настройка VDS (с нуля)
# ============================================
# Запусти на чистом Ubuntu/Debian VDS:
#   curl -sL https://raw.githubusercontent.com/.../setup.sh | bash
# Или загрузи и запусти: bash setup.sh

set -e

DOMAIN=""          # Твой домен (например clipforge.ru)
APP_DIR="/var/www/clipforge"
LOG_DIR="/var/log/clipforge"
EMAIL=""           # Email для Let's Encrypt

echo "🔧 ClipForge VDS Setup"
echo "======================"

if [ -z "$DOMAIN" ]; then
  read -p "🌐 Домен (например clipforge.ru): " DOMAIN
fi
if [ -z "$EMAIL" ]; then
  read -p "📧 Email для SSL证书: " EMAIL
fi

echo ""
echo "Домен: $DOMAIN"
echo "Папка: $APP_DIR"
echo ""

# 1. Системные пакеты
echo "📦 [1/8] Системные пакеты..."
sudo apt update -qq
sudo apt install -y -qq curl git build-essential nginx ufw

# Certbot (пробуем разные способы)
if ! command -v certbot &> /dev/null; then
  echo "📦 Установка Certbot..."
  sudo apt install -y -qq certbot python3-certbot-nginx 2>/dev/null || \
  sudo snap install --classic certbot 2>/dev/null || \
  echo "⚠️  Установи certbot вручную: sudo snap install --classic certbot"
  sudo ln -sf /snap/bin/certbot /usr/bin/certbot 2>/dev/null || true
fi

# 2. Node.js 22.x
echo "📦 [2/8] Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y -qq nodejs
fi
echo "   Node $(node -v), npm $(npm -v)"

# 3. FFmpeg
echo "📦 [3/8] FFmpeg..."
sudo apt install -y -qq ffmpeg

# 4. PM2
echo "📦 [4/8] PM2..."
sudo npm install -g pm2

# 5. Директории
echo "📁 [5/8] Директории..."
sudo mkdir -p $APP_DIR $LOG_DIR $APP_DIR/storage $APP_DIR/uploads
sudo chown -R $USER:$USER $APP_DIR $LOG_DIR

# 6. Клонирование
echo "📥 [6/8] Клонирование кода..."
if [ ! -d "$APP_DIR/.git" ]; then
  read -p "🔗 Git URL репозитория: " REPO_URL
  git clone $REPO_URL $APP_DIR
fi
cd $APP_DIR

# 7. Сборка
echo "🔨 [7/8] Сборка..."
cp .env.production .env

# Генерируем случайный JWT_SECRET
RANDOM_SECRET=$(openssl rand -hex 32)
sed -i "s/clipforge-production-SUPER-SECRET-KEY-CHANGE-ME/$RANDOM_SECRET/" .env

npm ci --omit=dev
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# Запуск
pm2 delete clipforge clipforge-worker 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

# 8. Nginx + SSL
echo "🌐 [8/8] Nginx + SSL..."

# Создаём конфиг
sudo tee /etc/nginx/sites-available/clipforge > /dev/null << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 4G;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
}
NGINX

# SSL (сначала без ssl, certbot создаст)
sudo tee /etc/nginx/sites-available/clipforge-temp > /dev/null << NGINX_TEMP
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINX_TEMP

sudo ln -sf /etc/nginx/sites-available/clipforge-temp /etc/nginx/sites-enabled/clipforge
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Получаем SSL
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

# Переключаем на полный конфиг
sudo ln -sf /etc/nginx/sites-available/clipforge /etc/nginx/sites-enabled/clipforge
sudo nginx -t
sudo systemctl reload nginx

# Firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw --force enable

echo ""
echo "✅ ClipForge развёрнут!"
echo ""
echo "🌐 Сайт: https://$DOMAIN"
echo "📊 Статус: pm2 status"
echo "📝 Логи: pm2 logs clipforge"
echo "🔄 Обновление: git pull && npm run build && pm2 restart all"
