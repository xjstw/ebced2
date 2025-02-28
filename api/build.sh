#!/bin/bash

# Hata durumunda scripti durdur
set -e

echo "Starting build process..."

# Frontend dizinine git
cd ../frontend

# Node.js bağımlılıklarını yükle
echo "Installing dependencies..."
npm install

# Frontend'i build et
echo "Building frontend..."
npm run build

# Static klasörünü temizle ve yeniden oluştur
echo "Preparing static directory..."
rm -rf ../api/static
mkdir -p ../api/static

# Build çıktısını kopyala
echo "Copying build output..."
cp -r dist/* ../api/static/

echo "Build process completed successfully!" 