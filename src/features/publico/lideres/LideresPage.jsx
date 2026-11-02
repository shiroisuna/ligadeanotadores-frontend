import { useEffect, useState } from "react";
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
  ['promedio_ganados', 'Average G/P', '⚖️', 'desc'],
  ['ganados', 'Ganados (G)', '🏆', 'desc'],
  ['salvados', 'Salvados (S)', '🛡️', 'desc'],
  ['ponches', 'Ponches (SO)', '🔥', 'desc'],
  ['innings_lanzados', 'Innings lanzados (IL)', '⏱️', 'desc'],
];

function formatValor(stat, valor) {
  if (valor == null) return '—';
  if (stat === 'promedio_bateo' || stat === 'slugging' || stat === 'promedio_ganados') {
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

function TarjetaLider({ titulo, icono, filas, statKey, abrirJugador, depto, nota }) {
  // El servidor ya aplica el mínimo reglamentario y los criterios de desempate (Reglamento 21.03)
  const ordenadas = filas.slice(0, 10);

  return (
    <div className="tarjeta-lista" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 20 }}>{icono}</span>
        <h3 style={{ margin: 0, fontSize: 16 }}>{titulo}</h3>
      </div>
      {nota && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-ink-soft)', marginBottom: 6 }}>{nota}</div>}
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

// Sección completa (grid de tarjetas) para UN grupo. Cada tarjeta recibe las filas de SU estadística,
// ya ordenadas y filtradas por el servidor según el reglamento.
function SeccionGrupo({ nombreGrupo, mostrarTitulo, filasPorStat, gruposMap, tarjetas, abrirJugador, depto, notas }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      {mostrarTitulo && (
        <h2 style={{ fontSize: 18, color: 'var(--blue-txt)', margin: '0 0 var(--space-3)' }}>Grupo {nombreGrupo}</h2>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {tarjetas.map(([statKey, titulo, icono]) => (
          <TarjetaLider
            key={statKey}
            titulo={titulo}
            icono={icono}
            filas={(filasPorStat[statKey] || []).filter((f) => (gruposMap[f.equipo_inscrito_id] || 'General') === nombreGrupo)}
            statKey={statKey}
            abrirJugador={abrirJugador}
            depto={depto}
            nota={notas[statKey]}
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
  const [filasPorStat, setFilasPorStat] = useState({});
  const [reglas, setReglas] = useState(null);
  const [gruposMap, setGruposMap] = useState({}); // equipo_inscrito_id -> grupo
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(id, cat) { setTemporadaCategoriaId(id); setCategoria(cat); }

  const tarjetas = depto === 'bateo' ? TARJETAS_BATEO : TARJETAS_PITCHEO;

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    Promise.all([
      api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`),
      api.get(`/lideres/reglas?temporada_categoria_id=${temporadaCategoriaId}`).catch(() => null),
      Promise.all(tarjetas.map(([stat]) =>
        api.get(`/lideres/${depto}?temporada_categoria_id=${temporadaCategoriaId}&stat=${stat}&limit=100`)
          .then((data) => [stat, data]))),
    ]).then(([inscritos, r, resultados]) => {
      const mapa = {};
      inscritos.forEach((e) => { mapa[e.id] = e.grupo || 'General'; });
      setGruposMap(mapa);
      setReglas(r);
      setFilasPorStat(Object.fromEntries(resultados));
    }).finally(() => setCargando(false));
  }, [temporadaCategoriaId, depto]);

  // Notas de elegibilidad (solo para las estadísticas de promedio)
  const notas = {};
  if (reglas) {
    if (depto === 'bateo') {
      const t = `Mínimo: ${reglas.bateo_al_por_juego} AL × juegos del equipo`;
      notas.promedio_bateo = t; notas.slugging = t;
    } else {
      const t = `Mínimo: ${reglas.pitcheo_il_por_juego} IL × juegos del equipo`;
      notas.efectividad = t; notas.promedio_ganados = t;
    }
  }

  // Grupos presentes (grupo || 'General')
  const todasFilas = Object.values(filasPorStat).flat();
  const nombresGrupos = [...new Set([
    ...Object.values(gruposMap),
    ...todasFilas.map((f) => gruposMap[f.equipo_inscrito_id] || 'General'),
  ])].sort();
  const hayDatos = todasFilas.length > 0;

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
        {!cargando && !hayDatos && <div className="vacio">Ningún jugador cumple todavía el mínimo reglamentario.</div>}

        {!cargando && hayDatos && nombresGrupos.map((nombreGrupo) => (
          <SeccionGrupo
            key={nombreGrupo}
            nombreGrupo={nombreGrupo}
            mostrarTitulo={nombresGrupos.length > 1}
            filasPorStat={filasPorStat}
            gruposMap={gruposMap}
            tarjetas={tarjetas}
            abrirJugador={abrirJugador}
            depto={depto}
            notas={notas}
          />
        ))}
      </main>
    </div>
  );
}