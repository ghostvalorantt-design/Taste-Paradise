# 🏪 Taste Paradise - Local Development Setup

## 📁 Project Structure
```
taste-paradise/
├── frontend/          # React frontend
├── backend/           # FastAPI backend
├── requirements.txt   # Python dependencies
├── package.json      # Root package.json for easy setup
└── README.md         # This file
```

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- MongoDB installed locally or use MongoDB Atlas

### 1. Download & Extract
1. Download `taste-paradise-local.zip` 
2. Extract to your desired folder
3. Open the folder in VS Code

### 2. Backend Setup
```bash
# Navigate to project root
cd taste-paradise

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Set up environment variables
cd backend
cp .env.example .env  # Edit as needed
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install
# OR if you prefer yarn:
yarn install
```

### 4. Database Setup
- **Option 1**: Install MongoDB locally
- **Option 2**: Use MongoDB Atlas (cloud) and update MONGO_URL in backend/.env

### 5. Run the Application

#### Terminal 1 - Backend:
```bash
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
# OR
yarn start
```

### 6. Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

## 🔧 VS Code Configuration

### Recommended Extensions
- Python
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Prettier - Code formatter

### VS Code Settings (create .vscode/settings.json)
```json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### VS Code Tasks (create .vscode/tasks.json)
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "python",
      "args": ["-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "8001"],
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "dedicated"
      }
    },
    {
      "label": "Start Frontend",
      "type": "shell", 
      "command": "npm",
      "args": ["start"],
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always", 
        "focus": false,
        "panel": "dedicated"
      }
    }
  ]
}
```

## 🛠️ Troubleshooting

### Node.js Not Recognized
If Node.js is not recognized, check:
1. **Installation**: Download from https://nodejs.org/
2. **PATH Variable**: Ensure Node.js is in your PATH
3. **Restart VS Code** after installing Node.js
4. **Check version**: `node --version` and `npm --version`

### Python Issues
1. **Virtual Environment**: Always activate venv before running backend
2. **Dependencies**: Run `pip install -r backend/requirements.txt`
3. **Python Path**: Use `python -m uvicorn` instead of just `uvicorn`

### MongoDB Connection
1. **Local MongoDB**: Start MongoDB service
2. **Connection String**: Update MONGO_URL in backend/.env
3. **Atlas**: Use connection string from MongoDB Atlas

## 🎯 Development Workflow

1. **Start both services** using VS Code tasks or separate terminals
2. **Frontend runs on** http://localhost:3000 with hot reload
3. **Backend runs on** http://localhost:8001 with auto-reload
4. **Make changes** and see them reflected immediately
5. **Use VS Code debugging** for both Python and React

## 📝 Important Notes

- **Port Configuration**: Frontend connects to backend via localhost:8001
- **Hot Reload**: Both frontend and backend support hot reloading
- **Database**: MongoDB is required for backend functionality
- **Environment Variables**: Update .env files as needed for local setup

Happy coding! 🚀