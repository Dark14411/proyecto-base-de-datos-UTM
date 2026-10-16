import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  PlusCircle, Headset, BarChart3, Shield, Database,
  Terminal, Sparkles, Activity, Layers, ExternalLink, RefreshCw
} from 'lucide-react';
import FormularioIncidencia from './components/FormularioIncidencia';
import BandejaSoporte from './components/BandejaSoporte';
import DashboardAnalitico from './components/DashboardAnalitico';
import PresentacionArquitectura from './components/PresentacionArquitectura';
import { checkHealth } from './services/api';

function AppLayout() {
  const [online, setOnline] = useState(false);
  const [pingMs, setPingMs] = useState(null);

  useEffect(() => {
    const ping = async () => {
      const start = performance.now();
      try {
        await checkHealth();
        setPingMs(Math.round(performance.now() - start));
        setOnline(true);
      } catch (e) {
        setOnline(false);
        setPingMs(null);
      }
    };
    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar-shell flex flex-col py-6 px-4 gap-1">
        {/* Logo & University Brand */}
        <div className="flex items-center gap-3 px-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">UTM Desk</h1>
            <p className="text-[0.62rem] text-primary-300 font-bold tracking-[0.15em] uppercase">NoSQL Cloud Engine</p>
          </div>
        </div>

        {/* Presentation Badge */}
        <div className="px-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary-500/[0.08] border border-primary-500/20 text-[0.7rem] text-primary-200 flex items-center gap-2">
            <Sparkles size={13} className="text-primary-400 shrink-0" />
            <span>Modo Demostración Académica</span>
          </div>
        </div>

        <p className="px-3 text-[0.58rem] uppercase tracking-[0.2em] text-surface-200/30 font-bold mb-2">
          Módulos Principales
        </p>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          <NavItem to="/" icon={<PlusCircle size={17} />} label="Nueva Incidencia" badge="CU-01" />
          <NavItem to="/bandeja" icon={<Headset size={17} />} label="Bandeja de Soporte" badge="CU-02..05" />
          <NavItem to="/dashboard" icon={<BarChart3 size={17} />} label="Dashboard Analítico" badge="CU-06" />
          
          <div className="my-2 border-t border-white/5 mx-2"></div>
          
          <p className="px-3 text-[0.58rem] uppercase tracking-[0.2em] text-surface-200/30 font-bold mb-1">
            Evaluación & Auditoría
          </p>
          <NavItem
            to="/arquitectura"
            icon={<Terminal size={17} className="text-primary-400" />}
            label="Arquitectura & Pruebas"
            badge="Live Suite"
            highlight
          />
        </nav>

        {/* Footer Cluster Status */}
        <div className="mt-auto px-3 pt-4 border-t border-white/5">
          <div className="p-3 rounded-xl bg-surface-950/80 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] uppercase font-bold text-surface-200/40">Infraestructura</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${online ? 'bg-success-400 animate-pulse' : 'bg-danger-400'}`}></span>
                <span className="text-[0.68rem] font-bold text-white">
                  {online ? 'Conectado' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="text-[0.65rem] text-surface-200/60 font-mono space-y-0.5">
              <p className="flex justify-between">
                <span>MongoDB Atlas:</span>
                <strong className="text-emerald-400">Cluster0</strong>
              </p>
              <p className="flex justify-between">
                <span>Redis Cloud:</span>
                <strong className="text-rose-400">Online</strong>
              </p>
              {pingMs !== null && (
                <p className="flex justify-between text-primary-300">
                  <span>Latencia:</span>
                  <strong>{pingMs} ms</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Shell ── */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<FormularioIncidencia />} />
          <Route path="/bandeja" element={<BandejaSoporte />} />
          <Route path="/dashboard" element={<DashboardAnalitico />} />
          <Route path="/arquitectura" element={<PresentacionArquitectura />} />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, badge, highlight }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
          isActive
            ? 'bg-gradient-to-r from-primary-600/30 to-primary-500/10 text-white border border-primary-500/25 shadow-md shadow-primary-500/10'
            : highlight
              ? 'bg-primary-500/10 text-primary-200 border border-primary-500/20 hover:bg-primary-500/20'
              : 'text-surface-200/50 hover:text-surface-200/90 hover:bg-white/[0.03] border border-transparent'
        }`
      }
    >
      <div className="flex items-center gap-2.5">
        <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-white/5 group-hover:bg-white/10 text-surface-200/60 font-mono">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
