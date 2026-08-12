import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardado = localStorage.getItem('liga_usuario');
    if (guardado) setUsuario(JSON.parse(guardado));
    setCargando(false);
  }, []);

  async function login(email, password) {
    const { token, usuario: datosUsuario } = await api.login(email, password);
    localStorage.setItem('liga_token', token);
    localStorage.setItem('liga_usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
    return datosUsuario;
  }

  function logout() {
    localStorage.removeItem('liga_token');
    localStorage.removeItem('liga_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
