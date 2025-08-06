#!/bin/bash

echo "🚀 HRIS Staging Monitor - Vue 3 + Vite Setup"
echo "==========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your AWS configuration"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev    - Start development server"
echo "  npm run build  - Build for production"
echo "  npm run deploy - Deploy to S3"
echo ""
echo "Starting development server..."
npm run dev