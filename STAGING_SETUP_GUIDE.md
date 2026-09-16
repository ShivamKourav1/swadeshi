# Staging Environment Setup Guide: `dev.panchp.in`

This guide provides end-to-end instructions for deploying the **Staging / Testing environment** for **Vastu Bhandar** under the subdomain **`https://dev.panchp.in`**.

---

## 📋 Architecture & Isolation Highlights

| Component | Production (`panchp.in`) | Staging (`dev.panchp.in`) |
| :--- | :--- | :--- |
| **URL** | `https://panchp.in` | `https://dev.panchp.in` |
| **Directory** | `/var/www/ecommerce` | `/var/www/ecommerce-staging` |
| **Docker Compose** | `docker-compose.prod.yml` | `docker-compose.staging.yml` |
| **App Container** | `ecommerce-app` | `ecommerce-staging-app` |
| **Web Container** | `ecommerce-web` (Port 8080) | `ecommerce-staging-web` (Port 8081) |
| **Database** | PostgreSQL (`ecommerce_db`) | PostgreSQL (`ecommerce_staging_db`) |
| **Redis Cache** | `vastu_cache_*` | `vastu_staging_cache_*` |
| **Uploads Storage** | `storage_uploads` volume | `storage_staging_uploads` volume |
| **Environment** | `APP_ENV=production` | `APP_ENV=staging` (`APP_DEBUG=true`) |
| **Deploy Script** | `./deploy.sh` | `./deploy-staging.sh` |

> [!TIP]
> Both environments run side-by-side on the **same AWS EC2 instance** using an Nginx host reverse proxy. Deploying, restarting, or running database migrations in Staging will **never** interrupt or affect Production.

---

## 🛠️ Step-by-Step Implementation Guide

### Step 1: Add DNS Record in BigRock (User Side)

1. Log in to the [BigRock Control Panel](https://manage.bigrock.in/).
2. Navigate to **Manage Orders** ➔ **List/Search Orders** ➔ Click on **`panchp.in`**.
3. In the right panel, scroll down to **DNS Management** and click **Manage DNS**.
4. Click **Add A Record**:
   - **Host Name**: `dev`
   - **Destination IPv4 Address**: Enter your **AWS Elastic IP** (the exact same IP used for `panchp.in`, e.g. `13.235.XX.XX`).
   - **TTL**: `7200` (or default).
   - Click **Add Record**.
5. **Verify DNS Propagation** (Wait 5–15 minutes, then run in your local PowerShell):
   ```powershell
   Resolve-DnsName dev.panchp.in
   ```
   *Expected: Returns your AWS Elastic IP.*

---

### Step 2: Connect to your AWS EC2 Server

Open PowerShell on your computer:
```powershell
ssh -i "C:\Users\Shivam\.ssh\panchp-key.pem" ubuntu@YOUR_AWS_ELASTIC_IP
```

---

### Step 3: Configure Host Nginx Reverse Proxy (On the Server)

The host Nginx will receive incoming traffic on port 80/443 and route:
- `panchp.in` ➔ `http://127.0.0.1:8080` (Production)
- `dev.panchp.in` ➔ `http://127.0.0.1:8081` (Staging)

#### 3.1 Install Nginx on Ubuntu Host
```bash
sudo apt update
sudo apt install -y nginx
```

#### 3.2 Create the Host Nginx Virtual Host
```bash
sudo nano /etc/nginx/sites-available/panchp-multi.conf
```
Paste the following configuration:
```nginx
# 1. PRODUCTION: panchp.in & www.panchp.in -> Port 8080
server {
    listen 80;
    listen [::]:80;
    server_name panchp.in www.panchp.in;

    client_max_body_size 64M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 300;
    }
}

# 2. STAGING: dev.panchp.in -> Port 8081
server {
    listen 80;
    listen [::]:80;
    server_name dev.panchp.in;

    client_max_body_size 64M;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 300;
    }
}
```
Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

#### 3.3 Activate Configuration
```bash
sudo ln -sf /etc/nginx/sites-available/panchp-multi.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 4: Adjust Production to Port 8080 (If currently on port 80)

In `/var/www/ecommerce`:
1. Edit `.env`:
   ```bash
   cd /var/www/ecommerce
   nano .env
   ```
2. Add or update:
   ```dotenv
   HTTP_PORT=8080
   HTTPS_PORT=8443
   ```
3. Restart production containers:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
   *Now `panchp.in` is running behind host Nginx on port 8080.*

---

### Step 5: Deploy the Staging Environment (`dev.panchp.in`)

#### 5.1 Clone Repository into `/var/www/ecommerce-staging`
```bash
cd /var/www
git clone https://github.com/ShivamKourav1/swadeshi.git ecommerce-staging
cd ecommerce-staging
```

#### 5.2 Configure Staging `.env`
```bash
cp .env.staging.example .env
nano .env
```
Ensure the following variables are set:
```dotenv
APP_NAME="वस्तु भंडार (Staging)"
APP_ENV=staging
APP_DEBUG=true
APP_URL=https://dev.panchp.in

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=ecommerce_staging_db
DB_USERNAME=ecommerce_staging_user
DB_PASSWORD=YOUR_STRONG_STAGING_DB_PASSWORD

REDIS_PASSWORD=YOUR_STRONG_STAGING_REDIS_PASSWORD

HTTP_PORT=8081
HTTPS_PORT=8444
```

#### 5.3 Generate Staging `APP_KEY`
```bash
docker run --rm -v $(pwd):/app -w /app composer:2 php -r "echo 'base64:' . base64_encode(random_bytes(32)) . PHP_EOL;"
```
Copy the generated string and paste it into `.env` as `APP_KEY=base64:...`.

#### 5.4 Make Scripts Executable and Start Staging
```bash
chmod +x deploy-staging.sh docker/entrypoint.sh
docker compose -f docker-compose.staging.yml up -d --build
```

#### 5.5 Verify Staging Status
```bash
docker compose -f docker-compose.staging.yml ps
```
All containers (`ecommerce-staging-postgres`, `ecommerce-staging-redis`, `ecommerce-staging-app`, `ecommerce-staging-web`, `ecommerce-staging-queue`, `ecommerce-staging-scheduler`) should report `Up (healthy)`.

---

### Step 6: Setup Free SSL/HTTPS with Let's Encrypt (User Side)

Now configure SSL for **both** domains using Certbot on the host:
```bash
sudo certbot --nginx -d panchp.in -d www.panchp.in -d dev.panchp.in
```
- Enter your email when prompted.
- Select `Y` to agree to terms.
- Certbot will automatically install SSL certificates and configure HTTPS redirects in `/etc/nginx/sites-available/panchp-multi.conf`!

#### Test Auto-Renewal:
```bash
sudo certbot renew --dry-run
```

---

### Step 7: Seed Staging Demo Data (Optional)

To populate staging with sample products, organizational units, and test users:
```bash
docker compose -f docker-compose.staging.yml exec -T app php artisan db:seed
```

---

## 🔄 Routine Deployment Workflow

### To update Staging (`dev.panchp.in`):
```bash
cd /var/www/ecommerce-staging
./deploy-staging.sh
```

### To update Production (`panchp.in`):
```bash
cd /var/www/ecommerce
./deploy.sh
```

---

## 🎯 Verification Checklist

- [ ] `https://panchp.in` loads Production with valid SSL certificate lock.
- [ ] `https://dev.panchp.in` loads Staging with valid SSL certificate lock.
- [ ] Orders created in Staging do **not** appear in Production database.
- [ ] `./deploy-staging.sh` completes without errors and preserves zero downtime.
