#!/bin/bash

# Exit on error
set -e

echo "Starting deployment setup..."

# 1. Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install it first."
    exit 1
fi

# 2. Check for Node.js and npm (required for localtunnel)
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    echo "On Ubuntu/Debian: sudo apt update && sudo apt install -y nodejs npm"
    exit 1
fi

# 3. Set up Python Virtual Environment
echo "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# 4. Install Python Dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 5. Install localtunnel (if not already installed)
if ! command -v lt &> /dev/null; then
    echo "Installing localtunnel..."
    sudo npm install -g localtunnel || echo "Failed to install localtunnel globally. You might need to run with sudo or use npx."
fi

# 6. Start the Backend Server
echo "Starting FastAPI backend..."
# Kill any existing process on the target port
PORT=8001
fuser -k $PORT/tcp || true
pkill -f uvicorn || true
# Wait a moment for the port to clear
sleep 2

# Start uvicorn in the background
# Use a different port if 8000 is stuck
echo "Using port $PORT"

nohup uvicorn app.main:app --host 0.0.0.0 --port $PORT > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID. Logs are in backend.log"

# 7. Start LocalTunnel
echo "Starting LocalTunnel on https://rstm.loca.lt ..."
# Run in a loop to handle crashes
nohup bash -c "while true; do npx localtunnel --port $PORT --subdomain rstm; echo 'Tunnel crashed. Restarting...'; sleep 5; done" > tunnel.log 2>&1 &
TUNNEL_PID=$!

echo "Deployment complete!"
echo "Backend is running on port 8001."
echo "Tunnel is running. Check tunnel.log for the URL if the requested subdomain was not available."
echo "To stop the server, run: kill $BACKEND_PID $TUNNEL_PID"
