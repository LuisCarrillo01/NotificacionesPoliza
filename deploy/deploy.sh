#!/bin/bash

###############################################################################
# Script de Despliegue Rápido - Notificación Validación Póliza
# Uso: bash deploy.sh
###############################################################################

set -e  # Detener si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Despliegue - Validación de Pólizas${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# =============================================================================
# 1. ACTUALIZAR SISTEMA
# =============================================================================
echo -e "${YELLOW}[1/9] Actualizando sistema...${NC}"
sudo apt update && sudo apt upgrade -y > /dev/null 2>&1
echo -e "${GREEN}✓ Sistema actualizado${NC}\n"

# =============================================================================
# 2. INSTALAR DEPENDENCIAS GLOBALES
# =============================================================================
echo -e "${YELLOW}[2/9] Instalando dependencias...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt install -y nodejs npm > /dev/null 2>&1
fi
echo "Node.js: $(node --version)"

# Python 3.13
if ! command -v python3.13 &> /dev/null; then
    sudo apt install -y python3.13 python3.13-venv python3-pip > /dev/null 2>&1
fi
echo "Python: $(python3.13 --version)"

# PostgreSQL Client
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql-client > /dev/null 2>&1
fi
echo "PostgreSQL Client: OK"

# Git
if ! command -v git &> /dev/null; then
    sudo apt install -y git > /dev/null 2>&1
fi
echo "Git: $(git --version | cut -d' ' -f3)"

# Nginx
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx > /dev/null 2>&1
    sudo systemctl enable nginx > /dev/null 2>&1
    sudo systemctl start nginx > /dev/null 2>&1
fi
echo "Nginx: $(nginx -v 2>&1 | awk '{print $NF}')"

# PM2
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2 > /dev/null 2>&1
fi
echo -e "PM2: $(pm2 --version)"
echo -e "${GREEN}✓ Dependencias instaladas${NC}\n"

# =============================================================================
# 3. CLONAR REPOSITORIO
# =============================================================================
echo -e "${YELLOW}[3/9] Configurando repositorio...${NC}"

if [ ! -d "/opt/notificacion-validacion-poliza" ]; then
    read -p "Ingresa la URL del repositorio Git: " REPO_URL
    sudo git clone "$REPO_URL" /opt/notificacion-validacion-poliza > /dev/null 2>&1
    sudo chown -R $USER:$USER /opt/notificacion-validacion-poliza
fi

cd /opt/notificacion-validacion-poliza
echo -e "${GREEN}✓ Repositorio en /opt/notificacion-validacion-poliza${NC}\n"

# =============================================================================
# 4. CONFIGURAR BASE DE DATOS
# =============================================================================
echo -e "${YELLOW}[4/9] Configurando base de datos...${NC}"

read -p "¿Usar PostgreSQL local? (s/n) [s]: " USE_LOCAL_DB
USE_LOCAL_DB=${USE_LOCAL_DB:-s}

if [[ "$USE_LOCAL_DB" == "s" ]]; then
    # PostgreSQL local
    if ! sudo systemctl is-active --quiet postgresql; then
        sudo apt install -y postgresql postgresql-contrib > /dev/null 2>&1
        sudo systemctl start postgresql > /dev/null 2>&1
        sudo systemctl enable postgresql > /dev/null 2>&1
    fi
    
    # Crear usuario y base de datos
    DB_PASS=$(openssl rand -base64 12)
    
    sudo -u postgres psql << EOF > /dev/null 2>&1
CREATE DATABASE IF NOT EXISTS notificacion_poliza;
CREATE USER IF NOT EXISTS poliza_user WITH PASSWORD '$DB_PASS';
ALTER ROLE poliza_user SET client_encoding TO 'utf8';
ALTER ROLE poliza_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE notificacion_poliza TO poliza_user;
EOF
    
    # Migrar schema
    psql -U poliza_user -d notificacion_poliza < schema_postgresql.sql 2>/dev/null || true
    
    echo "Base de datos: notificacion_poliza"
    echo "Usuario: poliza_user"
    echo "Contraseña: $DB_PASS (guardar en .env)"
    DB_HOST="localhost"
    DB_USER="poliza_user"
    DB_PASSWORD="$DB_PASS"
else
    read -p "Ingresa la IP/host del servidor PostgreSQL: " DB_HOST
    read -p "Ingresa el usuario: " DB_USER
    read -p "Ingresa la contraseña: " DB_PASSWORD
fi

echo -e "${GREEN}✓ Base de datos configurada${NC}\n"

# =============================================================================
# 5. DESPLEGAR BACKEND
# =============================================================================
echo -e "${YELLOW}[5/9] Desplegando Backend...${NC}"

cd /opt/notificacion-validacion-poliza/BackEnd

# Instalar dependencias
npm install > /dev/null 2>&1

