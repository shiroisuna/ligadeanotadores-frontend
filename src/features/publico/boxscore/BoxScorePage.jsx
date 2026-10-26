import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';
import { exportarIncidenciasPDF } from '../../../utils/exportarPDF';
import { formatInnings } from '../../../utils/innings';

const ENTRADAS_DEFECTO = 7;

// Columnas de bateo mostradas en el boxscore (no incluye AL/BA/IN calculados,
// solo las columnas "crudas" que se ven en el reporte impreso)
const COLS_BATEO = [
  ['vb', 'VB'], ['ca', 'CA'], ['hc', 'HC'], ['bb', 'BB'], ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'],
  ['h2', '2H'], ['h3', '3H'], ['hr', 'HR'], ['ci', 'CI'], ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'],
];

const COLS_PITCHEO = [
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['b', 'B'], ['g', 'G'], ['p', 'P'],
  ['vb', 'VBC'], ['hp', 'HP'], ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'],
  ['il', 'ILAN'], ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'],
  ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'], ['wp', 'WP'], ['bk', 'BK'],
];

function sumar(filas, campo) {
  return filas.reduce((acc, f) => acc + (Number(f[campo]) || 0), 0);
}

// Combina el fildeo (posiciones + O/A/E) de un jugador dentro del mismo
// juego, ya que puede tener varias filas (una por posición jugada).
function combinarFildeoPorJugador(fildeo) {
  const porRoster = {};
  for (const f of fildeo) {
    if (!porRoster[f.roster_id]) {
      porRoster[f.roster_id] = { posiciones: [], o: 0, a: 0, e: 0 };
    }
    porRoster[f.roster_id].posiciones.push(f.posicion);
    porRoster[f.roster_id].o += Number(f.o) || 0;
    porRoster[f.roster_id].a += Number(f.a) || 0;
    porRoster[f.roster_id].e += Number(f.e) || 0;
  }
  return porRoster;
}

