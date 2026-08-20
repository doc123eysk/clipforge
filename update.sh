#!/bin/bash
set -e
cd /var/www/clipforge
git pull
npm ci
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
pm2 restart all
echo "✅ Updated!"
