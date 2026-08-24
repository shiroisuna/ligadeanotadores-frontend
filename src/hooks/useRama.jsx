import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const Ctx = createContext(null);

// Las categorías se clasifican en una de las 3 ramas según la disciplina
// que el admin le asignó al crearla.
function clasificarRama(disciplinaNombre = '') {
  const d = disciplinaNombre.toLowerCase();
  if (d.includes('softbol') || d.includes('sóftbol')) return 'softbol';
  if (d.includes('mayor')) return 'mayor';
  return 'menor'; // béisbol menor por defecto
}

export function RamaProvider({ children }) {
  const [rama, setRama] = useState('menor'); // 'menor' | 'softbol' | 'mayor'
  const [categorias, setCategorias] = useState({ menor: [], softbol: [], mayor: [] });
  const [temporadas, setTemporadas] = useState([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/temporadas').then((data) => {
      setTemporadas(data);
      const activa = data.find((t) => t.activa) || data[0];
      if (activa) setTemporadaId(String(activa.id));
      setCargando(false);
    }).catch(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!temporadaId) return;
    api.get(`/temporadas/categorias?temporada_id=${temporadaId}`).then((data) => {
      const agrupadas = { menor: [], softbol: [], mayor: [] };
      data.forEach((c) => {
        const r = clasificarRama(c.disciplina || c.categoria_nombre);
        agrupadas[r].push(c);
      });
      setCategorias(agrupadas);
      // Seleccionar la primera categoría de la rama activa
      const primeraRama = agrupadas[rama][0] || agrupadas.menor[0] || agrupadas.softbol[0] || agrupadas.mayor[0];
      setTemporadaCategoriaId(primeraRama ? String(primeraRama.id) : '');
    });
  }, [temporadaId]); // eslint-disable-line

  // Cuando cambia la rama, seleccionar la primera categoría de esa rama
  useEffect(() => {
    const primera = categorias[rama][0];
    if (primera) setTemporadaCategoriaId(String(primera.id));
  }, [rama]); // eslint-disable-line

  const todasCategorias = [...categorias.menor, ...categorias.softbol, ...categorias.mayor];
  const categoria = todasCategorias.find((c) => String(c.id) === temporadaCategoriaId) || null;

  return (
    <Ctx.Provider value={{
      rama, setRama,
      categorias, categoria,
      temporadas, temporadaId, setTemporadaId,
      temporadaCategoriaId, setTemporadaCategoriaId,
      cargando,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRama() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRama debe usarse dentro de <RamaProvider>');
  return ctx;
}
