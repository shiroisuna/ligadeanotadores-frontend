import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';
import { exportarBoxScorePDF } from '../../../utils/exportarPDF';

const N = (v) => Number(v) || 0;

const COLS_BATEO = [
  ['vb', 'VB'], ['ca', 'CA'], ['hc', 'HC'], ['bb', 'BB'], ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'],
  ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'], ['ci', 'CI'], ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'],
  ['ij', 'IJ'], ['o', 'O'], ['a', 'A'], ['e', 'E'],
];

const COLS_PITCHEO = [
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['g', 'G'], ['p', 'P'], ['s', 'S'], ['e', 'E'], ['tl', 'T.L'],
  ['vb_enfrentados', 'VB'], ['hp', 'HP'], ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'], ['il', 'IL'],
  ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'], ['bi', 'BI'], ['sf', 'SF'], ['gp', 'GP'],
  ['wp', 'WP'], ['bk', 'BK'],
];

function ilFraccion(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return '0';
  const ent = Math.floor(n);
  const frac = n - ent;
  const F = [{ v: 0, t: '' }, { v: 1 / 3, t: '1/3' }, { v: 1 / 2, t: '1/2' }, { v: 2 / 3, t: '2/3' }];
  let mejor = F[0], dif = frac;
  for (const f of F) { const d = Math.abs(frac - f.v); if (d < dif) { mejor = f; dif = d; } }
  if (!mejor.t) return String(ent);
  return ent > 0 ? `${ent} ${mejor.t}` : mejor.t;
}

// "Juan Pérez" -> "J. PÉREZ"
function nombreCorto(f) {
  if (!f) return '—';
  const ini = (f.nombres || '').trim().charAt(0);
  return `${ini ? ini + '. ' : ''}${(f.apellidos || '').trim()}`.toUpperCase();
}

// Los 2 jugadores más destacados de un equipo (H, HR, CI)
function destacados(filas) {
  return filas
    .filter((f) => N(f.vb) > 0 && N(f.hc) > 0)
    .map((f) => ({ f, puntos: N(f.hc) + 2 * N(f.hr) + N(f.ci) }))
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 2)
    .map(({ f }) => ({
      nombre: `${f.nombres} ${f.apellidos}`.toUpperCase(),
      detalle: [`${N(f.hc)} DE ${N(f.vb)}`, N(f.hr) ? `${N(f.hr)} HR` : null, N(f.ci) ? `${N(f.ci)} CI` : null]
        .filter(Boolean).join(' · '),
    }));
}

const panel = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 8, padding: '8px 12px', textAlign: 'center',
};

function CajaDecision({ titulo, valor }) {
  return (
    <div style={panel}>
      <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.75 }}>{titulo}</div>
      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{valor}</div>
    </div>
  );
}

