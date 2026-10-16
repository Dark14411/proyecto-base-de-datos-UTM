# UTM Desk: comandos de utilidad

## Requisitos

- Node.js 18 o superior.
- MongoDB accesible con `MONGO_URI`.
- Redis accesible con `REDIS_URL` o `REDIS_HOST`/`REDIS_PORT`.
- Variables configuradas en `.env`.

## Instalar dependencias

Desde la raíz del proyecto:

```powershell
npm --prefix backend install
npm --prefix frontend install
```

## Poblar la base de datos

Este comando recrea la colección, aplica el validador, crea índices e inserta los datos de demostración:

```powershell
node setup_db.js
```

Para no perder datos existentes, realiza una copia antes: el script elimina y recrea la colección `incidencias_campus`.

## Ejecutar backend

```powershell
npm --prefix backend run start
```

API: `http://localhost:5000`

## Ejecutar frontend

En otra terminal:

```powershell
npm --prefix frontend run dev
```

Frontend: `http://localhost:5173`

## Compilar frontend

```powershell
npm --prefix frontend run build
```

## Prueba automática de API

Con backend, MongoDB y Redis activos:

```powershell
node backend/tests/api-smoke.js
```

Para usar otra URL:

```powershell
$env:API_URL = "http://localhost:5000"
node backend/tests/api-smoke.js
```

La prueba crea una incidencia temporal, consulta, busca, actualiza, agrega seguimiento, tag y evidencia, consulta analítica y finalmente elimina el registro de prueba.

## Endpoints principales

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| POST | `/api/incidencias` | Crear incidencia |
| GET | `/api/incidencias` | Listar con filtros |
| GET | `/api/incidencias/:id` | Consultar detalle |
| PUT | `/api/incidencias/:id` | Editar datos generales |
| DELETE | `/api/incidencias/:id` | Eliminar incidencia |
| GET | `/api/incidencias/buscar?q=texto` | Búsqueda full-text |
| GET | `/api/incidencias/analitica` | Métricas y agregaciones |
| POST | `/api/incidencias/:id/evidencias` | Agregar evidencia |
| PATCH | `/api/incidencias/:id/seguimiento` | Cambiar estado y registrar actividad |
| PATCH | `/api/incidencias/:id/tags` | Agregar o eliminar tags |

## Postman

Importa este archivo en Postman:

`postman/UTM-Desk.postman_collection.json`

Ejecuta primero **Crear incidencia**. La colección guarda automáticamente el `_id` creado en `incidenceId` para las demás peticiones.

## Diagnóstico rápido

```powershell
node --check backend/server.js
node --check backend/controllers/incidenciasController.js
node --check backend/routes/incidencias.js
npm --prefix frontend run build
```

Si la API no inicia, comprobar primero conectividad con MongoDB y Redis y revisar las variables del `.env` sin compartirlas públicamente.
