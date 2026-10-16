import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { PlusCircle, Headset, BarChart3, Shield, Database, Cpu } from 'lucide-react';
import FormularioIncidencia from './components/FormularioIncidencia';
import BandejaSoporte from './components/BandejaSoporte';
import DashboardAnalitico from './components/DashboardAnalitico';

function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar-shell flex flex-col py-6 px-4 gap-1">
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">UTM Desk</h1>
            <p className="text-[0.62rem] text-primary-300/80 font-semibold tracking-[0.12em] uppercase">NoSQL Cloud</p>
          </div>
        </div>

        <p className="px-3 text-[0.58rem] uppercase tracking-[0.18em] text-surface-200/30 font-semibold mb-2">
          Navegación
        </p>

        <nav className="flex flex-col gap-0.5">
          <NavItem to="/" icon={<PlusCircle size={17} />} label="Nueva Incidencia" />
          <NavItem to="/bandeja" icon={<Headset size={17} />} label="Bandeja de Soporte" />
          <NavItem to="/dashboard" icon={<BarChart3 size={17} />} label="Dashboard Analítico" />
        </nav>

        {/* Footer */}
        <div className="mt-auto px-3 pt-5">
          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center border border-primary-500/10">
                <Database size={13} className="text-primary-400/70" />
              </div>
              <div>
                <p className="text-[0.7rem] font-medium text-surface-200/70">Campus UTM</p>
                <p className="text-[0.58rem] text-surface-200/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 inline-block"></span>
                  MongoDB Atlas + Redis
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<FormularioIncidencia />} />
          <Route path="/bandeja" element={<BandejaSoporte />} />
          <Route path="/dashboard" element={<DashboardAnalitico />} />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          isActive
            ? 'bg-gradient-to-r from-primary-600/25 to-primary-500/8 text-white border border-primary-500/15 shadow-sm shadow-primary-500/5'
            : 'text-surface-200/50 hover:text-surface-200/90 hover:bg-white/[0.03] border border-transparent'
        }`
      }
    >
      <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
