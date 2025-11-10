#!/bin/bash

echo "🚀 Setting up Inventory & Sales API..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed or not in PATH."
    echo "   Please install MongoDB: brew install mongodb-community"
    exit 1
fi

echo "✅ MongoDB is installed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your settings."
fi

# Start MongoDB if not running
echo ""
echo "🔍 Checking MongoDB status..."
if pgrep -x mongod > /dev/null; then
    echo "✅ MongoDB is already running"
else
    echo "🚀 Starting MongoDB..."
    brew services start mongodb-community
    sleep 2
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the API server, run:"
echo "  npm run dev    (development mode with auto-restart)"
echo "  npm start      (production mode)"
echo ""
echo "The API will be available at: http://localhost:5000"
echo "API Documentation: See README.md"
