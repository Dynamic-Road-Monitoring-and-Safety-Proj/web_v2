# Deployment Instructions

Follow these steps to deploy the backend to your server.

## Server Details
- **IP Address:** `202.164.41.66` (Public) or `10.1.41.14` (Internal/VPN)
- **Username:** `studentiotlab`
- **Password:** `<yk what>`

## Step 1: Copy Files to the Server

Open a terminal on your local machine (where this project is) and run the following command to copy the `backend` folder to the server.

**Note:** You will be prompted for the password (`<yk what>`).

```bash
# Using the public IP (try this first if you are not on the same network)
scp -r backend studentiotlab@202.164.41.66:~/backend_deploy

# OR using the internal IP (if the above fails or you are on the VPN)
scp -r backend studentiotlab@10.1.41.14:~/backend_deploy
```

## Step 2: Connect to the Server

SSH into the server.

```bash
# Using the public IP
ssh studentiotlab@202.164.41.66

# OR using the internal IP
ssh studentiotlab@10.1.41.14
```

Enter the password `<yk what>` when prompted.

## Step 3: Run the Deployment Script

Once you are logged into the server, navigate to the folder and run the deployment script.

```bash
cd backend_deploy
chmod +x deploy.sh start_server.sh alternative_tunnel.sh
./deploy.sh
```

## Step 4: Verify Deployment

The script will start the backend server and the localtunnel.

1.  **Check Backend Logs:**
    ```bash
    tail -f backend.log
    ```
    You should see "Application startup complete".

2.  **Check Tunnel URL:**
    ```bash
    cat tunnel.log
    ```
    It should show a URL like `https://rstm.loca.lt`.

## Troubleshooting

-   **Permission Denied:** If `deploy.sh` fails to install packages, you might need to install system dependencies manually using `sudo`.
    ```bash
    sudo apt update
    sudo apt install python3-venv python3-pip nodejs npm
    ```
-   **Port in Use:** The script tries to kill processes on port 8000. If it fails, manually find and kill the process.
-   **Tunnel Issues (Connection Refused):**
    -   The error `connection refused: localtunnel.me:XXXXX` usually means the university/lab firewall is blocking the connection.
    -   I have updated `deploy.sh` to try to restart the tunnel automatically.
    -   **Alternative Solution:** If `localtunnel` keeps failing, try the alternative tunnel script included in the folder. It uses SSH (port 22) which is often allowed through firewalls.
        ```bash
        chmod +x alternative_tunnel.sh
        ./alternative_tunnel.sh
        ```
        This will give you a different URL (e.g., `https://random-name.localhost.run`) which you can use instead.

-   **LocalTunnel Reminder Page:** When you first access the tunnel URL in a browser, you might see a page asking for a password or to click a button. This is a security feature of LocalTunnel.
    -   To bypass this for API calls, you can add the header `Bypass-Tunnel-Reminder: true` to your requests.
    -   Or, visit the URL once in your browser and click "Click to Continue".
    -   The password is usually the IP address of the server running the tunnel. You can find it by running `curl ipv4.icanhazip.com` on the server.

## Managing the Server

### Start the Server
If the server is stopped or you need to restart it, use the `start_server.sh` script. This will start the backend on port 8001 and attempt to start the LocalTunnel.

```bash
cd ~/backend_deploy
./start_server.sh
```

If LocalTunnel fails (check `tunnel.log`), run the alternative tunnel manually:
```bash
./alternative_tunnel.sh
```

### Stop the Server
To stop the backend and the tunnel, run:

```bash
pkill -f uvicorn
pkill -f localtunnel
```

If you are running `alternative_tunnel.sh`, simply press `Ctrl+C` in that terminal window to stop the tunnel.
