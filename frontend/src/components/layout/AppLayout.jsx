// ═══════════════════════════════════════════════════════════════
// components/layout/AppLayout.jsx — Layout principal con sidebar
// ═══════════════════════════════════════════════════════════════
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
