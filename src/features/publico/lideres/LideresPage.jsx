import { useEffect, useMemo, useState } from "react";
import { Marcador } from "../../../components/Marcador";
import { TeamBadge } from "../../../components/TeamBadge";
import { usePlayerModal } from "../../../components/PlayerModalProvider";
import { api } from "../../../api/client";

// [clave del stat, título de la tarjeta, ícono, dirección ('desc'|'asc')]
const TARJETAS_BATEO = [
  ['promedio_bateo', 'Promedio (AVE)', '📊', 'desc'],
  ['jonrones', 'Cuadrangulares (HR)', '⚾', 'desc'],
  ['carreras_impulsadas', 'Impulsadas (CI)', '👥', 'desc'],
  ['hits', 'Hits (H)', '🏏', 'desc'],
  ['dobles', 'Dobles (2B)', '🔁', 'desc'],
  ['triples', 'Triples (3B)', '🔺', 'desc'],
  ['carreras_anotadas', 'Anotadas (CA)', '🏠', 'desc'],
  ['bases_robadas', 'Bases robadas (BR)', '💨', 'desc'],
  ['bases_por_bolas', 'Bases por bolas (BB)', '🚶', 'desc'],
  ['slugging', 'Slugging (SLG)', '💥', 'desc'],
];

const TARJETAS_PITCHEO = [
  ['efectividad', 'Efectividad (EFE)', '🎯', 'asc'],
  ['ganados', 'Ganados (G)', '🏆', 'desc'],
  ['salvados', 'Salvados (S)', '🛡️', 'desc'],
  ['ponches', 'Ponches (SO)', '🔥', 'desc'],
  ['innings_lanzados', 'Innings lanzados (IL)', '⏱️', 'desc'],
];

function formatValor(stat, valor) {
  if (valor == null) return '—';
  if (stat === 'promedio_bateo' || stat === 'slugging') {
    const n = Number(valor);
    return n >= 1000 ? (n / 1000).toFixed(3) : '.' + String(Math.round(n)).padStart(3, '0');
  }
  if (stat === 'efectividad') {
    return Number(valor).toFixed(2);
  }
  if (stat === 'innings_lanzados') {
    return formatInningsFraccion(valor);
  }
  return valor;
}

// Convierte un decimal (ej. 1.33) a fracción de innings (ej. "1 1/3"),
// redondeando al más cercano entre 1/3, 1/2 y 2/3.
function formatInningsFraccion(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return '—';
  const entero = Math.floor(n);
  const frac = n - entero;
  const FRACCIONES = [
    { valor: 0, texto: '' },
    { valor: 1 / 3, texto: '1/3' },
    { valor: 1 / 2, texto: '1/2' },
    { valor: 2 / 3, texto: '2/3' },
  ];
  let mejor = FRACCIONES[0];
  let menorDif = Math.abs(frac - mejor.valor);
  for (const f of FRACCIONES) {
    const dif = Math.abs(frac - f.valor);
    if (dif < menorDif) { mejor = f; menorDif = dif; }
  }
  if (!mejor.texto) return `${entero}`;
  return entero > 0 ? `${entero} ${mejor.texto}` : mejor.texto;
}

