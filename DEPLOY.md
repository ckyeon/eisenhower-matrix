# Deployment & Development Guide

This project consists of two main parts:
1.  **Backend (`server`)**: A Node.js/Express server with SQLite database.
2.  **Frontend (`app`)**: A React application wrapped in Tauri for macOS.

---

## 1. Local Development (Getting Started)

### 1.1. Prerequisites
*   **Node.js** (v18+)
*   **Rust** (for Tauri)
*   **Xcode Command Line Tools** (for macOS development)

### 1.2. Backend Setup
1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    ```bash
    cp .env.example .env
    ```
    *   Edit `.env` and set `JWT_SECRET` (e.g., `dev-secret-key`).
4.  Start the server:
    ```bash
    node index.js
    ```
    *   The server runs on `http://localhost:3001`.

### 1.3. Frontend Setup
1.  Navigate to the `app` directory:
    ```bash
    cd app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development app:
    ```bash
    npm run tauri dev
    ```

---

## 2. Backend Deployment (Production)

The backend is deployed using Docker and Nginx on a Linux server.

### 2.1. Server Prerequisites
*   Docker & Docker Compose
*   Nginx
*   Certbot (for SSL)

### 2.2. Configuration
1.  Clone the repository on your server.
2.  Navigate to `server`:
    ```bash
    cd server
    ```
3.  Create `.env` file:
    ```bash
    cp .env.example .env
    ```
4.  **Important**: Update `.env` with a strong `JWT_SECRET` for production.

### 2.3. Run with Docker Compose
From the project root:
```bash
docker compose up -d --build
```

### 2.4. Nginx Configuration (Reverse Proxy)
Configure Nginx to proxy requests to the backend container.

1.  Create config file:
    ```bash
    sudo nano /etc/nginx/sites-available/your-domain.com
    ```
2.  Add configuration:
    ```nginx
    server {
        server_name your-domain.com;

        location /api/ {
            # Rewrite /api/foo -> /foo
            rewrite ^/api/(.*) /$1 break;
            
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
3.  Enable site and restart Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```
4.  Setup SSL:
    ```bash
    sudo certbot --nginx -d your-domain.com
    ```

---

## 3. Client Build (macOS App)

Build the macOS application (`.dmg`) for distribution.

### 3.1. Configure Production API
Create `app/.env.production` to point to your deployed backend:
```bash
VITE_API_URL=https://your-domain.com/api
```

### 3.2. Build App
```bash
cd app
npm run tauri build
```

### 3.3. Artifacts
The built application will be located in:
`app/src-tauri/target/release/bundle/dmg/`
