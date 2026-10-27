// ═══════════════════════════════════════════════════════════════
// components/ui/ThemeToggle.jsx — Botón de alternancia Modo Oscuro / Modo Claro
// ═══════════════════════════════════════════════════════════════
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      aria-label="Alternar tema"
    >
      <div className="theme-toggle-icon-wrapper">
        {isDark ? (
          <Sun className="theme-toggle-icon theme-toggle-icon--sun" size={18} />
        ) : (
          <Moon className="theme-toggle-icon theme-toggle-icon--moon" size={18} />
        )}
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
