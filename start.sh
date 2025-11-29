#!/bin/bash
# Quick Start Script for Wearable AI Companion

echo "🚀 Wearable AI Companion - Quick Setup"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8+"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Navigate to backend directory
cd backend/ || exit 1

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo ""
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo ""
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env configuration file..."
    cat > .env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here

# Groq Configuration (Optional)
GROQ_API_KEY=gsk-your-key-here

# AI Mode: true for local, false for cloud
USE_LOCAL_AI=false

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8765
EOF
    
    echo "⚠️  Please edit .env with your API keys!"
fi

# Start the server
echo ""
echo "🤖 Starting Wearable AI Companion Backend..."
echo ""
echo "🌐 Open your browser and navigate to:"
echo "   http://localhost:8765"
echo ""
echo "📱 Or from another device on the network:"
echo "   http://$(hostname -I | awk '{print $1}'):8765"
echo ""

python main.py
