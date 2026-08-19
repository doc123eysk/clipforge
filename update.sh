#!/bin/bash
# ============================================
# ClipForge — Quick Update (после первого деплоя)
# ============================================
# Запусти на VDS: bash update.sh

set -e
cd /var/www/clipforge

echo "🔄 ClipForge Update"
echo "==================="

echo "📥 Обновление кода..."
git pull

echo "📦 Обновление пакетов..."
npm ci --omit=dev

echo "🗄️  Миграции..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "🔨 Сборка..."
npm run build

echo "🚀 Перезапуск..."
pm2 restart clipforge clipforge-worker

echo ""
echo "✅ Готово!"
pm2 status
