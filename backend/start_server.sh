#!/bin/bash

# Exit on error
set -e

echo "Starting Backend Server..."

# Activate venv
source venv/bin/activate

# Kill existing processes
fuser -k 8001/tcp || true
pkill -f uvicorn || true
pkill -f "lt --port 8001" || true
# Wait a moment for the port to clear
sleep 2

# Start uvicorn
PORT=8001
nohup uvicorn app.main:app --host 0.0.0.0 --port $PORT > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID) on port $PORT"

# Start LocalTunnel
nohup npx localtunnel --port $PORT --subdomain rstm > tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "Tunnel started (PID $TUNNEL_PID)"

echo "Logs: backend.log, tunnel.log"