function TarjetaLider({ titulo, icono, filas, statKey, direccion, abrirJugador, depto }) {
  const ordenadas = [...filas].sort((a, b) => {
    const va = Number(a[statKey]) || 0, vb = Number(b[statKey]) || 0;
    return direccion === 'desc' ? vb - va : va - vb;
  }).slice(0, 10);

  return (
    <div className="tarjeta-lista" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 20 }}>{icono}</span>
        <h3 style={{ margin: 0, fontSize: 16 }}>{titulo}</h3>
      </div>
      <div style={{ borderTop: '1px solid var(--color-line)' }} />
      {ordenadas.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)', fontSize: 13, padding: 'var(--space-3) 0' }}>
          No hay datos en esta categoría
        </p>
      )}
      {ordenadas.map((f, i) => {
        const extra = depto === 'bateo'
          ? `VB: ${f.vb ?? '—'} · HC: ${f.hits ?? '—'}`
          : `IL: ${f.innings_lanzados != null ? formatInningsFraccion(f.innings_lanzados) : '—'} · JG: ${f.ganados ?? '—'}`;
        return (
          <div key={f.roster_id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: i < ordenadas.length - 1 ? '1px solid var(--color-line)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--color-ink-soft)', fontSize: 13, width: 16 }}>{i + 1}</span>
              <div>
                <button
                  onClick={() => abrirJugador(f.roster_id)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--blue-txt)', fontWeight: 700, fontSize: 14, textAlign: 'left', display: 'block' }}
                >
                  {f.numero_camiseta != null ? `#${f.numero_camiseta} ` : ''}{f.nombres} {f.apellidos}
                </button>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)' }}>
                  {f.equipo} · {extra}
                </span>
              </div>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: 15 }}>{formatValor(statKey, f[statKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

// Sección completa (grid de tarjetas) para UN grupo, con su propio umbral
// de calificación calculado solo entre los jugadores de ese grupo.
function SeccionGrupo({ nombreGrupo, mostrarTitulo, filas, campoUmbral, tarjetas, abrirJugador, depto }) {
  const { filasCalifican, umbral } = useMemo(() => {
    const valores = filas.map((f) => Number(f[campoUmbral]) || 0).filter((v) => v > 0);
    if (!valores.length) return { filasCalifican: filas, umbral: 0 };
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const u = Math.round((media * (2 / 3)) * 10) / 10;
    return { filasCalifican: filas.filter((f) => (Number(f[campoUmbral]) || 0) >= u), umbral: u };
  }, [filas, campoUmbral]);

  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        {mostrarTitulo && (
          <h2 style={{ fontSize: 18, color: 'var(--blue-txt)', margin: 0 }}>Grupo {nombreGrupo}</h2>
        )}
        {umbral > 0 && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-ink-soft)' }}>
            Mínimo: <b>{umbral}</b> {campoUmbral === 'al' ? 'AL' : 'IL'}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {tarjetas.map(([statKey, titulo, icono, direccion]) => (
          <TarjetaLider
            key={statKey}
            titulo={titulo}
            icono={icono}
            filas={filasCalifican}
            statKey={statKey}
            direccion={direccion}
            abrirJugador={abrirJugador}
            depto={depto}
          />
        ))}
      </div>
    </div>
  );
}

export default function LideresPage() {
  const { abrirJugador } = usePlayerModal();
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [depto, setDepto] = useState('bateo');
  const [filas, setFilas] = useState([]);
  const [gruposMap, setGruposMap] = useState({}); // equipo_inscrito_id -> grupo
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) { setTemporadaCategoriaId(id); setCategoria(cat); }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    const stat = depto === 'bateo' ? 'promedio_bateo' : 'efectividad';
    Promise.all([
      api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`),
      api.get(`/lideres/${depto}?temporada_categoria_id=${temporadaCategoriaId}&stat=${stat}&limit=100`),
    ]).then(([inscritos, data]) => {
      const mapa = {};
      inscritos.forEach((e) => { mapa[e.id] = e.grupo || 'General'; });
      setGruposMap(mapa);
      setFilas(data);
    }).finally(() => setCargando(false));
  }, [temporadaCategoriaId, depto]);

  const campoUmbral = depto === 'bateo' ? 'al' : 'innings_lanzados';
  const tarjetas = depto === 'bateo' ? TARJETAS_BATEO : TARJETAS_PITCHEO;

  // Agrupar las filas por grupo (grupo || 'General')
  const porGrupo = {};
  for (const f of filas) {
    const g = gruposMap[f.equipo_inscrito_id] || 'General';
    if (!porGrupo[g]) porGrupo[g] = [];
    porGrupo[g].push(f);
  }
  const nombresGrupos = Object.keys(porGrupo).sort();

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />
      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['bateo', ...(categoria?.lleva_pitcheo ? ['pitcheo'] : [])].map((d) => (
              <button key={d} onClick={() => setDepto(d)}
                style={{ padding: '6px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: '1px solid var(--color-line)', background: depto === d ? 'var(--amber)' : 'transparent', color: depto === d ? '#1a0e35' : 'var(--color-ink-soft)', cursor: 'pointer' }}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Líderes de {depto === 'bateo' ? 'Bateo' : 'Pitcheo'}</h1>
        </div>

        {cargando && <div className="vacio">Cargando…</div>}
        {!cargando && filas.length === 0 && <div className="vacio">Sin estadísticas todavía.</div>}

        {!cargando && filas.length > 0 && nombresGrupos.map((nombreGrupo) => (
          <SeccionGrupo
            key={nombreGrupo}
            nombreGrupo={nombreGrupo}
            mostrarTitulo={nombresGrupos.length > 1}
            filas={porGrupo[nombreGrupo]}
            campoUmbral={campoUmbral}
            tarjetas={tarjetas}
            abrirJugador={abrirJugador}
            depto={depto}
          />
        ))}
      </main>
    </div>
  );
}