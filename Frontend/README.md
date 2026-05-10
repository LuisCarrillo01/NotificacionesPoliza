# Frontend

Aplicacion interna construida con React, Vite y TypeScript para operar el flujo de validacion de polizas en emergencias medicas.

## Requisitos

- Node.js 20+
- Backend disponible con la API `/api`

## Configuracion

1. Copia `Frontend/.env.example` a `Frontend/.env`
2. Define `VITE_API_BASE_URL` con la base real del backend
3. Opcionalmente ajusta `VITE_APP_NAME` y `VITE_APP_ENV`

### Variables de entorno

- `VITE_API_BASE_URL` obligatoria. No existe fallback hardcodeado en el codigo.
- `VITE_APP_NAME` opcional para branding por ambiente.
- `VITE_APP_ENV` opcional para mostrar el ambiente activo.

### Ejemplos

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Validacion de polizas
VITE_APP_ENV=dev
```

```env
VITE_API_BASE_URL=https://qa-api.midominio.com/api
VITE_APP_NAME=Validacion de polizas QA
VITE_APP_ENV=qa
```

```env
VITE_API_BASE_URL=https://api.midominio.com/api
VITE_APP_NAME=Validacion de polizas
VITE_APP_ENV=prod
```

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

## Modulos iniciales

- Login y sesion JWT
- Dashboard operativo
- Registro y detalle de emergencias
- Bandeja de notificaciones
- Consulta manual de informes

## Nota sobre informes

El backend actual solo expone `GET /api/reports/:reportId`, por eso el frontend incluye una consulta manual por ID de informe y no un enlace automatico desde notificaciones.
