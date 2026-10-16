const assert = require("node:assert/strict");

const baseUrl = process.env.API_URL || "http://localhost:5000";
let incidenceId;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  assert.ok(response.ok, `${options.method || "GET"} ${path} -> ${response.status}: ${text}`);
  return body;
}

async function main() {
  const health = await request("/api/health");
  assert.equal(health.status, "OK");

  const created = await request("/api/incidencias", {
    method: "POST",
    body: JSON.stringify({
      titulo: `Prueba automatizada ${Date.now()}`,
      descripcion: "Incidencia temporal para validar todos los endpoints de la API.",
      categoria: "computo_redes",
      prioridad: "media",
      reportante: { nombre: "Smoke Test", rol: "QA", correo: "qa@utm.mx" },
      ubicacion: { edificio: "Edificio A", aula_espacio: "Laboratorio QA" },
      tags: ["smoke", "automatizada"],
      detalle_especifico: {
        direccion_ip: "10.10.10.10",
        vlan: "VLAN-200",
        puerto_uplink: "Gi1/0/2",
        equipos_afectados: 1,
      },
    }),
  });
  incidenceId = created.incidencia._id;
  assert.ok(incidenceId);

  const list = await request("/api/incidencias");
  assert.ok(Array.isArray(list.incidencias));
  await request(`/api/incidencias/${incidenceId}`);
  await request("/api/incidencias/buscar?q=Prueba");

  const updated = await request(`/api/incidencias/${incidenceId}`, {
    method: "PUT",
    body: JSON.stringify({ titulo: "Prueba automatizada actualizada", prioridad: "alta" }),
  });
  assert.equal(updated.incidencia.prioridad, "alta");

  await request(`/api/incidencias/${incidenceId}/seguimiento`, {
    method: "PATCH",
    body: JSON.stringify({
      estado: "en proceso",
      horas_invertidas: 1,
      comentario: "Validación automatizada de seguimiento.",
      autor: "Smoke Test",
    }),
  });
  await request(`/api/incidencias/${incidenceId}/tags`, {
    method: "PATCH",
    body: JSON.stringify({ accion: "agregar", tag: "validada" }),
  });
  await request(`/api/incidencias/${incidenceId}/evidencias`, {
    method: "POST",
    body: JSON.stringify({ nombre_archivo: "smoke.txt", tipo_mime: "text/plain", peso_kb: 1 }),
  });
  const analytics = await request("/api/incidencias/analitica");
  assert.ok(Array.isArray(analytics.distribucion_estado));

  await request(`/api/incidencias/${incidenceId}`, { method: "DELETE" });
  console.log("API smoke test: OK");
}

main().catch((error) => {
  console.error(`API smoke test: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
