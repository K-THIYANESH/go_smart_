#!/usr/bin/env bash
# exit on error
set -o errexit

# --- Frontend Build ---
echo "Building Frontend (Node 20+)..."
cd frontend
# Remove local lockfiles that might cause native binding issues on Linux
rm -rf node_modules package-lock.json
npm install
npm run build
cd ..

# --- Backend Build ---
echo "Installing Backend Dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# --- Data Preparation ---
python backend/init_osm_data.py
