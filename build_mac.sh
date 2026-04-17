#!/bin/bash
set -e

echo "Cleaning up temp dir..."
rm -rf /tmp/ReseolabX-build
mkdir -p /tmp/ReseolabX-build

echo "Copying project (excluding node_modules)..."
rsync -a --exclude 'node_modules' --exclude 'dist' --exclude 'dist-electron' --exclude 'release' . /tmp/ReseolabX-build/

cd /tmp/ReseolabX-build
echo "Installing dependencies..."
npm install

echo "Building macOS DMG..."
npm run build
npx electron-builder --mac

echo "Copying DMG back..."
cp -R release/*.dmg "/Users/muhammadalshorbagy/Documents/Work files/Antigravity/Research hub/release/" || true
cp -R release/mac* "/Users/muhammadalshorbagy/Documents/Work files/Antigravity/Research hub/release/" || true

echo "Done!"
