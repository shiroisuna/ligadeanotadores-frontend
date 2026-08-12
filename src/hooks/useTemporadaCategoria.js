import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

export function useTemporadaCategoria() {
  const { notificar } = useToast();
  const [temporadas, setTemporadas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/temporadas')
      .then((data) => {
        setTemporadas(data);
        setError('');
        const activa = data.find((t) => t.activa) || data[0];
        if (activa) setTemporadaId(String(activa.id));
      })
      .catch((err) => {
        setError(err.message);
        notificar(`No se pudo cargar temporadas: ${err.message}`, 'error');
      })
      .finally(() => setCargando(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!temporadaId) return;
    api.get(`/temporadas/categorias?temporada_id=${temporadaId}`)
      .then((data) => {
        setCategorias(data);
        setTemporadaCategoriaId(data[0] ? String(data[0].id) : '');
        setError('');
      })
      .catch((err) => {
        setError(err.message);
        notificar(`No se pudo cargar categorías: ${err.message}`, 'error');
      });
  }, [temporadaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoria = categorias.find((c) => String(c.id) === temporadaCategoriaId) || null;

  return {
    temporadas, categorias, categoria, cargando, error,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  };
}
