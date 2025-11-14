#!/bin/bash

# AgentTrace Startup Script
# This script helps you get started with AgentTrace

echo "🕵️ AgentTrace - The Debugger for AI Agents"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the agent-trace root directory"
    exit 1
fi

echo "📋 Setting up AgentTrace..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.9+"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Python and Node.js are installed"
echo ""

# Setup backend
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Backend setup complete"
echo ""

# Setup frontend
echo "⚛️ Setting up React frontend..."
cd ../frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete"
echo ""

# Create environment files if they don't exist
cd ../backend
if [ ! -f ".env" ]; then
    echo "📝 Creating backend environment file..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your Supabase credentials"
fi

cd ../frontend
if [ ! -f ".env.local" ]; then
    echo "📝 Creating frontend environment file..."
    cp env.local.example .env.local
    echo "⚠️  Please edit frontend/.env.local with your API URL"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Edit backend/.env with your Supabase credentials"
echo "2. Edit frontend/.env.local with your API URL"
echo "3. Run the database schema: database/schema.sql in your Supabase project"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Backend (Terminal 1):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "📁 Example traces are available in the examples/ directory"
echo "🕵️ Happy debugging!"
