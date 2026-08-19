#!/bin/bash
# ============================================
# ClipForge — Deploy Script for VDS (Ubuntu/Debian)
# ============================================
# Запусти на VDS: bash deploy.sh

set -e

APP_DIR="/var/www/clipforge"
LOG_DIR="/var/log/clipforge"
REPO_URL=""

echo "🚀 ClipForge Deploy"
echo "==================="

# 1. Системные зависимости
echo ""
echo "📦 Установка зависимостей..."
sudo apt update -qq
sudo apt install -y -qq curl git build-essential ffmpeg

# 2. Установка Node.js 22.x
if ! command -v node &> /dev/null; then
  echo "📦 Установка Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y -qq nodejs
fi
echo "Node: $(node -v) | npm: $(npm -v)"

# 3. Установка PM2
if ! command -v pm2 &> /dev/null; then
  echo "📦 Установка PM2..."
  sudo npm install -g pm2
fi

# 4. Создание директорий
echo ""
echo "📁 Создание директорий..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p $APP_DIR/storage
sudo mkdir -p $APP_DIR/uploads
sudo chown -R $USER:$USER $APP_DIR $LOG_DIR

# 5. Клонирование/обновление репозитория
if [ -d "$APP_DIR/.git" ]; then
  echo "🔄 Обновление кода..."
  cd $APP_DIR
  git pull
else
  if [ -z "$REPO_URL" ]; then
    echo "❌ Укажи REPO_URL в скрипте или загрузи код в $APP_DIR вручную"
    echo "   Например: git clone https://github.com/user/clipforge.git $APP_DIR"
    exit 1
  fi
  echo "📥 Клонирование репозитория..."
  git clone $REPO_URL $APP_DIR
  cd $APP_DIR
fi

# 6. Установка npm зависимостей
echo ""
echo "📦 Установка npm пакетов..."
npm ci --omit=dev

# 7. Генерация Prisma клиента
echo ""
echo "🗄️  Генерация Prisma..."
npx prisma generate

# 8. Применение миграций
echo ""
echo "🗄️  Применение миграций БД..."
npx prisma db push --accept-data-loss

# 9. Сборка Next.js
echo ""
echo "🔨 Сборка Next.js..."
npm run build

# 10. Запуск через PM2
echo ""
echo "🚀 Запуск приложения..."
pm2 delete clipforge clipforge-worker 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# 11. Автозапуск при перезагрузке
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo "✅ Деплой завершён!"
echo ""
echo "📊 Статус:"
pm2 status
echo ""
echo "📝 Логи: pm2 logs clipforge"
echo "🔄 Рестарт: pm2 restart clipforge"
echo "🌐 Сайт: http://$(hostname -I | awk '{print $1}'):3000"
