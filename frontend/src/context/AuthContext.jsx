// ═══════════════════════════════════════════════════════════════
// context/AuthContext.jsx — Contexto de autenticación global
// ═══════════════════════════════════════════════════════════════
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar, restaurar sesión del localStorage
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('utm_desk_token');
    const usuarioGuardado = localStorage.getItem('utm_desk_usuario');

    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado);
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  const login = async (correo, password) => {
    const { data } = await api.post('/auth/login', { correo, password });
    if (data.exito) {
      const { token: nuevoToken, usuario: datosUsuario } = data.datos;
      setToken(nuevoToken);
      setUsuario(datosUsuario);
      localStorage.setItem('utm_desk_token', nuevoToken);
      localStorage.setItem('utm_desk_usuario', JSON.stringify(datosUsuario));
    }
    return data;
  };

  const registro = async (datosRegistro) => {
    const { data } = await api.post('/auth/registro', datosRegistro);
    if (data.exito) {
      const { token: nuevoToken, usuario: datosUsuario } = data.datos;
      setToken(nuevoToken);
      setUsuario(datosUsuario);
      localStorage.setItem('utm_desk_token', nuevoToken);
      localStorage.setItem('utm_desk_usuario', JSON.stringify(datosUsuario));
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('utm_desk_token');
    localStorage.removeItem('utm_desk_usuario');
  };

  const estaAutenticado = !!token && !!usuario;

  const tieneRol = (...roles) => {
    return usuario && roles.includes(usuario.rol);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        estaAutenticado,
        login,
        registro,
        logout,
        tieneRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
