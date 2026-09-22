import { useEffect, useState } from 'react';
import { api } from '../api/client';

function clasificarRama(disciplinaNombre = '') {
  const d = (disciplinaNombre || '').toLowerCase().trim();
  if (d.includes('softbol') || d.includes('sóftbol')) return 'softbol';
  if (d.includes('mayor')) return 'mayor';
  // Cualquier variante de béisbol menor, o simplemente "béisbol"
  return 'menor';
}

export function useTemporadaCategoria() {
  const [temporadas, setTemporadas] = useState([]);
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState('');
  const [rama, setRamaInterna] = useState('menor');
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
      setTodasCategorias(data);
      // Primero intenta con la rama actualmente activa.
      const deLaRamaActual = data.filter((c) => clasificarRama(c.disciplina) === rama);
      if (deLaRamaActual.length > 0) {
        setTemporadaCategoriaId(String(deLaRamaActual[0].id));
        return;
      }
      // Si la rama activa no tiene ninguna categoría en esta temporada,
      // no asumimos "menor" por defecto: detectamos la rama real de la
      // primera categoría disponible y ajustamos el estado para que
      // coincida (evita el falso "Sin categorías" en el dropdown).
      if (data.length > 0) {
        setRamaInterna(clasificarRama(data[0].disciplina));
        setTemporadaCategoriaId(String(data[0].id));
      } else {
        setTemporadaCategoriaId('');
      }
    });
  }, [temporadaId]); // eslint-disable-line

  function setRama(nuevaRama) {
    setRamaInterna(nuevaRama);
    const deLaRama = todasCategorias.filter((c) => clasificarRama(c.disciplina) === nuevaRama);
    if (deLaRama[0]) setTemporadaCategoriaId(String(deLaRama[0].id));
  }

  const categorias = todasCategorias.filter((c) => clasificarRama(c.disciplina) === rama);
  const categoria = todasCategorias.find((c) => String(c.id) === temporadaCategoriaId) || null;

  const conteoPorRama = {
    menor:   todasCategorias.filter((c) => clasificarRama(c.disciplina) === 'menor').length,
    softbol: todasCategorias.filter((c) => clasificarRama(c.disciplina) === 'softbol').length,
    mayor:   todasCategorias.filter((c) => clasificarRama(c.disciplina) === 'mayor').length,
  };

  return {
    temporadas, categorias, todasCategorias, categoria, cargando,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
    rama, setRama, conteoPorRama,
  };
}