function TablaBateo({ filas, abrirJugador }) {
  const tot = (k) => filas.reduce((a, f) => a + N(f[k]), 0);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="tabla">
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: 'left' }}>Jugador</th>
            <th>POS</th>
            {COLS_BATEO.map(([k, l]) => <th key={k}>{l}</th>)}
            <th>TL</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id ?? f.roster_id}>
              <td>{f.numero_camiseta ?? ''}</td>
              <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <button onClick={() => abrirJugador(f.roster_id)}
                  style={{ background: 'none', border: 'none', color: 'var(--blue-txt)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  {f.nombres} {f.apellidos}
                </button>
              </td>
              <td>{f.posicion || ''}</td>
              {COLS_BATEO.map(([k]) => <td key={k}>{N(f[k])}</td>)}
              <td>{N(f.o) + N(f.a) + N(f.e)}</td>
            </tr>
          ))}
          {filas.length > 0 && (
            <tr style={{ fontWeight: 700 }}>
              <td colSpan={2}>TOTALES</td>
              <td></td>
              {COLS_BATEO.map(([k]) => <td key={k}>{tot(k)}</td>)}
              <td>{tot('o') + tot('a') + tot('e')}</td>
            </tr>
          )}
          {filas.length === 0 && (
            <tr><td colSpan={COLS_BATEO.length + 4} style={{ textAlign: 'center', fontFamily: 'var(--font-body)' }}>Sin bateo cargado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TablaPitcheo({ filas, abrirJugador }) {
  if (!filas.length) return null;
  return (
    <>
      <h4 style={{ margin: 'var(--space-4) 0 var(--space-2)' }}>Labor de lanzadores</h4>
      <div style={{ overflowX: 'auto' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Lanzador</th>
              {COLS_PITCHEO.map(([k, l]) => <th key={k}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id ?? f.roster_id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  <button onClick={() => abrirJugador(f.roster_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--blue-txt)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    {f.nombres} {f.apellidos}
                  </button>
                </td>
                {COLS_PITCHEO.map(([k]) => <td key={k}>{k === 'il' ? ilFraccion(f.il) : N(f[k])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function BoxScorePage() {
  const [params] = useSearchParams();
  const juegoId = params.get('id');
  const { abrirJugador } = usePlayerModal();

  const [juego, setJuego] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [stats, setStats] = useState({ bateo: [], pitcheo: [] });
  const [arbitros, setArbitros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (!juegoId) return;
    setCargando(true);
    Promise.all([
      api.get(`/juegos/${juegoId}`),
      api.get(`/juegos/${juegoId}/entradas`),
      api.get(`/boxscore/${juegoId}`),
      api.get(`/arbitros/juego/${juegoId}`).catch(() => []),
    ]).then(([j, e, s, a]) => {
      setJuego(j); setEntradas(e); setStats(s); setArbitros(a);
    }).finally(() => setCargando(false));
  }, [juegoId]);

  const idLocal = Number(juego?.local_equipo_inscrito_id ?? juego?.equipo_local_id);
  const idVisit = Number(juego?.visitante_equipo_inscrito_id ?? juego?.equipo_visitante_id);

  const { bateoV, bateoL, pitV, pitL } = useMemo(() => ({
    bateoV: stats.bateo.filter((f) => Number(f.equipo_inscrito_id) === idVisit),
    bateoL: stats.bateo.filter((f) => Number(f.equipo_inscrito_id) === idLocal),
    pitV: stats.pitcheo.filter((f) => Number(f.equipo_inscrito_id) === idVisit),
    pitL: stats.pitcheo.filter((f) => Number(f.equipo_inscrito_id) === idLocal),
  }), [stats, idLocal, idVisit]);

  async function descargarPDF() {
    setDescargando(true);
    try {
      const incidencias = await api.get(`/incidencias/${juegoId}`).catch(() => []);
      await exportarBoxScorePDF({
        juego, entradas, bateo: stats.bateo, pitcheo: stats.pitcheo, arbitros, incidencias,
      });
    } finally {
      setDescargando(false);
    }
  }

  if (!juegoId) return <div className="vacio">Falta el id del juego.</div>;
  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego) return <div className="vacio">Juego no encontrado.</div>;
  if (stats.pendiente) {
    return (
      <main className="contenedor" style={{ paddingTop: 'var(--space-5)' }}>
        <div className="vacio" style={{ fontSize: 16 }}>
          ⏳ El box score de {juego.equipo_visitante} vs {juego.equipo_local} está pendiente de aprobación
          y se publicará cuando el administrador lo revise.
        </div>
      </main>
    );
  }

  const nEnt = Math.max(7, ...entradas.map((e) => N(e.numero_entrada)));
  const porEntrada = (idEq, n) => {
    const f = entradas.find((e) => Number(e.equipo_inscrito_id) === idEq && Number(e.numero_entrada) === n);
    return f ? N(f.carreras) : '';
  };
  const hits = (arr, campo) => (juego[campo] != null ? juego[campo] : arr.reduce((a, f) => a + N(f.hc), 0));

  const todosPitcheo = stats.pitcheo;
  const ganador = todosPitcheo.find((f) => N(f.g) > 0);
  const perdedor = todosPitcheo.find((f) => N(f.p) > 0);
  const salvador = todosPitcheo.find((f) => N(f.s) > 0);

  const lineas = [
    { id: idVisit, nombre: juego.equipo_visitante, logo: juego.logo_visitante, etiqueta: 'V',
      c: juego.carreras_visitante, h: hits(bateoV, 'hits_visitante'), e: juego.errores_visitante },
    { id: idLocal, nombre: juego.equipo_local, logo: juego.logo_local, etiqueta: 'HC',
      c: juego.carreras_local, h: hits(bateoL, 'hits_local'), e: juego.errores_local },
  ];

  const fecha = String(juego.fecha || '').slice(0, 10);
  const titulo = `${juego.equipo_visitante} ${N(juego.carreras_visitante)} - ${N(juego.carreras_local)} ${juego.equipo_local}`;

  return (
    <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
      {/* ── Marcador estilo transmisión ── */}
      <section style={{
        background: 'linear-gradient(180deg, #0b3d91 0%, #082a66 100%)', color: '#fff',
        borderRadius: 14, padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{titulo.toUpperCase()}</div>
          <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.8, marginTop: 4 }}>
            BOX SCORE · LABSMI · {fecha}{juego.estadio ? ` · ${juego.estadio.toUpperCase()}` : ''}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr style={{ fontSize: 12, opacity: 0.85 }}>
                <th style={{ textAlign: 'left', padding: '0 10px' }}>EQUIPO</th>
                {Array.from({ length: nEnt }, (_, i) => <th key={i} style={{ width: 30 }}>{i + 1}</th>)}
                <th style={{ width: 44 }}>C</th><th style={{ width: 44 }}>H</th><th style={{ width: 44 }}>E</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.etiqueta} style={{ background: 'rgba(0,0,0,0.28)' }}>
                  <td style={{ padding: '8px 10px', borderRadius: '8px 0 0 8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                      <TeamBadge nombre={l.nombre} logoUrl={l.logo} tamano={30} />
                      {l.nombre.toUpperCase()}
                      <small style={{ opacity: 0.6, fontWeight: 400 }}>({l.etiqueta})</small>
                    </span>
                  </td>
                  {Array.from({ length: nEnt }, (_, i) => (
                    <td key={i} style={{ textAlign: 'center', fontWeight: 700 }}>{porEntrada(l.id, i + 1)}</td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 20, color: '#ffd23f' }}>{N(l.c)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 18 }}>{l.h}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 18, borderRadius: '0 8px 8px 0' }}>{N(l.e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ganó / Perdió / Salvó */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, margin: 'var(--space-3) 0' }}>
          <CajaDecision titulo="GANÓ" valor={nombreCorto(ganador)} />
          <CajaDecision titulo="PERDIÓ" valor={nombreCorto(perdedor)} />
          <CajaDecision titulo="SALVÓ" valor={nombreCorto(salvador)} />
        </div>

        {/* Destacados de bateo: visitante a la izquierda, local a la derecha */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {[{ eq: juego.equipo_visitante, filas: bateoV }, { eq: juego.equipo_local, filas: bateoL }].map(({ eq, filas }) => {
            const d = destacados(filas);
            return (
              <div key={eq} style={{ ...panel, minHeight: 64 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>DESTACADOS · {eq.toUpperCase()}</div>
                {d.length === 0 && <div style={{ opacity: 0.6, fontSize: 12 }}>—</div>}
                {d.map((x) => (
                  <div key={x.nombre} style={{ marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{x.nombre}</div>
                    <div style={{ fontSize: 12 }}>{x.detalle}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 10, opacity: 0.7, textAlign: 'center', marginTop: 'var(--space-3)' }}>
          C: CARRERAS · H: HITS · E: ERRORES · CI: IMPULSADAS · FUENTE: LABSMI
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <button className="boton boton--dorado boton--chico" onClick={descargarPDF} disabled={descargando}>
          {descargando ? 'Generando PDF…' : '📄 Descargar Box Score + Incidencias (PDF)'}
        </button>
      </div>

      {/* ── Visitante primero ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tarjeta-lista__cabecera">
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamBadge nombre={juego.equipo_visitante} logoUrl={juego.logo_visitante} tamano={26} />
            <h3>{juego.equipo_visitante}</h3>
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Visitante</span>
        </div>
        <TablaBateo filas={bateoV} abrirJugador={abrirJugador} />
        <TablaPitcheo filas={pitV} abrirJugador={abrirJugador} />
      </div>

      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tarjeta-lista__cabecera">
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamBadge nombre={juego.equipo_local} logoUrl={juego.logo_local} tamano={26} />
            <h3>{juego.equipo_local}</h3>
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Home club</span>
        </div>
        <TablaBateo filas={bateoL} abrirJugador={abrirJugador} />
        <TablaPitcheo filas={pitL} abrirJugador={abrirJugador} />
      </div>

      {/* ── Datos técnicos ── */}
      <div className="tarjeta-lista">
        <div className="tarjeta-lista__cabecera"><h3>Datos técnicos</h3></div>
        <div style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.9 }}>
          <p><b>Tiempo de juego:</b> {juego.hora_inicio ? `Inicio ${String(juego.hora_inicio).slice(0, 5)}` : '—'}{juego.hora_final ? ` · Final ${String(juego.hora_final).slice(0, 5)}` : ''}{juego.duracion_minutos ? ` · ${juego.duracion_minutos} minutos` : ''}</p>
          <p><b>Árbitros:</b> {arbitros.length ? arbitros.map((a) => `${a.nombres} ${a.apellidos}`).join(' - ') : '—'}{juego.entidad_arbitros ? ` — Entidad: ${juego.entidad_arbitros}` : ''}</p>
          <p><b>Anotador:</b> {juego.anotador_oficial || '—'}{juego.entidad_anotador ? ` — Entidad: ${juego.entidad_anotador}` : ''}</p>
          <p><b>Estadio:</b> {juego.estadio || '—'}{juego.estadio_direccion ? ` — ${juego.estadio_direccion}` : ''}</p>
          <p><b>Jugador más valioso:</b> {juego.mvp_nombre || '—'}</p>
        </div>
      </div>
    </main>
  );
}