function TablaBateo({ filas, fildeoPorRoster, abrirJugador }) {
  const totales = { vb: 0, ca: 0, hc: 0, bb: 0, sh: 0, sf: 0, gp: 0, h2: 0, h3: 0, hr: 0, ci: 0, br: 0, or_: 0, so: 0, o: 0, a: 0, e: 0 };
  for (const [campo] of COLS_BATEO) totales[campo] = sumar(filas, campo);
  for (const roster_id of Object.keys(fildeoPorRoster)) {
    if (!filas.find((f) => String(f.roster_id) === roster_id)) continue;
    totales.o += fildeoPorRoster[roster_id].o;
    totales.a += fildeoPorRoster[roster_id].a;
    totales.e += fildeoPorRoster[roster_id].e;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="tabla">
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: 'left' }}>Jugador</th>
            <th>POS</th>
            {COLS_BATEO.map(([k, l]) => <th key={k}>{l}</th>)}
            <th>O</th><th>A</th><th>E</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const fildeo = fildeoPorRoster[f.roster_id] || { posiciones: [], o: 0, a: 0, e: 0 };
            return (
              <tr key={f.roster_id}>
                <td>{f.numero_camiseta ?? ''}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  <button
                    onClick={() => abrirJugador(f.roster_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--blue-txt)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    {f.nombres} {f.apellidos}
                  </button>
                </td>
                <td>{fildeo.posiciones.join(', ')}</td>
                {COLS_BATEO.map(([k]) => <td key={k}>{f[k] ?? 0}</td>)}
                <td>{fildeo.o}</td><td>{fildeo.a}</td><td>{fildeo.e}</td>
              </tr>
            );
          })}
          <tr style={{ fontWeight: 700 }}>
            <td colSpan={2}>TOTALES</td>
            <td></td>
            {COLS_BATEO.map(([k]) => <td key={k}>{totales[k]}</td>)}
            <td>{totales.o}</td><td>{totales.a}</td><td>{totales.e}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TablaPitcheo({ filas, abrirJugador }) {
  if (!filas.length) return null;
  return (
    <>
      <h4 style={{ margin: 'var(--space-4) 0 var(--space-2)' }}>Pitcheo</h4>
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
              <tr key={f.roster_id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  <button
                    onClick={() => abrirJugador(f.roster_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--blue-txt)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    {f.nombres} {f.apellidos}
                  </button>
                </td>
                {COLS_PITCHEO.map(([k]) => <td key={k}>{k === 'il' ? formatInnings(f[k], '0') : (f[k] ?? 0)}</td>)}
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
  const [stats, setStats] = useState({ bateo: [], pitcheo: [], fildeo: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!juegoId) return;
    setCargando(true);
    Promise.all([
      api.get(`/juegos/${juegoId}`),
      api.get(`/juegos/${juegoId}/entradas`),
      api.get(`/estadisticas/${juegoId}`),
    ]).then(([j, e, s]) => {
      setJuego(j);
      setEntradas(e);
      setStats(s);
    }).finally(() => setCargando(false));
  }, [juegoId]);

  const fildeoPorRoster = useMemo(() => combinarFildeoPorJugador(stats.fildeo), [stats.fildeo]);

  const bateoLocal = stats.bateo.filter((f) => f.equipo === juego?.equipo_local);
  const bateoVisitante = stats.bateo.filter((f) => f.equipo === juego?.equipo_visitante);
  const pitcheoLocal = stats.pitcheo.filter((f) => f.equipo === juego?.equipo_local);
  const pitcheoVisitante = stats.pitcheo.filter((f) => f.equipo === juego?.equipo_visitante);

  const [arbitroP, arbitroA] = (juego?.arbitros || '').split('/').map((s) => s.trim());

  async function descargarIncidencias() {
    const incidencias = await api.get(`/incidencias/${juegoId}`);
    exportarIncidenciasPDF({ juego, incidencias });
  }

  function carrerasEntrada(equipo_inscrito_id, numero) {
    const fila = entradas.find((e) => e.equipo_inscrito_id === equipo_inscrito_id && e.numero_entrada === numero);
    return fila ? fila.carreras : null;
  }

  const numEntradas = Math.max(Number(juego?.num_innings) || ENTRADAS_DEFECTO, ...entradas.map((e) => e.numero_entrada), 0);
  const ENTRADAS_MOSTRADAS = Array.from({ length: numEntradas }, (_, i) => i + 1);

  if (!juegoId) return <div className="vacio">Falta el id del juego.</div>;
  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego) return <div className="vacio">Juego no encontrado.</div>;

  return (
    <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
      {/* ── Cabecera del juego ── */}
      <div style={{
        background: 'var(--morado, #4a1e8f)', color: '#fff', borderRadius: 12,
        padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <TeamBadge nombre={juego.equipo_local} logoUrl={juego.logo_local} tamano={56} />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.9 }}>
            <div>Fecha: <b>{juego.fecha}</b> &nbsp;&nbsp; Árbitro P: <b>{arbitroP || '—'}</b> &nbsp;&nbsp; Árbitro A: <b>{arbitroA || '—'}</b></div>
            <div>Hora: <b>{juego.hora ? juego.hora.slice(0, 8) : '—'}</b> &nbsp;&nbsp; Campo: <b>{juego.estadio || '—'}</b> &nbsp;&nbsp; Anotador: <b>{juego.anotador_oficial || '—'}</b></div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>JUEGO ID</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>#{juego.id}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <button className="boton boton--fantasma boton--chico" onClick={descargarIncidencias}>
          📄 Descargar Incidencias (PDF)
        </button>
      </div>

      {/* ── Línea de anotación (linescore) ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-4)', overflowX: 'auto', padding: 'var(--space-3)' }}>
        <table className="tabla linea-anotacion">
          <thead>
            <tr>
              <th className="linea-anotacion__equipo">Equipos</th>
              {ENTRADAS_MOSTRADAS.map((n) => <th key={n}>{n}</th>)}
              <th className="linea-anotacion__total">C</th>
              <th className="linea-anotacion__total">H</th>
              <th className="linea-anotacion__total">E</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="linea-anotacion__equipo">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamBadge nombre={juego.equipo_visitante} logoUrl={juego.logo_visitante} tamano={22} />
                  {juego.equipo_visitante}
                </span>
              </td>
              {ENTRADAS_MOSTRADAS.map((n) => (
                <td key={n}>{carrerasEntrada(juego.visitante_equipo_inscrito_id, n) ?? ''}</td>
              ))}
              <td className="linea-anotacion__total">{juego.carreras_visitante ?? 0}</td>
              <td className="linea-anotacion__total">{juego.hits_visitante ?? 0}</td>
              <td className="linea-anotacion__total">{juego.errores_visitante ?? 0}</td>
            </tr>
            <tr>
              <td className="linea-anotacion__equipo">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamBadge nombre={juego.equipo_local} logoUrl={juego.logo_local} tamano={22} />
                  {juego.equipo_local}
                </span>
              </td>
              {ENTRADAS_MOSTRADAS.map((n) => (
                <td key={n}>{carrerasEntrada(juego.local_equipo_inscrito_id, n) ?? ''}</td>
              ))}
              <td className="linea-anotacion__total">{juego.carreras_local ?? 0}</td>
              <td className="linea-anotacion__total">{juego.hits_local ?? 0}</td>
              <td className="linea-anotacion__total">{juego.errores_local ?? 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Visitante ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tarjeta-lista__cabecera">
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamBadge nombre={juego.equipo_visitante} logoUrl={juego.logo_visitante} tamano={26} />
            <h3>{juego.equipo_visitante}</h3>
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Visitante</span>
        </div>
        <TablaBateo filas={bateoVisitante} fildeoPorRoster={fildeoPorRoster} abrirJugador={abrirJugador} />
        <TablaPitcheo filas={pitcheoVisitante} abrirJugador={abrirJugador} />
      </div>

      {/* ── Local ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tarjeta-lista__cabecera">
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamBadge nombre={juego.equipo_local} logoUrl={juego.logo_local} tamano={26} />
            <h3>{juego.equipo_local}</h3>
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Local</span>
        </div>
        <TablaBateo filas={bateoLocal} fildeoPorRoster={fildeoPorRoster} abrirJugador={abrirJugador} />
        <TablaPitcheo filas={pitcheoLocal} abrirJugador={abrirJugador} />
      </div>
    </main>
  );
}