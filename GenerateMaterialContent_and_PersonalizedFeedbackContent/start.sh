#!/bin/bash

# Education API Startup Script
# Port: 8000

echo "🚀 Starting Education API on port 8000..."

# Set environment variables if not already set
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-sk-0417c99a0fa4443a9351febeb1e1b9e6}"
export DEEPSEEK_BASE_URL="${DEEPSEEK_BASE_URL:-https://api.deepseek.com}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo "✅ Starting server..."
python main.py

