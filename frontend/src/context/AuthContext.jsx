// ═══════════════════════════════════════════════════════════════
// context/AuthContext.jsx — Contexto de autenticación global
// Persistido en localStorage y sincronizado con usuarios_campus en MongoDB Atlas
// ═══════════════════════════════════════════════════════════════
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('utm_desk_usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('utm_desk_token') || null);
  const [usuariosCampus, setUsuariosCampus] = useState(() => {
    try {
      const guardados = localStorage.getItem('utm_desk_usuarios_campus');
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });
  const [cargando, setCargando] = useState(true);

  const recargarPerfiles = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/perfiles');
      if (data.exito && Array.isArray(data.datos)) {
        setUsuariosCampus(data.datos);
        localStorage.setItem('utm_desk_usuarios_campus', JSON.stringify(data.datos));
        return data.datos;
      }
    } catch (err) {
      console.warn('Usando respaldo local de usuarios_campus:', err.message);
    }
    return [];
  }, []);

  // Al montar, restaurar sesión del localStorage y sincronizar con MongoDB Atlas
  useEffect(() => {
    const inicializarSesion = async () => {
      const tokenGuardado = localStorage.getItem('utm_desk_token');
      const usuarioGuardado = localStorage.getItem('utm_desk_usuario');

      if (tokenGuardado && usuarioGuardado) {
        setToken(tokenGuardado);
        try {
          setUsuario(JSON.parse(usuarioGuardado));
        } catch {
          // ignore parse error
        }
        // Verificar y refrescar datos del usuario activo desde MongoDB Atlas
        try {
          const { data } = await api.get('/auth/perfil');
          if (data.exito && data.datos?.usuario) {
            setUsuario(data.datos.usuario);
            localStorage.setItem('utm_desk_usuario', JSON.stringify(data.datos.usuario));
          }
        } catch {
          // Conservar sesión local si hay latencia temporal
        }
      }

      await recargarPerfiles();
      setCargando(false);
    };

    inicializarSesion();
  }, [recargarPerfiles]);

  const guardarSesion = (nuevoToken, datosUsuario) => {
    setToken(nuevoToken);
    setUsuario(datosUsuario);
    localStorage.setItem('utm_desk_token', nuevoToken);
    localStorage.setItem('utm_desk_usuario', JSON.stringify(datosUsuario));
  };

  const login = async (correo, password) => {
    const { data } = await api.post('/auth/login', { correo, password });
    if (data.exito) {
      const { token: nuevoToken, usuario: datosUsuario } = data.datos;
      guardarSesion(nuevoToken, datosUsuario);
      recargarPerfiles();
    }
    return data;
  };

  const registro = async (datosRegistro) => {
    const { data } = await api.post('/auth/registro', datosRegistro);
    if (data.exito) {
      const { token: nuevoToken, usuario: datosUsuario } = data.datos;
      guardarSesion(nuevoToken, datosUsuario);
      await recargarPerfiles();
    }
    return data;
  };

  const switchUsuario = async (identificador) => {
    try {
      const payload = typeof identificador === 'object' ? identificador : { correo: identificador };
      const { data } = await api.post('/auth/switch', payload);
      if (data.exito) {
        const { token: nuevoToken, usuario: datosUsuario } = data.datos;
        guardarSesion(nuevoToken, datosUsuario);
        await recargarPerfiles();
        return data;
      }
    } catch (error) {
      console.error('Error al cambiar usuario activo:', error);
      throw error;
    }
  };

  const actualizarSesionSiCoincide = (usuarioActualizado) => {
    if (!usuario || !usuarioActualizado) return;
    if (usuario._id === usuarioActualizado._id || usuario.correo === usuarioActualizado.correo) {
      const fusionado = { ...usuario, ...usuarioActualizado };
      setUsuario(fusionado);
      localStorage.setItem('utm_desk_usuario', JSON.stringify(fusionado));
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('utm_desk_token');
    localStorage.removeItem('utm_desk_usuario');
  };

  const estaAutenticado = !!token && !!usuario;

  const tieneRol = (...roles) => {
    if (!usuario) return false;
    const rolActual = (usuario.rol || usuario.rol_sistema || '').toLowerCase();
    return roles.map((r) => r.toLowerCase()).includes(rolActual);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        usuariosCampus,
        cargando,
        estaAutenticado,
        login,
        registro,
        switchUsuario,
        recargarPerfiles,
        actualizarSesionSiCoincide,
        logout,
        tieneRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
