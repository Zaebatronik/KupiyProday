#!/bin/bash
set -e

echo "🔨 Building frontend..."
cd frontend
npm install
npm run build

echo "📦 Copying frontend to backend..."
rm -rf ../backend/dist
cp -r dist ../backend/

echo "🔧 Installing backend dependencies..."
cd ../backend
npm install

echo "✅ Build complete!"
