import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
let idContador = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const quitar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notificar = useCallback((mensaje, tipo = 'info') => {
    const id = ++idContador;
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => quitar(id), 4000);
  }, [quitar]);

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`} role="status">
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
