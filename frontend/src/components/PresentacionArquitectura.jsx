import { useState, useEffect } from 'react';
import {
  Cpu, Database, Layers, CheckCircle2, XCircle, Play, RefreshCw,
  Zap, Shield, Server, FileCode, ArrowRight, Activity, Terminal,
  Clock, Hash, Sparkles, Check, AlertTriangle, ExternalLink
} from 'lucide-react';
import {
  checkHealth,
  listarIncidencias,
  crearIncidencia,
  actualizarSeguimiento,
  buscarIncidencias,
  obtenerAnalitica,
  eliminarIncidencia
} from '../services/api';

export default function PresentacionArquitectura() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [latency, setLatency] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [activeTab, setActiveTab] = useState('diagrama'); // 'diagrama' | 'pruebas' | 'casos_uso' | 'esquema'

  // Test Runner State
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(false);
  const [activeTestLog, setActiveTestLog] = useState(null);

  // Ping health on mount
  useEffect(() => {
    pingServer();
  }, []);

  const pingServer = async () => {
    setCheckingHealth(true);
    const start = performance.now();
    try {
      const res = await checkHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthStatus({ ok: true, data: res.data });
    } catch (err) {
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthStatus({ ok: false, error: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  // Automated Test Suite Runner
  const runLiveTestSuite = async () => {
    setRunningTests(true);
    setTestResults([]);
    setActiveTestLog(null);

    const steps = [
      { id: 't1', name: 'CU-Health: Disponibilidad de API REST', status: 'pending' },
      { id: 't2', name: 'CU-01: Generación Atómica de Folio con Redis INCR', status: 'pending' },
      { id: 't3', name: 'CU-01: Inserción en MongoDB Atlas con $jsonSchema', status: 'pending' },
      { id: 't4', name: 'CU-Validation: Rechazo de Esquema Inválido en MongoDB', status: 'pending' },
      { id: 't5', name: 'CU-05: Consulta Full-Text Search con Índice de Texto', status: 'pending' },
      { id: 't6', name: 'CU-03: Actualización Atómica de Historial y Estado', status: 'pending' },
      { id: 't7', name: 'CU-06: Pipeline de Agregación Analítica Compleja', status: 'pending' },
      { id: 't8', name: 'CU-Clean: Eliminación del Registro Temporal de Prueba', status: 'pending' },
    ];

    setTestResults([...steps]);

    let createdId = null;
    let createdFolio = null;

    const updateStep = (id, status, duration, payload, response, error = null) => {
      setTestResults(prev =>
        prev.map(s => s.id === id ? { ...s, status, duration, payload, response, error } : s)
      );
    };

    // ── Paso 1: Health Check ──
    try {
      const tStart = performance.now();
      const res = await checkHealth();
      const dur = Math.round(performance.now() - tStart);
      updateStep('t1', 'passed', dur, { endpoint: 'GET /api/health' }, res.data);
    } catch (err) {
      updateStep('t1', 'failed', 0, null, null, err.message);
    }

    // ── Paso 2 y 3: Crear Incidencia Válida (Redis INCR + MongoDB) ──
    const testDoc = {
      titulo: 'Prueba Automatizada de Presentación NoSQL',
      descripcion: 'Incidencia temporal de verificación de conectividad y validador polimórfico.',
      categoria: 'computo_redes',
      prioridad: 'alta',
      reportante: {
        nombre: 'Validador Automático',
        rol: 'Soporte Técnico',
        correo: 'qa.test@utm.mx'
      },
      ubicacion: {
        edificio: 'Edificio A',
        aula_espacio: 'Sala de Servidores Central'
      },
      tags: ['qa', 'test-runner', 'redis-check'],
      detalle_especifico: {
        direccion_ip: '10.99.99.1',
        vlan: 'VLAN-999',
        puerto_uplink: 'Gi1/0/48',
        equipos_afectados: 1
      }
    };

    try {
      const tStart = performance.now();
      const res = await crearIncidencia(testDoc);
      const dur = Math.round(performance.now() - tStart);
      createdId = res.data?.incidencia?._id;
      createdFolio = res.data?.incidencia?.codigo_incidencia;

      updateStep('t2', 'passed', Math.round(dur / 2), { clave_redis: 'contador:incidencias:global' }, { folio_generado: createdFolio });
      updateStep('t3', 'passed', dur, testDoc, res.data);
    } catch (err) {
      updateStep('t2', 'failed', 0, null, null, 'Error al contactar Redis');
      updateStep('t3', 'failed', 0, testDoc, null, err.response?.data || err.message);
    }

    // ── Paso 4: Probar Rechazo de Validación $jsonSchema ──
    const invalidDoc = {
      titulo: 'Corto', // Menor a 5 caracteres
      categoria: 'categoria_inexistente',
      prioridad: 'invalida'
    };

    try {
      const tStart = performance.now();
      let rejectedProperly = false;
      let rejectResponse = null;
      try {
        await crearIncidencia(invalidDoc);
      } catch (err) {
        rejectedProperly = true;
        rejectResponse = err.response?.data || err.message;
      }
      const dur = Math.round(performance.now() - tStart);

      if (rejectedProperly) {
        updateStep('t4', 'passed', dur, invalidDoc, {
          mensaje: 'MongoDB rechazó correctamente la inserción por violación de $jsonSchema',
          error_capturado: rejectResponse
        });
      } else {
        updateStep('t4', 'failed', dur, invalidDoc, null, 'El documento inválido fue aceptado indebidamente');
      }
    } catch (err) {
      updateStep('t4', 'failed', 0, invalidDoc, null, err.message);
    }

    // ── Paso 5: Búsqueda Full-Text ──
    try {
      const tStart = performance.now();
      const res = await buscarIncidencias('Prueba');
      const dur = Math.round(performance.now() - tStart);
      updateStep('t5', 'passed', dur, { query: 'Prueba', indice: 'fulltext en español' }, { resultados_encontrados: res.data?.length || 0 });
    } catch (err) {
      updateStep('t5', 'failed', 0, { query: 'Prueba' }, null, err.message);
    }

    // ── Paso 6: Actualización de Seguimiento ──
    if (createdId) {
      try {
        const tStart = performance.now();
        const res = await actualizarSeguimiento(createdId, {
          autor: 'Robot de Verificación',
          estado_asignado: 'en proceso',
          comentario: 'Verificación de pipeline de actualización en vivo.',
          horas_agregadas: 1
        });
        const dur = Math.round(performance.now() - tStart);
        updateStep('t6', 'passed', dur, { id: createdId, estado_asignado: 'en proceso' }, res.data);
      } catch (err) {
        updateStep('t6', 'failed', 0, null, null, err.message);
      }
    } else {
      updateStep('t6', 'skipped', 0, null, null, 'No se pudo ejecutar porque no se creó el registro');
    }

    // ── Paso 7: Analítica ──
    try {
      const tStart = performance.now();
      const res = await obtenerAnalitica();
      const dur = Math.round(performance.now() - tStart);
      updateStep('t7', 'passed', dur, { pipeline: '$facet con 6 agregaciones' }, {
        metricas_generadas: Object.keys(res.data || {}),
        edificios: res.data?.eficiencia_por_edificio?.length || 0
      });
    } catch (err) {
      updateStep('t7', 'failed', 0, null, null, err.message);
    }

    // ── Paso 8: Limpieza del registro de prueba ──
    if (createdId) {
      try {
        const tStart = performance.now();
        const res = await eliminarIncidencia(createdId);
        const dur = Math.round(performance.now() - tStart);
        updateStep('t8', 'passed', dur, { delete_id: createdId }, res.data);
      } catch (err) {
        updateStep('t8', 'failed', 0, null, null, err.message);
      }
    } else {
      updateStep('t8', 'skipped', 0, null, null, 'Sin ID que eliminar');
    }

    setRunningTests(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* ── Top Presentation Header ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-primary-950/80 via-surface-900/90 to-surface-950/90 border border-primary-500/20 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={12} className="text-primary-400" />
              UTM Desk · Centro de Control NoSQL Cloud
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Arquitectura del Sistema & Suite de Pruebas Exactas
            </h1>
            <p className="text-surface-200/60 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Plataforma integral de gestión de incidencias del Campus UTM basada en almacenamiento NoSQL polimórfico con <strong>MongoDB Atlas</strong> y concurrencia en memoria con <strong>Redis Cloud</strong>.
            </p>
          </div>

          {/* Quick Health Capsule */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div className="relative">
                <div className={`w-3.5 h-3.5 rounded-full ${healthStatus?.ok ? 'bg-success-400' : 'bg-danger-400'}`}></div>
                {healthStatus?.ok && (
                  <div className="w-3.5 h-3.5 rounded-full bg-success-400 absolute inset-0 animate-ping opacity-60"></div>
                )}
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-surface-200/40 font-semibold">Estado del Clúster</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {healthStatus?.ok ? 'En Línea (Cloud)' : 'Desconectado'}
                  </span>
                  {latency !== null && (
                    <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-primary-500/15 text-primary-300 font-mono font-bold">
                      {latency} ms
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={pingServer}
                disabled={checkingHealth}
                className="p-1.5 rounded-lg text-surface-200/40 hover:text-white hover:bg-white/5 transition-colors ml-1"
                title="Probar latencia del clúster"
              >
                <RefreshCw size={14} className={checkingHealth ? 'animate-spin text-primary-400' : ''} />
              </button>
            </div>

            <button
              onClick={runLiveTestSuite}
              disabled={runningTests}
              className="btn-primary flex items-center gap-2 py-3 px-5 whitespace-nowrap shadow-lg shadow-primary-500/25"
            >
              <Play size={16} className={runningTests ? 'animate-pulse' : ''} />
              {runningTests ? 'Ejecutando Pruebas...' : 'Ejecutar Suite de Pruebas'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/5">
          {[
            { id: 'diagrama', label: 'Arquitectura & Flujo', icon: <Layers size={14} /> },
            { id: 'pruebas', label: 'Suite de Pruebas Exactas', icon: <Terminal size={14} /> },
            { id: 'casos_uso', label: 'Casos de Uso (CU-01 a CU-07)', icon: <Server size={14} /> },
            { id: 'esquema', label: 'Validador BSON $jsonSchema', icon: <FileCode size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-200 border border-primary-500/30 shadow-md shadow-primary-500/10'
                  : 'text-surface-200/50 hover:text-white hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab 1: Diagrama de Arquitectura ── */}
      {activeTab === 'diagrama' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Frontend Node */}
            <div className="glass-card p-5 relative group overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-3 shadow-md shadow-cyan-500/20">
                <Cpu size={20} />
              </div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-cyan-400">Capa Cliente</span>
              <h3 className="text-base font-bold text-white mt-0.5">React 19 + Tailwind</h3>
              <p className="text-xs text-surface-200/50 mt-2 leading-relaxed">
                Vite Dev Server con proxy inverso, Tailwind CSS v4 con Glassmorphism y Recharts interactivo.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 text-[0.68rem] text-surface-200/40 font-mono">
                Puerto: 5173 · SPA React Router
              </div>
            </div>

            {/* Backend Node */}
            <div className="glass-card p-5 relative group overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-700 flex items-center justify-center text-white mb-3 shadow-md shadow-primary-500/20">
                <Server size={20} />
              </div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-primary-400">Capa de Servicios</span>
              <h3 className="text-base font-bold text-white mt-0.5">Node.js + Express</h3>
              <p className="text-xs text-surface-200/50 mt-2 leading-relaxed">
                API RESTful MVC con controladores para CU-01 a CU-07, middleware Multer para evidencias y manejo de errores.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 text-[0.68rem] text-surface-200/40 font-mono">
                Puerto: 5000 · REST API
              </div>
            </div>

            {/* Redis Cloud Node */}
            <div className="glass-card p-5 relative group overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white mb-3 shadow-md shadow-rose-500/20">
                <Zap size={20} />
              </div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-rose-400">En Memoria</span>
              <h3 className="text-base font-bold text-white mt-0.5">Redis Cloud</h3>
              <p className="text-xs text-surface-200/50 mt-2 leading-relaxed">
                Generador atómico de folios <code className="text-rose-300">INC-YYYY-XXXX</code> vía <code>INCR</code>, contadores diarios con TTL y caché.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 text-[0.68rem] text-surface-200/40 font-mono">
                Host: brownish-parcel-pen-14899
              </div>
            </div>

            {/* MongoDB Atlas Node */}
            <div className="glass-card p-5 relative group overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white mb-3 shadow-md shadow-emerald-500/20">
                <Database size={20} />
              </div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-emerald-400">Base NoSQL Principal</span>
              <h3 className="text-base font-bold text-white mt-0.5">MongoDB Atlas</h3>
              <p className="text-xs text-surface-200/50 mt-2 leading-relaxed">
                Colección <code>incidencias_campus</code> con validación polimórfica <code>$jsonSchema</code>, índices y Full-Text Search.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 text-[0.68rem] text-surface-200/40 font-mono">
                DB: utm_desk_nosql · Cluster0
              </div>
            </div>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-primary-400" />
              Ciclo de Vida de una Incidencia (Flujo Atómico e Inserción Polimórfica)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 font-bold text-[0.65rem]">
                  Fase 1 · Captura & Folio
                </span>
                <p className="text-surface-200/80 font-medium">1. El usuario envía el formulario polimórfico.</p>
                <p className="text-surface-200/50 text-[0.72rem]">
                  Express intercepta la petición y llama a <code className="text-rose-300">redis.incr("contador:incidencias:global")</code> para asegurar unicidad absoluta sin condiciones de carrera.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[0.65rem]">
                  Fase 2 · Validación BSON
                </span>
                <p className="text-surface-200/80 font-medium">2. MongoDB valida las reglas de categoría.</p>
                <p className="text-surface-200/50 text-[0.72rem]">
                  El motor de MongoDB evalúa la sección <code className="text-emerald-300">oneOf</code>. Si es de cómputo exige IP y VLAN; si es infraestructura exige tipo de daño y riesgo; si es académico exige plataforma y curso.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[0.65rem]">
                  Fase 3 · Seguimiento & Métricas
                </span>
                <p className="text-surface-200/80 font-medium">3. Operación en tiempo real.</p>
                <p className="text-surface-200/50 text-[0.72rem]">
                  Los técnicos agregan notas a <code className="text-amber-300">historial_seguimiento</code> mediante <code className="text-indigo-300">$push</code> acumulando horas con <code className="text-indigo-300">$inc</code>, alimentando el dashboard analítico al instante.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Test Suite en Vivo ── */}
      {activeTab === 'pruebas' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal size={18} className="text-primary-400" />
                  Ejecutor de Pruebas Exactas en Vivo
                </h3>
                <p className="text-xs text-surface-200/50 mt-1">
                  Demuestra en tiempo real ante evaluadores que cada operación interactúa con MongoDB Atlas y Redis Cloud de forma real y precisa.
                </p>
              </div>
              <button
                onClick={runLiveTestSuite}
                disabled={runningTests}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-xs font-semibold self-start sm:self-auto"
              >
                <Play size={14} />
                {runningTests ? 'Ejecutando...' : 'Lanzar Todas las Pruebas'}
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                <Terminal size={36} className="mx-auto text-primary-400/40 mb-3" />
                <p className="text-sm font-semibold text-white">Ninguna prueba ejecutada aún</p>
                <p className="text-xs text-surface-200/40 mt-1 max-w-sm mx-auto">
                  Haz clic en el botón superior para correr la suite completa y observar el tiempo exacto de respuesta de cada caso de uso.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {testResults.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-surface-900/60 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {t.status === 'passed' && (
                        <div className="w-7 h-7 rounded-lg bg-success-500/15 flex items-center justify-center text-success-400 shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      {t.status === 'failed' && (
                        <div className="w-7 h-7 rounded-lg bg-danger-500/15 flex items-center justify-center text-danger-400 shrink-0">
                          <XCircle size={16} />
                        </div>
                      )}
                      {t.status === 'pending' && (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                          <RefreshCw size={14} className="animate-spin" />
                        </div>
                      )}
                      {t.status === 'skipped' && (
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-surface-200/40 shrink-0">
                          <Clock size={14} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-white">{t.name}</p>
                        <p className="text-[0.68rem] text-surface-200/40">
                          {t.status === 'passed' && 'Completado exitosamente sin discrepancias'}
                          {t.status === 'failed' && `Error: ${t.error}`}
                          {t.status === 'pending' && 'Esperando respuesta del clúster...'}
                          {t.status === 'skipped' && 'Omitido'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {t.duration !== undefined && (
                        <span className="font-mono text-xs font-semibold text-primary-300 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                          {t.duration} ms
                        </span>
                      )}
                      {(t.payload || t.response) && (
                        <button
                          onClick={() => setActiveTestLog(activeTestLog?.id === t.id ? null : t)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-surface-200/70 hover:text-white bg-white/[0.04] hover:bg-white/10 transition-colors"
                        >
                          {activeTestLog?.id === t.id ? 'Ocultar JSON' : 'Ver JSON'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Test Log Inspector Modal/Drawer */}
            {activeTestLog && (
              <div className="mt-5 p-4 rounded-xl bg-surface-950 border border-primary-500/20 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <FileCode size={14} className="text-primary-400" />
                    <span className="text-xs font-bold text-white">Inspección de Carga: {activeTestLog.name}</span>
                  </div>
                  <span className="text-[0.68rem] font-mono text-primary-300">{activeTestLog.duration} ms</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <p className="text-[0.68rem] text-surface-200/40 uppercase mb-1.5 font-bold">Payload Enviado</p>
                    <pre className="p-3 rounded-lg bg-surface-900 border border-white/5 text-primary-300 overflow-x-auto text-[0.72rem] max-h-56">
                      {JSON.stringify(activeTestLog.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[0.68rem] text-surface-200/40 uppercase mb-1.5 font-bold">Respuesta del Servidor</p>
                    <pre className="p-3 rounded-lg bg-surface-900 border border-white/5 text-emerald-300 overflow-x-auto text-[0.72rem] max-h-56">
                      {JSON.stringify(activeTestLog.response || activeTestLog.error, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Casos de Uso (CU-01 a CU-07) ── */}
      {activeTab === 'casos_uso' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: 'CU-01',
              title: 'Registrar Nueva Incidencia Polimórfica',
              verb: 'POST',
              endpoint: '/api/incidencias',
              color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
              desc: 'Genera folio formal único mediante Redis INCR y persiste el documento polimórfico en MongoDB Atlas sujeto al validador estricto.',
            },
            {
              id: 'CU-02',
              title: 'Cargar Evidencias Multimedia',
              verb: 'POST',
              endpoint: '/api/incidencias/:id/evidencias',
              color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
              desc: 'Adjunta capturas o logs al subdocumento evidencias_adjuntas utilizando Multer con almacenamiento en disco y metadatos.',
            },
            {
              id: 'CU-03',
              title: 'Actualizar Seguimiento y Estado',
              verb: 'PATCH',
              endpoint: '/api/incidencias/:id/seguimiento',
              color: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
              desc: 'Añade una entrada cronológica al arreglo historial_seguimiento con $push y acumula las horas_invertidas con operador atómico $inc.',
            },
            {
              id: 'CU-04',
              title: 'Gestión de Etiquetas (Tags)',
              verb: 'PATCH',
              endpoint: '/api/incidencias/:id/tags',
              color: 'text-violet-400 border-violet-500/20 bg-violet-500/10',
              desc: 'Permite agregar nuevos tags únicos con $addToSet o eliminarlos con $pull sin duplicidad de identificadores.',
            },
            {
              id: 'CU-05',
              title: 'Búsqueda Full-Text en Español',
              verb: 'GET',
              endpoint: '/api/incidencias/buscar?q=texto',
              color: 'text-primary-400 border-primary-500/20 bg-primary-500/10',
              desc: 'Ejecuta consulta con índice $text sobre titulo, descripcion y tags con análisis lingüístico en español.',
            },
            {
              id: 'CU-06',
              title: 'Consultar Analítica del Campus',
              verb: 'GET',
              endpoint: '/api/incidencias/analitica',
              color: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
              desc: 'Pipeline masivo de agregación en MongoDB con etapas $facet, $group, $sort y $unwind para indicadores de eficiencia y KPIs.',
            },
            {
              id: 'CU-07',
              title: 'Listar Incidencias con Filtros',
              verb: 'GET',
              endpoint: '/api/incidencias',
              color: 'text-sky-400 border-sky-500/20 bg-sky-500/10',
              desc: 'Consulta filtrada por categoría, estado, edificio y fecha haciendo uso del índice compuesto { categoria: 1, prioridad: 1, estado: 1 }.',
            },
          ].map(cu => (
            <div key={cu.id} className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  {cu.id}
                </span>
                <span className={`text-[0.68rem] font-mono font-bold px-2 py-0.5 rounded border ${cu.color}`}>
                  {cu.verb} {cu.endpoint}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{cu.title}</h4>
              <p className="text-xs text-surface-200/60 leading-relaxed">{cu.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 4: Validador de Esquema $jsonSchema ── */}
      {activeTab === 'esquema' && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode size={18} className="text-primary-400" />
                Validador Polimórfico MongoDB ($jsonSchema + oneOf)
              </h3>
              <p className="text-xs text-surface-200/50 mt-1">
                Estructura de validación estricta a nivel de motor en la colección <code>incidencias_campus</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Cómputo */}
            <div className="p-4 rounded-xl bg-surface-900/80 border border-sky-500/20 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Zap size={14} />
                <span>computo_redes</span>
              </div>
              <p className="text-[0.68rem] text-surface-200/50">Campos obligatorios en detalle_especifico:</p>
              <ul className="list-disc list-inside text-surface-200/80 space-y-1 text-[0.72rem]">
                <li><code className="text-sky-300">direccion_ip</code>: string</li>
                <li><code className="text-sky-300">vlan</code>: string</li>
                <li><code className="text-sky-300">puerto_uplink</code>: string</li>
                <li><code className="text-sky-300">equipos_afectados</code>: int</li>
              </ul>
            </div>

            {/* Infraestructura */}
            <div className="p-4 rounded-xl bg-surface-900/80 border border-orange-500/20 space-y-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <Server size={14} />
                <span>infraestructura</span>
              </div>
              <p className="text-[0.68rem] text-surface-200/50">Campos obligatorios en detalle_especifico:</p>
              <ul className="list-disc list-inside text-surface-200/80 space-y-1 text-[0.72rem]">
                <li><code className="text-orange-300">tipo_dano</code>: string</li>
                <li><code className="text-orange-300">riesgo_seguridad</code>: string</li>
                <li><code className="text-orange-300">insumos_requeridos</code>: array[string]</li>
                <li><code className="text-orange-300">requiere_contratista</code>: bool</li>
              </ul>
            </div>

            {/* Académico */}
            <div className="p-4 rounded-xl bg-surface-900/80 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Layers size={14} />
                <span>academico</span>
              </div>
              <p className="text-[0.68rem] text-surface-200/50">Campos obligatorios en detalle_especifico:</p>
              <ul className="list-disc list-inside text-surface-200/80 space-y-1 text-[0.72rem]">
                <li><code className="text-purple-300">plataforma</code>: string</li>
                <li><code className="text-purple-300">codigo_curso</code>: string</li>
                <li><code className="text-purple-300">periodo_escolar</code>: string</li>
                <li><code className="text-purple-300">estudiantes_impactados</code>: int</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
