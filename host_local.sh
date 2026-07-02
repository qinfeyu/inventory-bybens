#!/bin/bash

# Exit on error
set -e

PROJECT_DIR="/home/mohamed/.gemini/antigravity/scratch/stock-management"
PORT=5000

echo "=== POTY Portal Local Database & Web Hosting Setup ==="
echo "Project directory: $PROJECT_DIR"
echo "Target port: $PORT"
echo ""

# 1. Install dependencies and build production bundle
echo "Step 1: Installing dependencies and building production files..."
cd "$PROJECT_DIR"
npm install
npm run build

# 2. Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=== Setup Completed Successfully! ==="
echo ""
echo "To start the unified SQLite & Web Server manually, run:"
echo "  PORT=$PORT node server/index.cjs"
echo ""
echo "Once started, you can access the app at:"
echo "  - Local: http://localhost:$PORT"
echo "  - On your local Wi-Fi network (Phone, Tablet, etc.): http://$LOCAL_IP:$PORT"
echo ""
echo "--------------------------------------------------"
echo "Would you like to set this up to run automatically on startup? (systemd)"
echo "If yes, copy and paste these commands into your terminal:"
echo ""
echo "1. Create the systemd service file:"
echo "sudo bash -c 'cat > /etc/systemd/system/poty-portal.service <<EOF"
echo "[Unit]"
echo "Description=POTY Business Portal SQLite & Web Server"
echo "After=network.target"
echo ""
echo "[Service]"
echo "Type=simple"
echo "User=mohamed"
echo "Environment=PORT=$PORT"
echo "WorkingDirectory=$PROJECT_DIR"
echo "ExecStart=/usr/bin/node $PROJECT_DIR/server/index.cjs"
echo "Restart=always"
echo "RestartSec=10"
echo ""
echo "[Install]"
echo "WantedBy=multi-user.target"
echo "EOF'"
echo ""
echo "2. Reload systemd, enable and start the service:"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl enable poty-portal.service"
echo "sudo systemctl start poty-portal.service"
echo ""
echo "3. Check service status:"
echo "sudo systemctl status poty-portal.service"
echo "--------------------------------------------------"
