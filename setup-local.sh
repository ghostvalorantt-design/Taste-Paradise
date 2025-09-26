#!/bin/bash

echo
echo "========================================"
echo "   Taste Paradise - Local Setup"
echo "========================================"
echo

echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "After installation, restart your terminal and run this script again."
    exit 1
else
    echo "✅ Node.js found: $(node --version)"
fi

echo
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    exit 1
else
    echo "✅ npm found: $(npm --version)"
fi

echo
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python not found!"
        echo "Please install Python from https://python.org/"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi
echo "✅ Python found: $($PYTHON_CMD --version)"

echo
echo "Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

echo
echo "Activating virtual environment and installing Python dependencies..."
source venv/bin/activate
pip install -r backend/requirements.txt

echo
echo "Installing Node.js dependencies..."
cd frontend
npm install
cd ..

echo
echo "Installing concurrently for running both services..."
npm install

echo
echo "========================================"
echo "   Setup Complete! 🎉"
echo "========================================"
echo
echo "To start the application:"
echo "1. Open VS Code: code ."
echo "2. Use Ctrl+Shift+P and run 'Tasks: Run Task'"
echo "3. Select 'Start Both Services'"
echo
echo "Or run manually:"
echo "- Backend: cd backend && $PYTHON_CMD -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"
echo "- Frontend: cd frontend && npm start"
echo