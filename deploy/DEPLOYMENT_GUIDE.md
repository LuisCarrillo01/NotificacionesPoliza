# Guía de Despliegue en Google Cloud (Ubuntu)

## Prerequisitos
- Instancia Ubuntu en Google Cloud
- Acceso SSH configurado
- Repositorio Git con código subido

---

## 1. Conectarse a la instancia

```bash
# Conectarse vía SSH
gcloud compute ssh <INSTANCE_NAME> --zone=<ZONE>

# O directamente si tienes la IP
ssh -i /path/to/ssh/key username@<INSTANCE_IP>
```

---

## 2. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 3. Instalar dependencias globales

### 3.1 Node.js 20+ (para Backend y Frontend build)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs npm
node --version  # Verificar
```

### 3.2 Python 3.13+ (para Agent)
```bash
sudo apt install -y python3.13 python3.13-venv python3-pip
python3.13 --version  # Verificar
```

### 3.3 PostgreSQL Client (para migrar BD)
```bash
sudo apt install -y postgresql-client
```

### 3.4 Git
```bash
sudo apt install -y git
git --version  # Verificar
```

### 3.5 Nginx (como reverse proxy)
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3.6 PM2 (para gestionar procesos Node.js y Python)
```bash
sudo npm install -g pm2
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup -u $USER --hp /home/$USER
```

---

## 4. Clonar el repositorio

```bash
cd /opt  # Carpeta recomendada para aplicaciones
sudo git clone <https://github.com/LuisCarrillo01/NotificacionesPoliza.git> notificacion-validacion-poliza
sudo chown -R $USER:$USER notificacion-validacion-poliza
cd notificacion-validacion-poliza
```

---

## 5. Configurar Base de Datos (PostgreSQL)

### 5.1 Opción A: Base de datos en Google Cloud SQL (RECOMENDADO para producción)

```bash
# Conectarse a Cloud SQL (deberá tener configurado el proxy)
# https://cloud.google.com/sql/docs/postgres/connect-overview

# Migrar schema
psql -h <CLOUD_SQL_IP> -U <DB_USER> -d <DB_NAME> < schema_postgresql.sql
```

### 5.2 Opción B: PostgreSQL local en la instancia

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos y usuario
sudo -u postgres psql << EOF
CREATE DATABASE NotiPolisas;
CREATE USER poliza_user WITH PASSWORD 'your_secure_password';
ALTER ROLE poliza_user SET client_encoding TO 'utf8';
ALTER ROLE poliza_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE poliza_user SET default_transaction_deferrable TO on;
ALTER ROLE poliza_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE NotiPolisas TO poliza_user;
EOF

CREATE DATABASE NotiPolisas;
CREATE USER poliza_user WITH PASSWORD '1234';
ALTER ROLE poliza_user SET client_encoding TO 'utf8';
ALTER ROLE poliza_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE poliza_user SET default_transaction_deferrable TO on;
ALTER ROLE poliza_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE NotiPolisas TO poliza_user;
\q


# Migrar schema
psql -U poliza_user -d NotiPolisas < schema_postgresql.sql
```

---

## 6. Desplegar Backend (Node.js)

### 6.1 Instalar dependencias
```bash
cd /opt/notificacion-validacion-poliza/BackEnd
npm install
```

### 6.2 Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # Editar con tus valores:
```cd

Valores clave para `.env` del Backend:
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost  # o IP de Cloud SQL
DB_PORT=5432
DB_USER=poliza_user
DB_PASSWORD=your_secure_password
DB_NAME=notificacion_poliza
API_BASE_URL=http://localhost:4000  # Agent
VALIDATION_RESULT_CALLBACK_TOKEN=your_secure_token_123
JWT_SECRET=your_jwt_secret_key_here
```

### 6.3 Build y ejecutar con PM2
```bash
# Iniciar con PM2
pm2 start "npm start" --name "backend" --cwd /opt/notificacion-validacion-poliza/BackEnd
pm2 save
pm2 startup
```

Verificar:
```bash
pm2 list
pm2 logs backend
```

---

## 7. Desplegar Agent (Python)

### 7.1 Crear virtual environment
```bash
cd /opt/notificacion-validacion-poliza/Agent
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 7.2 Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # Editar con tus valores:
```

Valores clave para `.env` del Agent:
```env
API_BASE_URL=http://localhost:3000/api
VALIDATION_RESULT_CALLBACK_TOKEN=your_secure_token_123
DATABASE_URL=postgresql://poliza_user:your_secure_password@localhost:5432/notificacion_poliza
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_if_needed
```

### 7.3 Ejecutar con PM2
```bash
# Crear script de inicio
cat > /tmp/start-agent.sh << 'EOF'
#!/bin/bash
cd /opt/notificacion-validacion-poliza/Agent
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 4000
EOF

chmod +x /tmp/start-agent.sh

# Iniciar con PM2
pm2 start "/tmp/start-agent.sh" --name "agent" --interpreter bash
pm2 save
```

Verificar:
```bash
pm2 list
pm2 logs agent
```

---

## 8. Construir y servir Frontend (React + Vite)

### 8.1 Instalar dependencias
```bash
cd /opt/notificacion-validacion-poliza/Frontend
npm install
```

