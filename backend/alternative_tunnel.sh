#!/bin/bash

echo "Attempting to start an alternative tunnel using localhost.run..."
echo "This uses SSH port forwarding and is more likely to work through firewalls."
echo "You will get a random URL like https://something.localhost.run"
echo ""
echo "Press Ctrl+C to stop."
echo ""

# Try localhost.run
# Forwarding local port 8001 (since 8000 is stuck) to remote port 80
ssh -n -o StrictHostKeyChecking=no -R 80:localhost:8001 nokey@localhost.run
