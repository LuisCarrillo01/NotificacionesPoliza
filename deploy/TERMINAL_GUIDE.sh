#!/bin/bash

# =============================================================================
# GUÍA TERMINAL - Comandos de despliegue directo (copia y pega)
# =============================================================================

echo "
╔═══════════════════════════════════════════════════════════════════════╗
║             DESPLIEGUE NOTIFICACIÓN VALIDACIÓN PÓLIZA               ║
║                    Google Cloud - Ubuntu                             ║
╚═══════════════════════════════════════════════════════════════════════╝

📋 PASOS RÁPIDOS:

1. Conectarse a la instancia
2. Ejecutar script automático O pasos manuales
3. Verificar que todo funciona

═══════════════════════════════════════════════════════════════════════
"

echo "📌 PASO 1: CONECTARSE A LA INSTANCIA"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Opción A - Por nombre (recomendado):"
echo "  gcloud compute ssh NOMBRE_INSTANCIA --zone=us-central1-a"
echo ""
echo "Opción B - Por IP:"
echo "  ssh -i ~/.ssh/google_compute_engine usuario@IP_PUBLICA"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "📌 PASO 2: DESPLIEGUE AUTOMÁTICO ⭐ (TODO EN UNO)"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Una vez dentro de la instancia, ejecuta:"
echo ""
echo "  cd /tmp"
echo "  git clone https://tu-repo.git && cd notificacion-validacion-poliza"
echo "  bash deploy.sh"
echo ""
echo "  ✅ Esto hace todo automáticamente:"
echo "     • Instala dependencias"
echo "     • Configura BD"
echo "     • Despliega Backend"
echo "     • Despliega Agent"
echo "     • Construye Frontend"
echo "     • Configura Nginx"
echo "     • Configura auto-inicio"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "📌 PASO 3: O DESPLIEGUE MANUAL (si prefieres hacerlo paso a paso)"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

cat << 'MANUAL'

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar todo
sudo apt install -y nodejs npm python3.13 python3.13-venv postgresql-client git nginx
sudo npm install -g pm2

# Clonar repo
cd /opt
sudo git clone https://tu-repo.git notificacion-validacion-poliza
sudo chown -R $USER:$USER notificacion-validacion-poliza
cd notificacion-validacion-poliza

# ============ BACKEND ============
cd BackEnd
npm install

cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=poliza_user
DB_PASSWORD=contraseña123
DB_NAME=notificacion_poliza
API_BASE_URL=http://localhost:4000
VALIDATION_RESULT_CALLBACK_TOKEN=token_secreto_123
JWT_SECRET=jwt_secreto_123
GROQ_API_KEY=tu_groq_api_key
EOF

pm2 start "npm start" --name "backend"

# ============ AGENT ============
cd ../Agent
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cat > .env << 'EOF'
API_BASE_URL=http://localhost:3000/api
VALIDATION_RESULT_CALLBACK_TOKEN=token_secreto_123
DATABASE_URL=postgresql://poliza_user:contraseña123@localhost:5432/notificacion_poliza
GROQ_API_KEY=tu_groq_api_key
EOF

cat > /tmp/start-agent.sh << 'SCRIPT'
#!/bin/bash
cd /opt/notificacion-validacion-poliza/Agent
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 4000
SCRIPT

chmod +x /tmp/start-agent.sh
pm2 start "/tmp/start-agent.sh" --name "agent" --interpreter bash

# ============ FRONTEND ============
cd ../Frontend
npm install

cat > .env << 'EOF'
VITE_API_BASE_URL=http://tu-ip-publica/api
VITE_APP_NAME=Validacion de polizas
VITE_APP_ENV=production
EOF

npm run build

# ============ NGINX ============
# Ver DEPLOYMENT_GUIDE.md sección 9 para configuración completa

# ============ AUTO-INICIO ============
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup -u $USER --hp /home/$USER

# ============ FIREWALL ============
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

MANUAL

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "📌 PASO 4: VERIFICAR ESTADO"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  pm2 list                    # Ver servicios"
echo "  pm2 logs backend            # Ver logs del backend"
echo "  pm2 logs agent              # Ver logs del agent"
echo "  curl http://localhost/api   # Probar API"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "🌐 URLS DE ACCESO"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  Frontend:  http://tu-ip-publica"
echo "  Backend:   http://tu-ip-publica/api"
echo "  Agent:     http://localhost:4000 (interno)"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "🔧 COMANDOS ÚTILES"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  pm2 restart backend         # Reiniciar backend"
echo "  pm2 restart agent           # Reiniciar agent"
echo "  pm2 restart all             # Reiniciar todo"
echo "  pm2 stop all                # Detener todo"
echo "  pm2 start all               # Iniciar todo"
echo "  pm2 logs -f                 # Ver logs en tiempo real"
echo "  curl https://checkip.amazonaws.com  # Ver IP pública"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "🆘 TROUBLESHOOTING"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Backend no inicia:"
echo "  pm2 logs backend"
echo "  # Comprobar: puerto 3000, conexión a BD, .env"
echo ""
echo "Agent no inicia:"
echo "  pm2 logs agent"
echo "  # Comprobar: GROQ_API_KEY, conexión a BD"
echo ""
echo "Nginx devuelve 502:"
echo "  sudo nginx -t"
echo "  sudo systemctl restart nginx"
echo ""
echo "Base de datos no conecta:"
echo "  psql -h localhost -U poliza_user -d notificacion_poliza"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "🔒 SSL/TLS (OPCIONAL - RECOMENDADO PARA PRODUCCIÓN)"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  sudo apt install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d tu-dominio.com"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "📚 DOCUMENTACIÓN"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  DEPLOYMENT_GUIDE.md     - Guía completa detallada"
echo "  QUICK_DEPLOYMENT.md     - Referencia manual"
echo "  deploy.sh               - Script automático"
echo "  README_DEPLOYMENT.md    - Resumen visual"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "✅ ¡LISTO! Sigue los pasos y tu aplicación estará en línea en minutos."
echo ""
