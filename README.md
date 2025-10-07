# Proyecto PPS - Instrucciones de desarrollo

Este repositorio contiene un backend en Node/Express y un frontend en React (Vite).

Estado local
- Backend: Node + Express, escucha por defecto en http://localhost:3000
- Frontend: Vite (React), normalmente en http://localhost:5173 (Vite puede reasignar a 5174/5175 si el puerto está ocupado)

Arrancar localmente

1) Backend

```powershell
cd backend
npm install    # solo si no instalaste dependencias aún
npm start
```

2) Frontend

```powershell
cd frontend
npm install    # solo si no instalaste dependencias aún
npm run dev
```

Credenciales de prueba (solo desarrollo)
- Admin
  - Email: admin@example.com
  - Password: admin123
  - Rol: Admin (idRol = 3)
- Vendedor
  - Email: vendedor@example.com
  - Password: vendedor123
  - Rol: Vendedor (idRol = 2)

Estos usuarios se añadieron con `backend/scripts/insert_test_users.js`.

Notas de seguridad y limpieza
- No uses estas credenciales en producción.
- Cambia `process.env.JWT_SECRET` en producción; el backend usa `JWT_SECRET` o el valor por defecto `change_this_secret`.
- Si quieres eliminar los usuarios de prueba, puedes borrarlos desde la base de datos o ejecutar un script que los elimine.
- La carpeta `backend/uploads/` contiene imágenes subidas en desarrollo y está ignorada por git.

Soporte
- Si el frontend arranca en un puerto distinto (por ejemplo 5174 o 5175), revisa la salida de `npm run dev` para la URL local.

Comprobaciones rápidas (PowerShell)

- Ver que el backend está corriendo y responder al health check:

```powershell
cd backend
# detener procesos node en el puerto 3000 (si es necesario): Get-Process node | Stop-Process -Force
node index.js
# luego en otra terminal:
Invoke-RestMethod http://localhost:3000/health
```

- Probar el endpoint público de productos:

```powershell
Invoke-RestMethod http://localhost:3000/productos | ConvertTo-Json -Depth 4
```

- Arrancar frontend (en otra terminal):

```powershell
cd frontend
npm run dev
```

Si ves 401 al intentar /productos, revisa que no tengas otro servidor proxy o middleware interceptando la petición. El backend ahora expone /productos sin autenticación.
