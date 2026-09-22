import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

// ── Definición de columnas a mostrar (clave en la respuesta, etiqueta, si es calculada) ──
const COLS_BATEO = [
  ['vb', 'VB'], ['ca', 'CA'], ['hc', 'HC'], ['bb', 'BB'],
  ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'], ['in_', 'IN'],
  ['al', 'AL'],
  ['promedio_bateo', 'AVE', true],
  ['ops', 'OPS', true],
  ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'],
  ['ba', 'BA'],
  ['promedio_slugging', 'AVE', true],
  ['ci', 'CI'], ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'],
];

const COLS_PITCHEO = [
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['b', 'B'],
  ['g', 'G'], ['p', 'P'], ['s', 'S'], ['e', 'E'],
  ['promedio_bateo_permitido', 'AVE', true],
  ['vb', 'VB'], ['hp', 'HP'], ['h2', 'H2'], ['h3', 'H3'], ['hr', 'HR'],
  ['il', 'IL'],
  ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'],
  ['bi', 'BI'], ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'],
  ['wp', 'WP'], ['li', 'LI'],
  ['efectividad', 'EFEC', true],
];

const COLS_FILDEO = [
  ['ij', 'IJ'], ['o', 'O'], ['a', 'A'], ['e', 'E'],
  ['tl', 'TL'], ['dp', 'DP'], ['di', 'DI'],
  ['pb', 'PB'], ['ir', 'IR'], ['or_', 'OR'],
  ['promedio_fildeo', 'AVE', true],
];

function TablaColectivo({ titulo, cols, datos, juegos }) {
  return (
    <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
      <div className="tarjeta-lista__cabecera">
        <h3>{titulo}</h3>
        {juegos != null && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)' }}>
            {juegos} {juegos === 1 ? 'juego' : 'juegos'}
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tabla tabla-editable">
          <thead>
            <tr>
              {cols.map(([k, l, calc]) => (
                <th key={k} style={{ width: 52, color: calc ? 'var(--amber)' : undefined }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {cols.map(([k]) => (
                <td key={k} style={{ fontWeight: 700 }}>{datos?.[k] ?? 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EstadisticasColectivoPage() {
  const {
    temporadas, categorias,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [inscritos, setInscritos] = useState([]);
  const [equipoInscritoId, setEquipoInscritoId] = useState('');
  const [colectivo, setColectivo] = useState(null);
  const [cargandoInscritos, setCargandoInscritos] = useState(false);
  const [cargandoColectivo, setCargandoColectivo] = useState(false);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargandoInscritos(true);
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`)
      .then((data) => {
        setInscritos(data);
        if (!data.find((e) => e.id === equipoInscritoId)) {
          setEquipoInscritoId(data[0]?.id ?? '');
        }
      })
      .finally(() => setCargandoInscritos(false));
  }, [temporadaCategoriaId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!equipoInscritoId) { setColectivo(null); return; }
    setCargandoColectivo(true);
    api.get(`/estadisticas/colectivo/${equipoInscritoId}`)
      .then(setColectivo)
      .finally(() => setCargandoColectivo(false));
  }, [equipoInscritoId]);

  const equipoActual = inscritos.find((e) => e.id === equipoInscritoId);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Estadística colectiva</h1>
          <p>Totales acumulados de bateo, pitcheo y fildeo de todos los jugadores del equipo.</p>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Temporada</label>
            <select value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
              {temporadas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Categoría</label>
            <select value={temporadaCategoriaId} onChange={(e) => setTemporadaCategoriaId(e.target.value)}>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.categoria_nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Equipo</label>
            <select value={equipoInscritoId} onChange={(e) => setEquipoInscritoId(Number(e.target.value))}>
              {cargandoInscritos && <option value="">Cargando…</option>}
              {!cargandoInscritos && inscritos.length === 0 && <option value="">Sin equipos</option>}
              {inscritos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!equipoActual && <div className="vacio">Selecciona un equipo para ver su estadística colectiva.</div>}

      {equipoActual && cargandoColectivo && <div className="vacio">Cargando…</div>}

      {equipoActual && !cargandoColectivo && colectivo && (
        <>
          <TablaColectivo titulo={`Bateo colectivo — ${equipoActual.nombre}`} cols={COLS_BATEO} datos={colectivo.bateo} juegos={colectivo.bateo?.j} />
          <TablaColectivo titulo={`Pitcheo colectivo — ${equipoActual.nombre}`} cols={COLS_PITCHEO} datos={colectivo.pitcheo} juegos={colectivo.pitcheo?.j} />
          <TablaColectivo titulo={`Fildeo colectivo — ${equipoActual.nombre}`} cols={COLS_FILDEO} datos={colectivo.fildeo} />
        </>
      )}
    </div>
  );
}