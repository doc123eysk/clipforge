#!/bin/bash
set -e

APP_DIR="/var/www/clipforge"
LOG_DIR="/var/log/clipforge"

echo "🔧 ClipForge Setup"
echo "=================="

# Deps
apt update -qq && apt install -y -qq curl git build-essential nginx ffmpeg

# Node
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y -qq nodejs
fi

# PM2
npm install -g pm2 2>/dev/null

# Dirs
mkdir -p $APP_DIR $LOG_DIR
chown -R $USER:$USER $APP_DIR $LOG_DIR

# Clone
if [ ! -d "$APP_DIR/.git" ]; then
  read -p "Git URL: " REPO_URL
  git clone $REPO_URL $APP_DIR
fi
cd $APP_DIR

# Build
cp .env.production .env
sed -i "s/CHANGE-ME-TO-RANDOM-SECRET/$(openssl rand -hex 32)/" .env
npm ci
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# PM2
pm2 delete clipforge clipforge-worker 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo "✅ Done! pm2 status to check."
