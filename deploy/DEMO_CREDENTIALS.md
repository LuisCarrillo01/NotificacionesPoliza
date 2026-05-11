# 🔐 Credenciales de Demostración

Contraseña común para todos: **`123456`**

## Usuarios Disponibles

| Usuario | Contraseña | Rol | Hospital/Aseguradora |
|---------|-----------|-----|----------------------|
| `registrador.demo` | `123456` | Registrador de Emergencias | Hospital Central Santo Domingo |
| `admisiones.demo` | `123456` | Receptor de Admisiones | Hospital Central Santo Domingo |
| `aseguradora.demo` | `123456` | Receptor de Aseguradora | Primera Salud Seguros |
| `registrador.norte` | `123456` | Registrador de Emergencias | Hospital Norte Santiago |
| `admisiones.norte` | `123456` | Receptor de Admisiones | Hospital Norte Santiago |

## Pasos para cargar datos de demostración

Si no has cargado la base de datos con los datos de seed, ejecuta:

### 1. En tu máquina local:
```bash
cd BackEnd
npm install  # Si no lo has hecho
node scripts/seedDatabase.js
```

### 2. En Google Cloud (en la instancia):
```bash
cd /opt/notificacion-validacion-poliza/BackEnd
npm install
node scripts/seedDatabase.js
```

## Verificar que los datos cargaron

En la consola PostgreSQL:
```sql
SELECT username, full_name, role FROM usuarios;
```

Deberías ver:
```
      username       |    full_name     |      role       
--------------------+------------------+------------------
 registrador.demo   | Laura Martinez   | registrador_emergencia
 admisiones.demo    | Carlos Gomez     | receptor_admisiones
 aseguradora.demo   | Ana Rodriguez    | receptor_aseguradora
 registrador.norte  | Pedro Castillo   | registrador_emergencia
 admisiones.norte   | Marta Nunez      | receptor_admisiones
```

## ¿Aún me dice 401?

Si sigues recibiendo **401 Unauthorized**, verifica:

1. ✅ Ejecutaste `node scripts/seedDatabase.js`
2. ✅ No hay errores en los logs del Backend: `pm2 logs backend`
3. ✅ Backend está corriendo: `pm2 list`
4. ✅ Usuario ingresado coincide exactamente con la tabla (sin espacios)
5. ✅ Contraseña es exactamente: `123456`

Si la BD no tiene datos, el login fallará con 401.
