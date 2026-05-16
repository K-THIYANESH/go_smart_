#!/usr/bin/env bash
# exit on error
set -o errexit

# --- Frontend Build ---
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# --- Backend Build ---
echo "Installing Backend Dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# --- Data Preparation ---
# Note: For Render Free Tier, we ensure the graph is ready.
# If you have a cached graph, make sure it's in the repo or downloaded here.
python backend/init_osm_data.py