# Crear .env
if [ ! -f ".env" ]; then
    read -p "Ingresa JWT_SECRET: " JWT_SECRET
    read -p "Ingresa GROQ_API_KEY (opcional): " GROQ_API_KEY
    read -p "Ingresa token callback (o presiona Enter para generar): " CALLBACK_TOKEN
    
    if [ -z "$CALLBACK_TOKEN" ]; then
        CALLBACK_TOKEN=$(openssl rand -base64 32)
    fi
    
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=$DB_HOST
DB_PORT=5432
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=notificacion_poliza
API_BASE_URL=http://localhost:4000
VALIDATION_RESULT_CALLBACK_TOKEN=$CALLBACK_TOKEN
JWT_SECRET=$JWT_SECRET
GROQ_API_KEY=$GROQ_API_KEY
EOF
    
    echo "Token callback: $CALLBACK_TOKEN (usar en Agent)"
fi

# Iniciar con PM2
pm2 delete backend 2>/dev/null || true
pm2 start "npm start" --name "backend" --cwd /opt/notificacion-validacion-poliza/BackEnd > /dev/null 2>&1
echo -e "${GREEN}✓ Backend desplegado en puerto 3000${NC}\n"

# =============================================================================
# 6. DESPLEGAR AGENT
# =============================================================================
echo -e "${YELLOW}[6/9] Desplegando Agent...${NC}"

cd /opt/notificacion-validacion-poliza/Agent

# Virtual environment
if [ ! -d ".venv" ]; then
    python3.13 -m venv .venv > /dev/null 2>&1
fi

source .venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

# Crear .env
if [ ! -f ".env" ]; then
    read -p "Ingresa GROQ_API_KEY: " AGENT_GROQ_API_KEY
    
    cat > .env << EOF
API_BASE_URL=http://localhost:3000/api
VALIDATION_RESULT_CALLBACK_TOKEN=$CALLBACK_TOKEN
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/notificacion_poliza
GROQ_API_KEY=$AGENT_GROQ_API_KEY
OPENAI_API_KEY=
EOF
fi

# Script de inicio
cat > /tmp/start-agent.sh << 'EOF'
#!/bin/bash
cd /opt/notificacion-validacion-poliza/Agent
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 4000
EOF
chmod +x /tmp/start-agent.sh

# Iniciar con PM2
pm2 delete agent 2>/dev/null || true
pm2 start "/tmp/start-agent.sh" --name "agent" --interpreter bash > /dev/null 2>&1
echo -e "${GREEN}✓ Agent desplegado en puerto 4000${NC}\n"

# =============================================================================
# 7. CONSTRUIR FRONTEND
# =============================================================================
echo -e "${YELLOW}[7/9] Construyendo Frontend...${NC}"

cd /opt/notificacion-validacion-poliza/Frontend

npm install > /dev/null 2>&1

# Crear .env
if [ ! -f ".env" ]; then
    read -p "Ingresa dominio/IP público (ej: midominio.com o 34.123.45.67): " PUBLIC_DOMAIN
    
    cat > .env << EOF
VITE_API_BASE_URL=http://$PUBLIC_DOMAIN/api
VITE_APP_NAME=Validacion de polizas
VITE_APP_ENV=production
EOF
fi

npm run build > /dev/null 2>&1
echo -e "${GREEN}✓ Frontend construido${NC}\n"

# =============================================================================
# 8. CONFIGURAR NGINX
# =============================================================================
echo -e "${YELLOW}[8/9] Configurando Nginx...${NC}"

sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo nginx -t > /dev/null 2>&1
sudo systemctl restart nginx > /dev/null 2>&1
echo -e "${GREEN}✓ Nginx configurado${NC}\n"

# =============================================================================
# 9. CONFIGURAR PM2 STARTUP
# =============================================================================
echo -e "${YELLOW}[9/9] Configurando auto-inicio...${NC}"

pm2 save > /dev/null 2>&1
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup -u $USER --hp /home/$USER > /dev/null 2>&1
echo -e "${GREEN}✓ Auto-inicio configurado${NC}\n"

# =============================================================================
# FIREWALL
# =============================================================================
echo -e "${YELLOW}Configurando firewall...${NC}"
sudo ufw allow 22/tcp > /dev/null 2>&1
sudo ufw allow 80/tcp > /dev/null 2>&1
sudo ufw allow 443/tcp > /dev/null 2>&1
sudo ufw enable -y > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Firewall configurado${NC}\n"

# =============================================================================
# RESUMEN
# =============================================================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Despliegue completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Servicios:${NC}"
pm2 list

echo -e "\n${YELLOW}URLs de acceso:${NC}"
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com | tr -d '\n')
echo "Frontend:  http://$PUBLIC_IP"
echo "Backend:   http://$PUBLIC_IP/api"
echo "Agent:     http://localhost:4000 (interno)"

echo -e "\n${YELLOW}Comandos útiles:${NC}"
echo "Ver logs:          pm2 logs"
echo "Reiniciar:         pm2 restart all"
echo "Detener:           pm2 stop all"
echo "Estado Nginx:      sudo systemctl status nginx"

echo -e "\n${YELLOW}Próximos pasos:${NC}"
echo "1. Verifica los logs: pm2 logs"
echo "2. Prueba la API: curl http://localhost/api/health"
echo "3. Accede al frontend en tu navegador"
echo "4. Configura SSL con: sudo certbot --nginx"