### 8.2 Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # Editar:
```

Valores clave para `.env` del Frontend:
```env
VITE_API_BASE_URL=http://your-domain.com/api  # O IP pública
VITE_APP_NAME=Validacion de polizas
VITE_APP_ENV=production
```

### 8.3 Construir
```bash
npm run build
# Esto genera la carpeta 'dist/'
```

---

## 9. Configurar Nginx como Reverse Proxy

### 9.1 Crear archivo de configuración
```bash
sudo nano /etc/nginx/sites-available/default
```

Reemplazar contenido con:
```nginx
upstream backend {
    server 127.0.0.1:3000;
}

upstream agent {
    server 127.0.0.1:4000;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    # Frontend
    location / {
        alias /opt/notificacion-validacion-poliza/Frontend/dist/;
        try_files $uri $uri/ /index.html;
        
        # Headers para SPA
        add_header Cache-Control "public, max-age=3600" always;
    }
    
    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout para operaciones largas
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Agent API (si necesitas exponerlo)
    location /agent {
        rewrite ^/agent/(.*)$ /$1 break;
        proxy_pass http://agent;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 9.2 Validar y reiniciar Nginx
```bash
sudo nginx -t  # Verificar sintaxis
sudo systemctl restart nginx
```

---

## 10. SSL/TLS con Let's Encrypt (Opcional pero recomendado)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Generar certificado
sudo certbot --nginx -d your-domain.com

# Auto-renovación
sudo systemctl enable certbot.timer
```

---

## 11. Monitoreo y Logs

### Verificar estado de servicios
```bash
pm2 list
pm2 logs backend
pm2 logs agent
sudo systemctl status nginx
```

### Ver logs en tiempo real
```bash
pm2 logs -f backend
pm2 logs -f agent
```

### Restart de servicios
```bash
pm2 restart backend
pm2 restart agent
sudo systemctl restart nginx
```

---

## 12. Firewall y Seguridad

```bash
# Abrir puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend
sudo ufw allow 4000/tcp  # Agent
sudo ufw allow 5173/tcp  # Frontend (Vite dev server)
sudo ufw enable

# Ver reglas
sudo ufw status
```

### 12.1 Firewall de Google Cloud (Abrir puerto 5173)

```bash
# Opción A: Usar gcloud CLI (si tienes gcloud configurado)
gcloud compute firewall-rules create allow-vite-5173 \
  --allow tcp:5173 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Vite dev server on port 5173"

# Verificar que la regla se creó
gcloud compute firewall-rules list --filter="name:allow-vite-5173"
```

**Opción B: Google Cloud Console**
1. Ve a **VPC Network** → **Firewall Rules**
2. Click en **CREATE FIREWALL RULE**
3. Rellena los campos:
   - **Name**: `allow-vite-5173`
   - **Direction of traffic**: Ingress
   - **Action on match**: Allow
   - **Targets**: All instances in the network
   - **Source IPv4 ranges**: `0.0.0.0/0`
   - **Protocols and ports**: TCP → `5173`
4. Click **CREATE**

**Verificar que el puerto esté abierto:**
```bash
# Desde tu máquina local
curl -v http://<TU_IP_PÚBLICA>:5173

# O accede desde el navegador
http://<TU_IP_PÚBLICA>:5173
```

---

## 13. Checklist de Despliegue

- [ ] Instancias y dependencias instaladas
- [ ] Repositorio clonado
- [ ] Base de datos creada y migrada
- [ ] Backend: variables de entorno configuradas y funcionando
- [ ] Agent: variables de entorno configuradas y funcionando
- [ ] Frontend: construido y archivos en lugar correcto
- [ ] Nginx configurado y corriendo
- [ ] Puertos accesibles (80, 443, 3000, 4000, 5173)
- [ ] SSL certificado (si aplica)
- [ ] PM2 configurado para auto-start
- [ ] Prueba de conectividad: `curl http://localhost/api/health`

---

## 14. Troubleshooting

### Backend no inicia
```bash
pm2 logs backend
# Verificar:
# - Conexión a BD
# - Puerto 3000 disponible
# - Variables de entorno correctas
```

### Agent no inicia
```bash
pm2 logs agent
# Verificar:
# - GROQ_API_KEY válida
# - Conexión a BD
# - Puerto 4000 disponible
```

### Nginx retorna 502
```bash
sudo nginx -t
pm2 list  # ¿Backend está corriendo?
sudo systemctl restart nginx
```

### Problema de CORS
- Verificar `VITE_API_BASE_URL` en Frontend
- Verificar headers en Backend (Express CORS middleware)

---

## 15. Actualizar a nueva versión

```bash
cd /opt/notificacion-validacion-poliza

# Detener servicios
pm2 stop all

# Actualizar código
git pull origin main

# Backend
cd BackEnd && npm install && cd ..

# Agent
cd Agent && source .venv/bin/activate && pip install -r requirements.txt && cd ..

# Frontend
cd Frontend && npm install && npm run build && cd ..

# Reiniciar
pm2 start all
```

---

## 16. Información útil

**Estructura de carpetas en producción:**
```
/opt/notificacion-validacion-poliza/
├── BackEnd/         # Node.js
├── Agent/           # Python
├── Frontend/        # React (dist/ se sirve por Nginx)
├── schema_postgresql.sql
└── ...
```

**Logs importantes:**
- Backend: `pm2 logs backend`
- Agent: `pm2 logs agent`
- Nginx: `sudo tail -f /var/log/nginx/access.log`
- PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql.log`

**Puertos:**
- Frontend: 80/443 (Nginx)
- Backend: 3000 (interno, proxy vía Nginx)
- Agent: 4000 (interno, puede exponerse vía Nginx)
- PostgreSQL: 5432 (localhost o Cloud SQL)

