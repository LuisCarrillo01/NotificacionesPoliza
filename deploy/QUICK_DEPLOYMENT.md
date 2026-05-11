# Comandos Rápidos de Despliegue en Google Cloud

## Conexión a la instancia

```bash
# Conectarse a tu instancia Ubuntu en Google Cloud
gcloud compute ssh NOMBRE_INSTANCIA --zone=ZONA

# Ejemplo:
gcloud compute ssh prod-server --zone=us-central1-a
```

---

## Opción 1: Despliegue automático (RECOMENDADO)

```bash
# 1. SSH a la instancia
gcloud compute ssh NOMBRE_INSTANCIA --zone=ZONA

# 2. Descargar y ejecutar script
cd /tmp
wget https://raw.githubusercontent.com/TU_USUARIO/tu-repo/main/deploy.sh
# O si prefieres copiar el contenido del archivo deploy.sh desde el repo

bash deploy.sh
```

El script automático te pedirá:
- ✅ URL del repositorio Git
- ✅ Variables de entorno (JWT_SECRET, API_KEYs)
- ✅ Configuración de base de datos

---

## Opción 2: Despliegue manual paso a paso

### Paso 1: Actualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Paso 2: Instalar dependencias
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs npm

# Python 3.13
sudo apt install -y python3.13 python3.13-venv python3-pip

# PostgreSQL Client, Git, Nginx, PM2
sudo apt install -y postgresql-client git nginx
sudo npm install -g pm2
```

### Paso 3: Clonar repositorio
```bash
cd /opt
git clone https://github.com/tu-usuario/tu-repo.git notificacion-validacion-poliza
cd notificacion-validacion-poliza
```

### Paso 4: Configurar base de datos
```bash
# Si usas PostgreSQL local:
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql

# Crear BD
sudo -u postgres psql << EOF
CREATE DATABASE notificacion_poliza;
CREATE USER poliza_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE notificacion_poliza TO poliza_user;
EOF

# Migrar schema
psql -U poliza_user -d notificacion_poliza < schema_postgresql.sql
```

### Paso 5: Desplegar Backend
```bash
cd BackEnd
npm install

# Crear .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=poliza_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=notificacion_poliza
API_BASE_URL=http://localhost:4000
VALIDATION_RESULT_CALLBACK_TOKEN=tu_token_secreto_aqui
JWT_SECRET=tu_jwt_secret_aqui
GROQ_API_KEY=tu_groq_key_aqui
EOF

# Iniciar con PM2
pm2 start "npm start" --name "backend"
pm2 save
```

### Paso 6: Desplegar Agent (Python)
```bash
cd ../Agent
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Crear .env
cat > .env << EOF
API_BASE_URL=http://localhost:3000/api
VALIDATION_RESULT_CALLBACK_TOKEN=tu_token_secreto_aqui
DATABASE_URL=postgresql://poliza_user:tu_contraseña_segura@localhost:5432/notificacion_poliza
GROQ_API_KEY=tu_groq_key_aqui
EOF

# Script de inicio
cat > /tmp/start-agent.sh << 'SCRIPT'
#!/bin/bash
cd /opt/notificacion-validacion-poliza/Agent
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 4000
SCRIPT

chmod +x /tmp/start-agent.sh
pm2 start "/tmp/start-agent.sh" --name "agent" --interpreter bash
pm2 save
```

### Paso 7: Construir Frontend
```bash
cd ../Frontend
npm install

# Crear .env (obtén la IP pública de tu instancia)
cat > .env << EOF
VITE_API_BASE_URL=http://tu-ip-publica/api
VITE_APP_NAME=Validacion de polizas
VITE_APP_ENV=production
EOF

npm run build
```

### Paso 8: Configurar Nginx
```bash
# Respaldar configuración original
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# Crear nueva configuración (ver archivo DEPLOYMENT_GUIDE.md)
sudo nano /etc/nginx/sites-available/default
```

Agregar contenido del archivo de configuración Nginx (ver sección 9 de DEPLOYMENT_GUIDE.md)

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 9: Configurar auto-inicio
```bash
pm2 startup
pm2 save
```

### Paso 10: Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Comandos útiles post-despliegue

### Ver estado de servicios
```bash
pm2 list
pm2 status backend
pm2 status agent
```

### Ver logs en tiempo real
```bash
pm2 logs backend
pm2 logs agent
pm2 logs  # todos
```

### Restart de servicios
```bash
pm2 restart backend
pm2 restart agent
pm2 restart all

sudo systemctl restart nginx
```

### Detener/iniciar servicios
```bash
pm2 stop backend
pm2 start backend
pm2 stop all
pm2 start all
```

### Actualizar a nueva versión
```bash
cd /opt/notificacion-validacion-poliza

pm2 stop all

git pull origin main

cd BackEnd && npm install && cd ..
cd Agent && source .venv/bin/activate && pip install -r requirements.txt && cd ..
cd Frontend && npm install && npm run build && cd ..

pm2 start all

# Ver logs
pm2 logs
```

---

## SSL/TLS con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

# Generar certificado (reemplaza tu-dominio.com)
sudo certbot --nginx -d tu-dominio.com

# El certificado se renueva automáticamente
sudo systemctl enable certbot.timer
```

---

## Obtener IP pública de tu instancia

```bash
# Dentro de la instancia:
curl https://checkip.amazonaws.com

# Desde tu máquina local:
gcloud compute instances describe NOMBRE_INSTANCIA --zone=ZONA --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

---

## URLs de acceso una vez desplegado

- **Frontend**: `http://tu-ip-publica` o `http://tu-dominio.com`
- **Backend API**: `http://tu-ip-publica/api` o `http://tu-dominio.com/api`
- **Agent** (interno): `http://localhost:4000` (no se expone públicamente, solo Backend lo llama)

---

## Verificar que todo funciona

```bash
# Backend health check
curl http://localhost:3000/api/health

# Frontend (debería devolver HTML)
curl http://localhost

# Ver procesos
pm2 list
```

---

## Troubleshooting

### Backend no inicia
```bash
pm2 logs backend
# Comunes:
# - Puerto 3000 ya en uso: lsof -i :3000
# - Conexión a BD: verifica DB_HOST, DB_USER, DB_PASSWORD en .env
```

### Agent no inicia
```bash
pm2 logs agent
# Comunes:
# - GROQ_API_KEY inválida
# - Conexión a BD
# - Puerto 4000 en uso
```

### Frontend retorna 502
```bash
sudo nginx -t  # Verifica sintaxis
pm2 list      # ¿Backend está corriendo?
sudo systemctl restart nginx
```

### Base de datos no accesible
```bash
# Si es local:
sudo systemctl status postgresql

# Si es Cloud SQL, verifica:
# 1. Proxy de Cloud SQL corriendo
# 2. IP de instancia en whitelist
# 3. Credenciales correctas en .env
```

---

## Documentación completa

Ver archivo `DEPLOYMENT_GUIDE.md` para detalles adicionales, arquitectura y configuraciones avanzadas.

