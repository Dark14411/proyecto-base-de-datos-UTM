import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ═══════════════════════════════════════════════════════════════
// Servicios de Incidencias
// ═══════════════════════════════════════════════════════════════

// CU-01: Crear incidencia
export const crearIncidencia = (data) =>
  api.post('/incidencias', data);

// CU-02: Subir evidencia
export const subirEvidencia = (id, formData) =>
  api.post(`/incidencias/${id}/evidencias`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// CU-02 (simulada): Subir evidencia sin archivo
export const subirEvidenciaSimulada = (id, data) =>
  api.post(`/incidencias/${id}/evidencias`, data);

// CU-03: Actualizar seguimiento
export const actualizarSeguimiento = (id, data) =>
  api.patch(`/incidencias/${id}/seguimiento`, data);

// CU-04: Gestionar tags
export const gestionarTags = (id, data) =>
  api.patch(`/incidencias/${id}/tags`, data);

// CU-05: Búsqueda full-text
export const buscarIncidencias = (q) =>
  api.get(`/incidencias/buscar?q=${encodeURIComponent(q)}`);

// CU-06: Analítica
export const obtenerAnalitica = () =>
  api.get('/incidencias/analitica');

// CU-07: Listar con filtros
export const listarIncidencias = (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.categoria) params.append('categoria', filtros.categoria);
  if (filtros.estado) params.append('estado', filtros.estado);
  if (filtros.edificio) params.append('edificio', filtros.edificio);
  return api.get(`/incidencias?${params.toString()}`);
};

// Extra: Obtener por ID
export const obtenerIncidencia = (id) =>
  api.get(`/incidencias/${id}`);

// CRUD: Actualizar datos generales de una incidencia
export const actualizarIncidencia = (id, data) =>
  api.put(`/incidencias/${id}`, data);

// CRUD: Eliminar una incidencia
export const eliminarIncidencia = (id) =>
  api.delete(`/incidencias/${id}`);

export default api;
