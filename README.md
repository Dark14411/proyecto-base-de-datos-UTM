# UTM Desk — NoSQL Cloud

> Sistema Integral de Gestión de Incidencias en el Campus Universitario con arquitectura de base de datos NoSQL híbrida (**MongoDB Atlas** + **Redis Cloud**) y frontend moderno en **React + Tailwind CSS**.

---

## 🚀 Arquitectura Tecnológica

* **Base de Datos NoSQL Primaria (Documentos):** [MongoDB Atlas](https://www.mongodb.com/atlas)
  * Colección: `incidencias_campus`
  * Validación estricta con `$jsonSchema` y polimorfismo (`oneOf`) por categoría:
    * `computo_redes` (Dirección IP, VLAN, switches, equipos afectados).
    * `infraestructura` (Tipo de daño, riesgo, insumos, contratista).
    * `academico` (Plataforma, código de curso, periodo, estudiantes impactados).
  * Índices:
    * Compuesto: `{ categoria: 1, prioridad: 1, estado: 1 }`
    * TTL: Fecha de resolución con expiración automática de registros cerrados.
    * Full-Text Search en español sobre título, descripción y tags.
* **Caché y Concurrencia (En Memoria):** [Redis Cloud](https://redis.io/)
  * Generación atómica de folios únicos (`INC-YYYY-XXXX`) mediante `INCR` con TTL diario.
  * Invalidación y caché de consultas analíticas.
* **Backend:** Node.js + Express
  * Arquitectura MVC con controladores RESTful (Casos de Uso CU-01 a CU-07).
  * Multer para gestión de evidencias multimedia.
* **Frontend:** React 19 + Vite + Tailwind CSS + Lucide Icons + Recharts
  * UI de alto impacto visual con diseño Dark Glassmorphism.
  * Formulario reactivo polimórfico adaptativo según categoría.
  * Bandeja de soporte técnico en tiempo real para actualización de estados y bitácoras.
  * Dashboard analítico con KPIs y gráficas interactivas basadas en agregaciones de MongoDB.

---

## 📂 Estructura del Proyecto

```
database_cloud/
├── backend/
│   ├── config/             # Conexión a MongoDB Atlas y Redis Cloud
│   ├── controllers/        # Controladores de incidencias y analítica
│   ├── middleware/         # Middleware de subida de evidencias (Multer)
│   ├── routes/             # Rutas API REST (/api/incidencias)
│   ├── tests/              # Smoke tests automáticos
│   ├── server.js           # Punto de entrada Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # FormularioIncidencia, BandejaSoporte, DashboardAnalitico
│   │   ├── services/       # Cliente Axios y llamadas API
│   │   ├── App.jsx         # Shell y navegación principal
│   │   └── index.css       # Sistema de diseño y estilos globales
│   └── vite.config.js      # Proxy a backend localhost:5000
├── postman/                # Colección de pruebas Postman
├── setup_db.js             # Script maestro de inicialización de MongoDB
├── COMMANDS.md             # Guía rápida de comandos
└── README.md
```

---

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/Dark14411/proyecto-base-de-datos-UTM.git
cd proyecto-base-de-datos-UTM
```

### 2. Instalar dependencias
```powershell
npm --prefix backend install
npm --prefix frontend install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz o en `backend/.env` basándote en `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster0.mongodb.net/utm_desk_nosql?retryWrites=true&w=majority
DB_NAME=utm_desk_nosql
REDIS_URL=redis://default:<password>@<host>:<port>
FRONTEND_URL=http://localhost:5173
```

### 4. Inicializar y poblar la Base de Datos
Ejecuta el script maestro que aplica validadores `$jsonSchema`, índices y 25 registros sintéticos:
```powershell
node setup_db.js
```

### 5. Iniciar los servidores

**Terminal 1 — Backend:**
```powershell
npm --prefix backend run start
```
*API disponible en: `http://localhost:5000`*

**Terminal 2 — Frontend:**
```powershell
npm --prefix frontend run dev
```
*Frontend disponible en: `http://localhost:5173`*

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor y servicios |
| `POST` | `/api/incidencias` | Registrar nueva incidencia (Genera folio Redis) |
| `GET` | `/api/incidencias` | Listar incidencias con filtros y paginación |
| `GET` | `/api/incidencias/:id` | Obtener detalle completo de incidencia |
| `PUT` | `/api/incidencias/:id` | Actualizar datos generales |
| `DELETE` | `/api/incidencias/:id` | Eliminar incidencia |
| `GET` | `/api/incidencias/buscar?q=texto` | Búsqueda full-text en español |
| `GET` | `/api/incidencias/analitica` | Métricas y agregaciones analíticas |
| `POST` | `/api/incidencias/:id/evidencias` | Cargar evidencias multimedia |
| `PATCH` | `/api/incidencias/:id/seguimiento` | Registrar avance, cambio de estado y horas |
| `PATCH` | `/api/incidencias/:id/tags` | Agregar o remover tags |

---

## 👥 Roles del Proyecto

1. **Usuario Reportante:** Estudiantes, docentes o administrativos que registran incidencias técnicas, de infraestructura o académicas.
2. **Agente de Soporte Técnico:** Especialistas resolutores que atienden la bandeja de tickets, agregan bitácoras de trabajo y gestionan el ciclo de vida del ticket.
3. **Coordinador / Analista de Operaciones:** Supervisores que monitorean métricas y reportes para optimizar la toma de decisiones en el campus.

---

## 📄 Licencia
Proyecto Académico — Universidad Tecnológica de la Mixteca (UTM).
