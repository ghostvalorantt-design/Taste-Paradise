@echo off
echo.
echo ========================================
echo   Taste Paradise - Local Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    echo After installation, restart VS Code and run this script again.
    pause
    exit /b 1
) else (
    echo ✅ Node.js found: 
    node --version
)

echo.
echo Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found!
    pause
    exit /b 1
) else (
    echo ✅ npm found:
    npm --version
)

echo.
echo Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found!
    echo Please install Python from https://python.org/
    pause
    exit /b 1
) else (
    echo ✅ Python found:
    python --version
)

echo.
echo Creating Python virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

echo.
echo Activating virtual environment and installing Python dependencies...
call venv\Scripts\activate
pip install -r backend\requirements.txt

echo.
echo Installing Node.js dependencies...
cd frontend
npm install
cd ..

echo.
echo Installing concurrently for running both services...
npm install

echo.
echo ========================================
echo   Setup Complete! 🎉
echo ========================================
echo.
echo To start the application:
echo 1. Open VS Code: code .
echo 2. Use Ctrl+Shift+P and run "Tasks: Run Task"
echo 3. Select "Start Both Services"
echo.
echo Or run manually:
echo - Backend: cd backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
echo - Frontend: cd frontend && npm start
echo.
pause