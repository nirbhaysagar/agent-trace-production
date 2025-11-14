@echo off
REM AgentTrace Startup Script for Windows
REM This script helps you get started with AgentTrace

echo 🕵️ AgentTrace - The Debugger for AI Agents
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "README.md" (
    echo ❌ Please run this script from the agent-trace root directory
    pause
    exit /b 1
)

echo 📋 Setting up AgentTrace...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed. Please install Python 3.9+
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed. Please install Node.js 18+
    pause
    exit /b 1
)

echo ✅ Python and Node.js are installed
echo.

REM Setup backend
echo 🐍 Setting up Python backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo ✅ Backend setup complete
echo.

REM Setup frontend
echo ⚛️ Setting up React frontend...
cd ..\frontend

REM Install dependencies
echo Installing Node.js dependencies...
npm install

echo ✅ Frontend setup complete
echo.

REM Create environment files if they don't exist
cd ..\backend
if not exist ".env" (
    echo 📝 Creating backend environment file...
    copy env.example .env
    echo ⚠️  Please edit backend\.env with your Supabase credentials
)

cd ..\frontend
if not exist ".env.local" (
    echo 📝 Creating frontend environment file...
    copy env.local.example .env.local
    echo ⚠️  Please edit frontend\.env.local with your API URL
)

echo.
echo 🎉 Setup complete!
echo.
echo 📖 Next steps:
echo 1. Edit backend\.env with your Supabase credentials
echo 2. Edit frontend\.env.local with your API URL
echo 3. Run the database schema: database\schema.sql in your Supabase project
echo.
echo 🚀 To start the application:
echo.
echo Backend (Command Prompt 1):
echo   cd backend
echo   venv\Scripts\activate.bat
echo   uvicorn main:app --reload
echo.
echo Frontend (Command Prompt 2):
echo   cd frontend
echo   npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
echo 📁 Example traces are available in the examples\ directory
echo 🕵️ Happy debugging!
echo.
pause
