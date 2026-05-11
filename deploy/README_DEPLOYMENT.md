# 🚀 Resumen de Despliegue - Referencia Rápida

## 1️⃣ Conectarse a la instancia

```bash
gcloud compute ssh INSTANCIA --zone=ZONA
```

---

## 2️⃣ Ejecutar despliegue automático (⭐ RECOMENDADO)

```bash
# Opción A: Si ya está en la instancia
bash deploy.sh

# Opción B: Desde tu máquina (dentro de la carpeta del repo)
gcloud compute scp deploy.sh INSTANCIA:~/
gcloud compute ssh INSTANCIA --zone=ZONA --command "bash ~/deploy.sh"
```

---

## 3️⃣ O hacer despliegue manual

### Instalación de dependencias (1 minuto)
```bash
sudo apt update && sudo apt install -y nodejs npm python3.13 python3.13-venv postgresql-client git nginx
sudo npm install -g pm2
```

### Clonar repo y configurar BD (2 minutos)
```bash
cd /opt
git clone https://github.com/tu-usuario/tu-repo.git notificacion-validacion-poliza
cd notificacion-validacion-poliza

# Si usas PostgreSQL local (opcional)
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
psql -U postgres -c "CREATE DATABASE notificacion_poliza; CREATE USER poliza_user WITH PASSWORD 'pass123';"
psql -U poliza_user -d notificacion_poliza < schema_postgresql.sql
```

### Backend (1 minuto)
```bash
cd BackEnd && npm install

# Crear .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=poliza_user
DB_PASSWORD=pass123
DB_NAME=notificacion_poliza
API_BASE_URL=http://localhost:4000
VALIDATION_RESULT_CALLBACK_TOKEN=token_secreto_123
JWT_SECRET=jwt_secret_123
GROQ_API_KEY=tu_groq_key
EOF

pm2 start "npm start" --name "backend"
```

### Agent (1 minuto)
```bash
cd ../Agent
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Crear .env
cat > .env << 'EOF'
API_BASE_URL=http://localhost:3000/api
VALIDATION_RESULT_CALLBACK_TOKEN=token_secreto_123
DATABASE_URL=postgresql://poliza_user:pass123@localhost:5432/notificacion_poliza
GROQ_API_KEY=tu_groq_key
EOF

bash -c "cd /opt/notificacion-validacion-poliza/Agent && source .venv/bin/activate && pm2 start 'uvicorn app.main:app --host 0.0.0.0 --port 4000' --name 'agent'"
```

### Frontend (1 minuto)
```bash
cd ../Frontend && npm install

# Crear .env (obtén IP pública)
cat > .env << 'EOF'
VITE_API_BASE_URL=http://$(curl -s https://checkip.amazonaws.com)/api
VITE_APP_NAME=Validacion de polizas
VITE_APP_ENV=production
EOF

npm run build
```

### Nginx (1 minuto)
```bash
# Ver DEPLOYMENT_GUIDE.md sección 9 para configuración completa
sudo nano /etc/nginx/sites-available/default
sudo nginx -t && sudo systemctl restart nginx
```

### Persistencia (30 segundos)
```bash
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup -u $USER --hp /home/$USER
```

---

## 📊 Estado y Logs

```bash
pm2 list                    # Ver servicios
pm2 logs backend            # Logs del backend
pm2 logs agent              # Logs del agent
pm2 logs                    # Todos los logs
pm2 restart backend         # Reiniciar backend
pm2 stop all                # Detener todo
pm2 start all               # Iniciar todo
```

---

## 🔍 Verificación

```bash
# ¿Backend está respondiendo?
curl http://localhost/api/health

# ¿IP pública?
curl https://checkip.amazonaws.com

# ¿Nginx está corriendo?
sudo systemctl status nginx

# ¿Procesos PM2?
pm2 status
```

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| Backend no inicia | `pm2 logs backend` - Verificar puerto 3000, BD |
| Agent no inicia | `pm2 logs agent` - Verificar GROQ_API_KEY |
| Nginx 502 | `sudo nginx -t` - Verificar configuración |
| BD no conecta | Verificar credenciales en `.env` |
| Puerto ocupado | `sudo lsof -i :3000` o `:4000` |

---

## 🔒 SSL/TLS (Opcional pero recomendado)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 📝 Variables de entorno importantes

| Variable | Dónde | Valor de ejemplo |
|----------|-------|------------------|
| `DB_PASSWORD` | Backend + Agent | Contraseña aleatoria segura |
| `VALIDATION_RESULT_CALLBACK_TOKEN` | Backend + Agent | Token JWT o random string |
| `JWT_SECRET` | Backend | Random string largo |
| `GROQ_API_KEY` | Backend + Agent | Tu API key de Groq |
| `VITE_API_BASE_URL` | Frontend | `http://tu-ip-publica/api` |

---

## 🌐 URLs post-despliegue

```
Frontend:  http://tu-ip-publica
Backend:   http://tu-ip-publica/api
Agent:     http://localhost:4000 (interno, no público)
```

---

## 📚 Documentación completa

- **DEPLOYMENT_GUIDE.md** - Guía detallada paso a paso
- **QUICK_DEPLOYMENT.md** - Referencia manual completa
- **deploy.sh** - Script automático

---

## ⏱️ Tiempo estimado de despliegue

- **Automático (deploy.sh)**: 3-5 minutos
- **Manual**: 5-10 minutos

