# PROYECTO UNIDAD II: UTM DESK NOSQL CLOUD
## Sistema Integral de Gestión, Resolución y Analítica de Incidencias en el Campus
### Asignatura: Bases de Datos en la Nube
### Formato Académico: Normas APA 7.ª Edición

---

**Asignatura:** Bases de Datos en la Nube  
**Unidad:** II. Bases de datos NoSQL y modelos no relacionales en la nube  
**Proyecto:** UTM Desk NoSQL Cloud: Sistema Integral de Gestión, Resolución y Analítica de Incidencias en el Campus  
**Modalidad:** Proyecto Colaborativo en Equipos  
**Tecnologías:** MongoDB Atlas, Redis Cloud, Node.js/Express, React + Tailwind CSS, Postman  
**Institución:** Universidad Tecnológica de la Mixteca (UTM)  
**Repositorio GitHub:** [https://github.com/Dark14411/proyecto-base-de-datos-UTM](https://github.com/Dark14411/proyecto-base-de-datos-UTM)  

---

## 1. Planteamiento de la Situación Problemática y Justificación Arquitectónica

### 1.1 Situación Problemática

La operación diaria del campus universitario involucra contingencias que provienen de tres fuentes operativas con necesidades de información dispares:

1. **Cómputo y Telecomunicaciones:** Fallas en switches de red, puntos de acceso Wi-Fi desconectados, caídas de servidores locales o equipos dañados en laboratorios. Requieren registrar direcciones IP, VLANs, puertos de uplink y conteo de equipos afectados.
2. **Infraestructura Física y Mantenimiento:** Filtraciones en techos, luminarias fundidas, fallas en sistemas de climatización o desperfectos en cerraduras. Exigen documentar tipo de daño, riesgo a la seguridad, requerimiento de insumos o intervención de contratistas externos.
3. **Sistemas y Servicios Académicos:** Errores de acceso al aula virtual (LMS), problemas para asentar actas en el portal de calificaciones o bloqueo de cuentas de correo institucional. Requieren identificar plataformas, códigos de curso, periodos escolares y cantidad de estudiantes impactados.

La gestión tradicional mediante correos electrónicos y hojas de cálculo presenta tres limitaciones críticas:
* **Rigidez e ineficiencia relacional:** Cada categoría maneja atributos técnicos dispares. Un motor SQL fuerza la creación de esquemas planos con múltiples columnas nulas o el uso de `JOINs` costosos para consultar un reporte con sus revisiones y adjuntos.
* **Trazabilidad dispersa:** El seguimiento de revisiones, comentarios de técnicos y evidencias multimedia (imágenes de diagnóstico o reportes PDF) termina separado en carpetas externas sin integridad referencial con el ticket.
* **Carencia de analítica directiva en tiempo real:** Dificultad para calcular los tiempos medios de resolución por edificio y detectar fallas crónicas en aulas específicas sin realizar exportaciones manuales periódicas.

---

### 1.2 Justificación de la Arquitectura NoSQL Documental

| Requerimiento Técnico | Motor / Componente | Justificación de Ingeniería |
|---|---|---|
| **Reportes heterogéneos y trazabilidad** | MongoDB Atlas M0 (Documental) | El modelo polimórfico almacena la información específica de cada rama dentro del subdocumento `detalle_especifico` sin desperdiciar almacenamiento. Las estructuras `tags`, `historial_seguimiento` y `evidencias_adjuntas` se embeben en arreglos, permitiendo leer todo el expediente en una sola operación I/O ($O(1)$). |
| **Evidencias multimedia** | Cloud Storage + BSON | Las capturas y documentos de diagnóstico se alojan en buckets externos; MongoDB Atlas almacena metadatos estructurados y referencias de almacenamiento temporal, garantizando no rebasar el límite de 512 MB de la capa M0 (RNF-02). |
| **Concurrencia y Folios Únicos** | Redis Cloud (In-Memory Key-Value) | Generación atómica no bloqueante mediante la primitiva `INCR` con clave diaria y correlativo global, evitando condiciones de carrera (*Race Conditions*) que ocurrirían en un cálculo tradicional con SQL. |

---

## 2. Selección Justificada de Tecnologías

* **Base de Datos NoSQL Principal (MongoDB Atlas M0):** Se seleccionó por su modelo documental nativo BSON, que mapea directamente los objetos JSON de JavaScript, permitiendo almacenar arreglos de bitácoras y metadatos de evidencias en un único documento desnormalizado. Implementa el validador `$jsonSchema` con el operador `oneOf` para garantizar la integridad a nivel de motor.
* **Caché y Generador Atómico (Redis Cloud):** Almacenamiento en memoria RAM de latencia submilisegunda. Administra contadores diarios con expiración automática de 24 horas (`EXPIRE 86400`) y garantiza exclusión mutua sin bloqueos de tabla.
* **Backend y API RESTful (Node.js + Express):** Proporciona un entorno asíncrono no bloqueante basado en el ciclo de eventos (*Event Loop*), idóneo para operaciones de entrada/salida concurrentes hacia MongoDB Atlas y Redis. Se complementa con Multer para la gestión de adjuntos multimedia y CORS para habilitar la comunicación segura con el cliente web.
* **Frontend y Visualización (React 19 + Tailwind CSS + Recharts + Lucide):** Permite construir una Single Page Application (SPA) modular y reactiva. Cuenta con un diseño moderno *Dark Glassmorphism*, formulario reactivo que muta dinámicamente según la categoría de la incidencia, bandeja de seguimiento con actualización de estados en tiempo real y un dashboard directivo interactivo con gráficos de barras, pasteles y métricas KPI.
* **Herramientas de Cliente y Pruebas (Postman & Smoke Test en Node.js):** Suite formal con pruebas de integración automatizadas para todos los métodos HTTP (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`), incluyendo validación explícita del código `400 Bad Request` ante rechazos del validador `$jsonSchema`.

---

## 3. Requisitos del Sistema

### 3.1 Requisitos Funcionales (RF)

* **RF-01: Registro de Incidencias Polimórficas:** El sistema debe permitir registrar una nueva incidencia generando automáticamente un folio diario consecutivo (ej. `INC-2026-0042`) mediante un contador en Redis. El sistema debe adaptar los campos solicitados dependiendo de la categoría seleccionada (Cómputo, Infraestructura o Académico) sin almacenar campos nulos.
* **RF-02: Gestión de Evidencias Multimedia:** El sistema debe permitir la carga de archivos (imágenes y PDFs) delegando el almacenamiento físico a un Cloud Storage externo. La base de datos registrará únicamente la URL firmada y los metadatos del archivo en un arreglo embebido.
* **RF-03: Actualización Atómica de Seguimiento:** El sistema debe permitir al personal técnico actualizar el estado de la incidencia, sumar horas de trabajo e insertar un comentario en la bitácora en una única transacción atómica de base de datos para evitar inconsistencias.
* **RF-04: Administración de Etiquetas (Tags):** El sistema debe permitir agregar y eliminar palabras clave (tags) a una incidencia existente, garantizando la unicidad de las etiquetas (evitando duplicados en el arreglo).
* **RF-05: Búsqueda Textual Ponderada:** El sistema debe integrar un motor de búsqueda de texto completo (Full-Text Search) en español, capaz de buscar palabras clave dentro del título y la descripción del reporte, dando mayor prioridad (peso) a las coincidencias encontradas en el título.
* **RF-06: Analítica y Reporteo (Agregaciones):** El sistema debe generar dos reportes directivos en tiempo real: 1) Tiempo promedio y total de horas invertidas en resolución de incidencias agrupado por edificio, y 2) Un ranking (Top 10) de las etiquetas o problemas más recurrentes.
* **RF-07: Depuración Automática de Datos:** El sistema debe eliminar de forma automática los registros de incidencias que hayan cumplido 60 días naturales desde su fecha de resolución, con el fin de optimizar el almacenamiento.

### 3.2 Requisitos No Funcionales (RNF)

* **RNF-01: Motor de Base de Datos NoSQL:** La capa de persistencia principal debe estar implementada en MongoDB Atlas utilizando BSON para aprovechar el polimorfismo documental y evitar uniones (`JOINs`) costosas.
* **RNF-02: Restricción de Almacenamiento:** Debido a las limitantes de la capa M0 (512 MB máximo), está estrictamente prohibido almacenar binarios pesados (GridFS o Base64) en la base de datos principal; se debe utilizar infraestructura de almacenamiento de objetos (Cloud Storage).
* **RNF-03: Validación a Nivel de Esquema:** La integridad estructural de los datos no debe depender únicamente del Backend; la base de datos debe aplicar validación nativa estricta mediante `$jsonSchema` para rechazar documentos que no cumplan con el modelo polimórfico esperado o contengan estados inválidos.
* **RNF-04: Rendimiento en Consultas:** La base de datos debe implementar índices compuestos específicos (`categoria`, `estado`, `ubicacion.edificio`) para garantizar que las consultas generadas por el Dashboard Directivo mantengan una complejidad temporal óptima.
* **RNF-05: Arquitectura API RESTful:** La comunicación entre el cliente y el servidor debe realizarse mediante una API REST desarrollada en Node.js/Express, retornando códigos de estado HTTP estandarizados (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Server Error`).

---

## 4. Modelado Formal de Casos de Uso (CU-01 a CU-07)

### CU-01: Registrar Incidencia
* **Actores:** Reportante (Docente, Estudiante o Administrativo), Sistema UTM Desk.
* **Propósito:** Dar de alta un ticket técnico adaptando sus propiedades según el origen de la falla sin recurrir a campos nulos.
* **Precondiciones:** El usuario accede a la vista de registro.
* **Flujo Principal:**
  1. El actor envía el reporte con los campos universales: `titulo`, `descripcion`, `categoria`, `prioridad`, `reportante` y `ubicacion`.
  2. El actor especifica el subdocumento `detalle_especifico` según la categoría: `computo_redes`, `infraestructura` o `academico`.
  3. El sistema valida la estructura mediante el validador `$jsonSchema` de MongoDB Atlas.
  4. El sistema ejecuta `INCR` en la clave de Redis `contador:incidencias:YYYY-MM-DD:categoria` para obtener el consecutivo diario.
  5. Se inserta el documento en `incidencias_campus` con estado inicial `abierta` y arreglo `historial_seguimiento` inicializado.
* **Postcondiciones:** La incidencia queda almacenada con código formal (ej. `INC-2026-0042`) y el endpoint retorna HTTP `201 Created`.

### CU-02: Cargar Evidencia Multimedia
* **Actores:** Reportante o Técnico Operativo, Cloud Storage.
* **Propósito:** Asociar archivos fotográficos o diagnósticos en formato PDF al expediente de la incidencia sin sobrecargar la cuota de almacenamiento.
* **Precondiciones:** La incidencia debe existir en la colección.
* **Flujo Principal:**
  1. El actor sube el archivo físico a la capa de Cloud Storage / Uploads.
  2. El sistema genera una referencia temporal firmada con vigencia acotada.
  3. Se realiza una operación de actualización `$push` en el arreglo `evidencias_adjuntas` guardando: `nombre_archivo`, `tipo_mime`, `peso_kb`, `url_storage` y `fecha_carga`.

### CU-03: Actualizar Estado y Bitácora de Seguimiento
* **Actores:** Técnico Asignado, Coordinador de Soporte.
* **Propósito:** Registrar avances técnicos, cambiar el estatus del reporte y acumular horas de trabajo en una sola operación sin condiciones de carrera.
* **Precondiciones:** La incidencia se encuentra en estado `abierta`, `en proceso` o `en espera`.
* **Flujo Principal:**
  1. El técnico ingresa el nuevo estado, las horas invertidas en la intervención y un comentario descriptivo.
  2. El sistema ejecuta una sentencia atómica `updateOne` sobre MongoDB Atlas con `$set` sobre estado (y `fecha_resolucion` si pasa a resuelta), `$push` en `historial_seguimiento` e `$inc` en `horas_invertidas`.

### CU-04: Gestionar Etiquetas Técnicas Dinámicas
* **Actores:** Técnico Asignado, Coordinador del Área.
* **Propósito:** Categorizar la incidencia con descriptores clave para auditoría y analítica posterior, evitando duplicados.
* **Flujo Principal:**
  1. Para agregar etiquetas, el sistema invoca el operador `$addToSet` sobre el arreglo `tags[]`. Si el descriptor ya existe, el arreglo permanece intacto.
  2. Para retirar una etiqueta errónea, el sistema invoca el operador `$pull` sobre `tags[]`.

### CU-05: Búsqueda Textual y Consulta por Descriptores
* **Actores:** Personal de Soporte, Directivos.
* **Propósito:** Localizar incidencias previas mediante coincidencia sobre el resumen y la descripción.
* **Flujo Principal:**
  1. El actor introduce palabras clave.
  2. El sistema ejecuta una consulta MQL con el operador `$text: { $search: "..." }`.
  3. MongoDB Atlas evalúa el índice de texto ponderado en español y proyecta el valor `score: { $meta: "textScore" }`.
  4. Los resultados se ordenan de forma descendente conforme a su relevancia.

### CU-06: Generar Analítica de Resolución y Fallas Crónicas
* **Actores:** Coordinación de UTM, Dirección Administrativa.
* **Propósito:** Extraer métricas consolidadas sobre el tiempo medio de atención y las causas recurrentes de falla por edificio.
* **Flujo Principal:**
  1. **Pipeline 1 (Eficiencia operativa por edificio):** `$match` por `resuelta`/`cerrada`, cálculo de horas transcurridas, `$group` por edificio (`$avg`, `$sum`, conteo) y `$sort` descendente.
  2. **Pipeline 2 (Ranking de tags y problemas recurrentes):** `$unwind` sobre `tags`, `$group` por tag, `$sort` descendente y `$limit` de 10 elementos.

### CU-07: Depurar Incidencias Resueltas por Ciclo de Vida
* **Actores:** Hilo de Mantenimiento Interno de MongoDB Atlas (Background).
* **Propósito:** Purgar de la colección activa aquellos reportes que han alcanzado 60 días naturales desde su fecha de resolución.
* **Flujo Principal:**
  1. Al resolverse la incidencia, el sistema asienta el campo `fecha_resolucion` con formato `Date`.
  2. El hilo en segundo plano de MongoDB Atlas elimina los documentos que rebasan la ventana de 5,184,000 segundos mediante el índice TTL.

---

## 5. Modelado Formal de Datos en JSON/BSON

### 5.1 Estructura de un Documento de Ejemplo (`incidencias_campus`)

```json
{
  "_id": "67c4a123f1b2c3d4e5f6789a",
  "codigo_incidencia": "INC-2026-0042",
  "titulo": "Caída total de red en Laboratorio de Redes",
  "descripcion": "El switch principal no asigna direccionamiento DHCP y no hay salida a internet en las estaciones de trabajo del laboratorio.",
  "categoria": "computo_redes",
  "prioridad": "critica",
  "estado": "resuelta",
  "horas_invertidas": 3,
  "fecha_creacion": "2026-03-04T08:30:00.000Z",
  "fecha_resolucion": "2026-03-04T11:30:00.000Z",
  "reportante": {
    "nombre": "Mtro. Roberto Méndez",
    "rol": "Docente",
    "correo": "roberto.mendez@utm.mx"
  },
  "ubicacion": {
    "edificio": "Edificio K",
    "aula_espacio": "Laboratorio 4"
  },
  "detalle_especifico": {
    "direccion_ip": "192.168.20.1",
    "vlan": "VLAN-20-LABS",
    "puerto_uplink": "Gi0/24",
    "equipos_afectados": 28
  },
  "tags": [
    "switch",
    "dhcp",
    "fibra-optica"
  ],
  "historial_seguimiento": [
    {
      "fecha": "2026-03-04T08:30:00.000Z",
      "autor": "Mtro. Roberto Méndez",
      "estado_asignado": "abierta",
      "comentario": "Reporte inicial generado por el usuario.",
      "horas_agregadas": 0
    },
    {
      "fecha": "2026-03-04T09:00:00.000Z",
      "autor": "Ing. Carlos Euan",
      "estado_asignado": "en proceso",
      "comentario": "Se asignó técnico y se inició revisión en sitio.",
      "horas_agregadas": 0
    },
    {
      "fecha": "2026-03-04T11:30:00.000Z",
      "autor": "Ing. Carlos Euan",
      "estado_asignado": "resuelta",
      "comentario": "Se reemplazó el transceptor SFP en el puerto Gi0/24 y se restableció el servicio.",
      "horas_agregadas": 3
    }
  ],
  "evidencias_adjuntas": [
    {
      "nombre_archivo": "captura_error_dhcp.png",
      "tipo_mime": "image/png",
      "peso_kb": 420,
      "url_storage": "http://localhost:5000/uploads/captura_error_dhcp.png",
      "fecha_carga": "2026-03-04T08:30:00.000Z"
    }
  ]
}
```

---

### 5.2 Validador a Nivel de Esquema ($jsonSchema) con Polimorfismo Estricto

Configurado nativamente en MongoDB Atlas en la colección `incidencias_campus`:

```javascript
db.createCollection("incidencias_campus", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "codigo_incidencia", "titulo", "descripcion", "categoria",
        "prioridad", "estado", "horas_invertidas", "fecha_creacion",
        "reportante", "ubicacion", "detalle_especifico", "tags",
        "historial_seguimiento", "evidencias_adjuntas"
      ],
      properties: {
        codigo_incidencia: { bsonType: "string" },
        titulo: { bsonType: "string", minLength: 5 },
        descripcion: { bsonType: "string", minLength: 10 },
        categoria: { enum: ["computo_redes", "infraestructura", "academico"] },
        prioridad: { enum: ["baja", "media", "alta", "critica"] },
        estado: { enum: ["abierta", "en proceso", "en espera", "resuelta", "cerrada"] },
        horas_invertidas: { bsonType: "number" },
        fecha_creacion: { bsonType: "date" },
        fecha_resolucion: { bsonType: "date" },
        reportante: {
          bsonType: "object",
          required: ["nombre", "rol", "correo"],
          properties: {
            nombre: { bsonType: "string" },
            rol: { bsonType: "string" },
            correo: { bsonType: "string" }
          }
        },
        ubicacion: {
          bsonType: "object",
          required: ["edificio", "aula_espacio"],
          properties: {
            edificio: { bsonType: "string" },
            aula_espacio: { bsonType: "string" }
          }
        },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        historial_seguimiento: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["fecha", "autor", "estado_asignado", "comentario"],
            properties: {
              fecha: { bsonType: "date" },
              autor: { bsonType: "string" },
              estado_asignado: { bsonType: "string" },
              comentario: { bsonType: "string" },
              horas_agregadas: { bsonType: "number" }
            }
          }
        },
        evidencias_adjuntas: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["nombre_archivo", "tipo_mime", "url_storage", "fecha_carga"],
            properties: {
              nombre_archivo: { bsonType: "string" },
              tipo_mime: { bsonType: "string" },
              peso_kb: { bsonType: "number" },
              url_storage: { bsonType: "string" },
              fecha_carga: { bsonType: "date" }
            }
          }
        },
        detalle_especifico: { bsonType: "object" }
      },
      oneOf: [
        {
          properties: {
            categoria: { enum: ["computo_redes"] },
            detalle_especifico: {
              bsonType: "object",
              required: ["direccion_ip", "vlan", "puerto_uplink", "equipos_afectados"],
              properties: {
                direccion_ip: { bsonType: "string" },
                vlan: { bsonType: "string" },
                puerto_uplink: { bsonType: "string" },
                equipos_afectados: { bsonType: "int" }
              },
              additionalProperties: false
            }
          }
        },
        {
          properties: {
            categoria: { enum: ["infraestructura"] },
            detalle_especifico: {
              bsonType: "object",
              required: ["tipo_dano", "riesgo_seguridad", "insumos_requeridos", "requiere_contratista"],
              properties: {
                tipo_dano: { bsonType: "string" },
                riesgo_seguridad: { bsonType: "string" },
                insumos_requeridos: { bsonType: "array", items: { bsonType: "string" } },
                requiere_contratista: { bsonType: "bool" }
              },
              additionalProperties: false
            }
          }
        },
        {
          properties: {
            categoria: { enum: ["academico"] },
            detalle_especifico: {
              bsonType: "object",
              required: ["plataforma", "codigo_curso", "periodo_escolar", "estudiantes_impactados"],
              properties: {
                plataforma: { bsonType: "string" },
                codigo_curso: { bsonType: "string" },
                periodo_escolar: { bsonType: "string" },
                estudiantes_impactados: { bsonType: "int" }
              },
              additionalProperties: false
            }
          }
        }
      ]
    }
  }
});
```

---

### 5.3 Los 3 Índices de Optimización Requeridos (RNF-04)

```javascript
// 1. Índice Compuesto para Dashboard Directivo y filtros por categoría/estado/edificio
db.incidencias_campus.createIndex(
  { categoria: 1, estado: 1, "ubicacion.edificio": 1 },
  { name: "idx_categoria_estado_edificio" }
);

// 2. Índice TTL para borrado automático a los 60 días (5,184,000 segundos) tras resolverse
db.incidencias_campus.createIndex(
  { fecha_resolucion: 1 },
  { expireAfterSeconds: 5184000, name: "idx_ttl_fecha_resolucion" }
);

// 3. Índice Full-Text Search ponderado en español para el buscador de soporte
db.incidencias_campus.createIndex(
  { titulo: "text", descripcion: "text" },
  { 
    default_language: "spanish",
    weights: { titulo: 10, descripcion: 5 },
    name: "idx_fulltext_titulo_descripcion"
  }
);
```

---

## 6. Demostración de Operaciones Atómicas y Pipelines de Agregación

### 6.1 Operaciones Atómicas Obligatorias en MongoDB
* **`$set`, `$push` e `$inc` en Seguimiento Atómico (CU-03):**
  ```javascript
  await db.collection("incidencias_campus").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { estado: "resuelta", fecha_resolucion: new Date() },
      $push: {
        historial_seguimiento: {
          fecha: new Date(),
          autor: "Ing. Carlos Euan",
          estado_asignado: "resuelta",
          comentario: "Incidencia solventada exitosamente.",
          horas_agregadas: 2
        }
      },
      $inc: { horas_invertidas: 2 }
    }
  );
  ```
* **`$addToSet` y `$pull` en Gestión de Tags (CU-04):**
  ```javascript
  // Agregar asegurando unicidad:
  await db.collection("incidencias_campus").updateOne(
    { _id: new ObjectId(id) },
    { $addToSet: { tags: "urgente" } }
  );

  // Retirar etiqueta:
  await db.collection("incidencias_campus").updateOne(
    { _id: new ObjectId(id) },
    { $pull: { tags: "erroneo" } }
  );
  ```

### 6.2 Pipelines Analíticos Obligatorios (CU-06)
* **Pipeline 1: Promedio y total de horas por edificio:**
  ```javascript
  db.incidencias_campus.aggregate([
    { $match: { estado: { $in: ["resuelta", "cerrada"] } } },
    {
      $group: {
        _id: "$ubicacion.edificio",
        promedio_horas: { $avg: "$horas_invertidas" },
        total_horas: { $sum: "$horas_invertidas" },
        total_tickets: { $sum: 1 }
      }
    },
    { $sort: { total_tickets: -1 } }
  ]);
  ```
* **Pipeline 2: Ranking Top 10 tags recurrentes:**
  ```javascript
  db.incidencias_campus.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", frecuencia: { $sum: 1 } } },
    { $sort: { frecuencia: -1 } },
    { $limit: 10 }
  ]);
  ```

---

## 7. Banco Formal de Pruebas en Postman (Fase 2)

Colección exportada y disponible en: `postman/UTM-Desk.postman_collection.json`

| # | Nombre de la Petición | Método | Endpoint / URL | Cabeceras | Código Estado | Descripción y Payload Resumido |
|---|---|---|---|---|---|---|
| **1** | Salud del servicio | `GET` | `{{baseUrl}}/api/health` | — | `200 OK` | Verificación de conectividad de la API REST. |
| **2** | Crear incidencia polimórfica (CU-01) | `POST` | `{{baseUrl}}/api/incidencias` | `Content-Type: application/json` | `201 Created` | Payload válido (`computo_redes`). Genera folio atómico Redis `INC-2026-XXXX` y guarda `_id` en variable de Postman. |
| **3** | Listar incidencias (CU-05) | `GET` | `{{baseUrl}}/api/incidencias` | — | `200 OK` | Retorna listado paginado con filtros opcionales. |
| **4** | Buscar por Full-Text (CU-05) | `GET` | `{{baseUrl}}/api/incidencias/buscar?q=red` | — | `200 OK` | Evalúa índice `$text` con ponderación en español. |
| **5** | Obtener por ID | `GET` | `{{baseUrl}}/api/incidencias/{{incidenceId}}` | — | `200 OK` | Consulta el expediente íntegro de la incidencia creada. |
| **6** | Actualizar incidencia | `PUT` | `{{baseUrl}}/api/incidencias/{{incidenceId}}` | `Content-Type: application/json` | `200 OK` | Modificación de título y prioridad (`alta`). |
| **7** | Agregar seguimiento atómico (CU-03) | `PATCH` | `{{baseUrl}}/api/incidencias/{{incidenceId}}/seguimiento` | `Content-Type: application/json` | `200 OK` | `{ "estado": "en proceso", "horas_invertidas": 1.5, "comentario": "Revisión iniciada", "autor": "Técnico" }`. |
| **8** | Gestionar tag único (CU-04) | `PATCH` | `{{baseUrl}}/api/incidencias/{{incidenceId}}/tags` | `Content-Type: application/json` | `200 OK` | `{ "accion": "agregar", "tag": "verificado" }` vía `$addToSet`. |
| **9** | Cargar evidencia (CU-02) | `POST` | `{{baseUrl}}/api/incidencias/{{incidenceId}}/evidencias` | `Content-Type: application/json` | `200 OK` | Inserta metadatos y URL de almacenamiento en el arreglo. |
| **10** | Analítica Directiva (CU-06) | `GET` | `{{baseUrl}}/api/incidencias/analitica` | — | `200 OK` | Ejecuta y retorna los resultados de los 2 pipelines de agregación. |
| **11** | Error de Validación (Fallo `$jsonSchema`) | `POST` | `{{baseUrl}}/api/incidencias` | `Content-Type: application/json` | `400 Bad Request` | `{ "titulo": "Inv", "categoria": "invalida" }` → Rechazado con código 121 de MongoDB. |
| **12** | Eliminar incidencia | `DELETE` | `{{baseUrl}}/api/incidencias/{{incidenceId}}` | — | `200 OK` | Purga del registro de prueba para mantener la base limpia. |

---

## 8. Verificación de Cumplimiento de Datos Mínimos de la Rúbrica

El script maestro `setup_db.js` garantiza de forma demostrable los siguientes criterios evaluados por la cátedra:

* **Volumen:** 25 documentos sintéticos balanceados (cumple el rango exigido de 20 a 30).
* **Distribución de categorías:** 9 de `computo_redes`, 8 de `infraestructura` y 8 de `academico`.
* **Diversidad de Edificios:** Cobertura de 4 zonas del campus (`Edificio A`, `Edificio B`, `Edificio K`, `Biblioteca Central`).
* **Estados del Ciclo de Vida:** Representación de los 5 estados (`abierta`, `en proceso`, `en espera`, `resuelta`, `cerrada`).
* **Fecha de Resolución:** 18 documentos cuentan con `fecha_resolucion` asentada (la rúbrica exige mínimo 8).
* **Evidencias Adjuntas:** 22 documentos cuentan con evidencias registradas (la rúbrica exige al menos 15).

---

## 9. Conclusiones Técnicas

1. **Eficiencia en la consulta NoSQL:** La desnormalización documental mediante arreglos embebidos (`tags`, `historial_seguimiento`, `evidencias_adjuntas`) permitió resolver la trazabilidad completa del ticket universitario en una sola consulta $O(1)$, evitando el costo computacional de múltiples sentencias `JOIN` que demandaría una arquitectura relacional.
2. **Polimorfismo sin desperdicio:** El operador `oneOf` de MongoDB `$jsonSchema` demostró ser la alternativa óptima frente al patrón relacional de *Single Table Inheritance*, eliminando por completo la proliferación de columnas en `NULL` y preservando la integridad tipada de los datos en tiempo de inserción.
3. **Concurrencia desacoplada:** La incorporación de Redis Cloud como generador de folios atómicos eliminó los cuellos de botella y condiciones de carrera propios de secuencias transaccionales en bases de datos en disco, garantizando folios irrepetibles de alto desempeño.

---

## 10. Referencias Bibliográficas (Formato APA 7.ª Edición)

* Banker, K., Bakkum, P., Verch, S., Garrett, D., & Hawkins, T. (2016). *MongoDB in action: Principles of document-oriented databases* (2.ª ed.). Manning Publications.
* Carlson, J. L. (2013). *Redis in action*. Manning Publications.
* Chodorow, K. (2013). *MongoDB: The definitive guide* (2.ª ed.). O'Reilly Media.
* Express.js. (2024). *Fast, unopinionated, minimalist web framework for Node.js*. OpenJS Foundation. https://expressjs.com/
* MongoDB Inc. (2024). *The MongoDB manual: Schema validation with $jsonSchema*. MongoDB Documentation. https://www.mongodb.com/docs/manual/core/schema-validation/
* Redis Ltd. (2024). *Redis documentation: INCR command and atomic transactions*. Redis.io. https://redis.io/commands/incr/
