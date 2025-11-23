#!/bin/bash
set -e

echo "🔧 Installing backend dependencies..."
cd backend
npm install --production

echo "✅ Backend build complete!"
echo "ℹ️ Frontend будет деплоиться отдельно на Cloudflare Pages"
