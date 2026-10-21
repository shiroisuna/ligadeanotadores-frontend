import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { InputNumerico } from '../../../components/InputNumerico';
import { navegarConFlechas } from '../../../components/Navegacionceldas';

const COLS_BATEO = [
  ['posicion', 'Pos', 'text'], ['vb', 'VB'], ['ca', 'CA'], ['hc', 'H'], ['bb', 'BB'],
  ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'], ['in_', 'IN'], ['al', 'AL'],
  ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'], ['ba', 'BA'], ['ci', 'CI'],
  ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'], ['ij', 'IJ'], ['o', 'O'],
  ['a', 'A'], ['e', 'E'], ['tl', 'TL'], ['dp', 'DP'], ['di', 'DI'],
];

// Orden real del box score físico: I, R, C, G, P, S, E, T.L, VB, HP, H2, H3, HR, IL, CP, CL, SO, BB, BI, SF, GP, WP, BK
const COLS_PITCHEO = [
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['g', 'G'], ['p', 'P'], ['s', 'S'], ['e', 'E'],
  ['tl', 'T.L'], ['vb_enfrentados', 'VB'], ['hp', 'HP'], ['h2', 'H2'], ['h3', 'H3'],
  ['hr', 'HR'], ['il', 'IL', '0.01'], ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'],
  ['bb', 'BB'], ['bi', 'BI'], ['sf', 'SF'], ['gp', 'GP'], ['wp', 'WP'], ['bk', 'BK'],
];

const NUM_ENTRADAS_DEFECTO = 7;
const POSICIONES = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

function filaVacia(roster, columnas) {
  const fila = { roster_id: roster.id, nombres: roster.nombres, apellidos: roster.apellidos, numero_camiseta: roster.numero_camiseta, equipoEtiqueta: roster.equipoEtiqueta };
  columnas.forEach(([key, , tipo]) => { fila[key] = tipo === 'text' || tipo === 'select' ? '' : 0; });
  return fila;
}

function fusionarConExistente(filaVacia, existente, columnas) {
  if (!existente) return filaVacia;
  const fila = { ...filaVacia };
  columnas.forEach(([key]) => { fila[key] = existente[key] ?? fila[key]; });
  return fila;
}

function formatIL(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return '—';
  const entero = Math.floor(n);
  const frac = n - entero;
  const FRACCIONES = [{ v: 0, t: '' }, { v: 1/3, t: '1/3' }, { v: 1/2, t: '1/2' }, { v: 2/3, t: '2/3' }];
  let mejor = FRACCIONES[0], menorDif = frac;
  for (const f of FRACCIONES) { const d = Math.abs(frac - f.v); if (d < menorDif) { mejor = f; menorDif = d; } }
  if (!mejor.t) return `${entero}`;
  return entero > 0 ? `${entero} ${mejor.t}` : mejor.t;
}

export default function BoxScoreAdminPage() {
  const { juegoId } = useParams();
  const { notificar } = useToast();

  const [juego, setJuego] = useState(null);
  const [rosterLocal, setRosterLocal] = useState([]);
  const [rosterVisitante, setRosterVisitante] = useState([]);
  const [filasBateo, setFilasBateo] = useState([]);
  const [filasPitcheo, setFilasPitcheo] = useState([]);
  const [entradasLocal, setEntradasLocal] = useState(Array(NUM_ENTRADAS_DEFECTO).fill(0));
  const [entradasVisitante, setEntradasVisitante] = useState(Array(NUM_ENTRADAS_DEFECTO).fill(0));
  const [arbitros, setArbitros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoBateo, setGuardandoBateo] = useState(false);
  const [guardandoPitcheo, setGuardandoPitcheo] = useState(false);
  const [guardandoEntradas, setGuardandoEntradas] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const j = await api.get(`/juegos/${juegoId}`);
      setJuego(j);

      const [rl, rv, existente, entradas, arb] = await Promise.all([
        api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_local_id}`),
        api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_visitante_id}`),
        api.get(`/boxscore/${juegoId}`),
        api.get(`/juegos/${juegoId}/entradas`),
        api.get(`/arbitros/juego/${juegoId}`),
      ]);
      setRosterLocal(rl);
      setRosterVisitante(rv);
      setArbitros(arb);

      // Visitante primero, luego local (home club)
      const roster = [
        ...rv.map((r) => ({ ...r, equipoEtiqueta: j.equipo_visitante })),
        ...rl.map((r) => ({ ...r, equipoEtiqueta: j.equipo_local })),
      ];

      // Bateo: igual que Pitcheo, una fila por cada línea ya guardada,
      // con selector de jugador y posición — no una fila fija por roster.
      setFilasBateo(existente.bateo.map((eb) => {
        const jugador = roster.find((r) => r.id === eb.roster_id);
        return { ...eb, nombres: jugador?.nombres || '', apellidos: jugador?.apellidos || '', numero_camiseta: jugador?.numero_camiseta, equipoEtiqueta: jugador?.equipoEtiqueta || '' };
      }));
      setFilasPitcheo(roster.map((r) => fusionarConExistente(
        filaVacia(r, COLS_PITCHEO), existente.pitcheo.find((x) => x.roster_id === r.id), COLS_PITCHEO
      )));

      const maxEntrada = Math.max(NUM_ENTRADAS_DEFECTO, ...entradas.map((e) => e.numero_entrada), 0);
      const arrLocal = Array(maxEntrada).fill(0);
      const arrVisit = Array(maxEntrada).fill(0);
      entradas.forEach((e) => {
        const idx = e.numero_entrada - 1;
        if (Number(e.equipo_inscrito_id) === Number(j.equipo_local_id)) arrLocal[idx] = e.carreras;
        else arrVisit[idx] = e.carreras;
      });
      setEntradasLocal(arrLocal);
      setEntradasVisitante(arrVisit);

      setCargando(false);
    }
    cargar();
  }, [juegoId]);

  function setBateo(idx, campo, valor) {
    setFilasBateo((prev) => prev.map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
  }

  function actualizarCelda(filas, setFilas, roster_id, campo, valor) {
    setFilas(filas.map((f) => (f.roster_id === roster_id ? { ...f, [campo]: valor } : f)));
  }

  function totalizar(filas, campos) {
    const totales = {};
    campos.forEach(([k,, tipo]) => {
      if (tipo === 'text') return;
      totales[k] = filas.reduce((acc, f) => acc + (Number(f[k]) || 0), 0);
    });
    return totales;
  }

  function aNumero(filas, camposExcluir) {
    return filas.map((f) => {
      const limpio = { ...f };
      Object.keys(limpio).forEach((k) => {
        if (camposExcluir.includes(k)) return;
        if (typeof limpio[k] === 'string') limpio[k] = limpio[k] === '' ? 0 : Number(limpio[k]) || 0;
      });
      return limpio;
    });
  }

  async function guardarBateo() {
    setGuardandoBateo(true);
    try {
      await api.put(`/boxscore/${juegoId}/bateo`, { lineas: aNumero(filasBateo.map((f) => ({ ...f, tl: (Number(f.o)||0)+(Number(f.a)||0)+(Number(f.e)||0) })), ['roster_id', 'posicion', 'nombres', 'apellidos', 'numero_camiseta', 'equipoEtiqueta']) });
      notificar('Bateo guardado', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardandoBateo(false);
    }
  }

  async function guardarPitcheo() {
    setGuardandoPitcheo(true);
    try {
      await api.put(`/boxscore/${juegoId}/pitcheo`, { lineas: aNumero(filasPitcheo, ['roster_id', 'nombres', 'apellidos', 'numero_camiseta', 'equipoEtiqueta']) });
      notificar('Pitcheo guardado', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardandoPitcheo(false);
    }
  }

  async function guardarEntradas() {
    setGuardandoEntradas(true);
    try {
      const entradas = [
        ...entradasLocal.map((carreras, i) => ({ equipo_inscrito_id: juego.equipo_local_id, numero_entrada: i + 1, carreras: Number(carreras) || 0 })),
        ...entradasVisitante.map((carreras, i) => ({ equipo_inscrito_id: juego.equipo_visitante_id, numero_entrada: i + 1, carreras: Number(carreras) || 0 })),
      ];
      await api.put(`/juegos/${juegoId}/entradas`, { entradas });
      notificar('Entradas guardadas', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardandoEntradas(false);
    }
  }

  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego) return <div className="vacio">Juego no encontrado.</div>;

  const totalesBateo = totalizar(filasBateo.map((f) => ({ ...f, tl: (Number(f.o)||0)+(Number(f.a)||0)+(Number(f.e)||0) })), COLS_BATEO);
  const carrerasLocalCalc = entradasLocal.reduce((a, b) => a + (Number(b) || 0), 0);
  const carrerasVisitanteCalc = entradasVisitante.reduce((a, b) => a + (Number(b) || 0), 0);

  const todoElRoster = [...rosterVisitante, ...rosterLocal];
  const mvp = juego.mvp_roster_id ? todoElRoster.find((r) => r.id === juego.mvp_roster_id) : null;
  const mvpEquipo = mvp && rosterLocal.some((r) => r.id === mvp.id) ? juego.equipo_local : juego.equipo_visitante;

  let lineaGanador = null;
  if (juego.equipo_ganador_id) {
    const nombreGanador = Number(juego.equipo_ganador_id) === Number(juego.equipo_local_id) ? juego.equipo_local : juego.equipo_visitante;
    lineaGanador = `EL JUEGO LO GANÓ ${nombreGanador.toUpperCase()}`;
  } else if (juego.estado === 'jugado' && juego.carreras_local != null && juego.carreras_visitante != null) {
    const cl = Number(juego.carreras_local), cv = Number(juego.carreras_visitante);
    if (cl !== cv) {
      const nombreGanador = cl > cv ? juego.equipo_local : juego.equipo_visitante;
      lineaGanador = `EL JUEGO LO GANÓ ${nombreGanador.toUpperCase()} ${Math.max(cl, cv)} a ${Math.min(cl, cv)}`;
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Box score</h1>
          <p>{juego.equipo_local} vs {juego.equipo_visitante} — {juego.fecha}{juego.fecha_fin && juego.fecha_fin !== juego.fecha ? ` a ${juego.fecha_fin}` : ''}</p>
        </div>
        <Link to="/admin/juegos" className="boton boton--fantasma">← Volver al calendario</Link>
      </div>

      {lineaGanador && (
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontStyle: 'italic', color: 'var(--blue-txt)', fontSize: 18, margin: '0 0 var(--space-4)' }}>
          {lineaGanador}
        </p>
      )}

      {/* ── ENTRADAS ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tarjeta-lista__cabecera">
          <h3>Entradas</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="boton boton--fantasma boton--chico"
              onClick={() => { setEntradasLocal((p) => [...p, 0]); setEntradasVisitante((p) => [...p, 0]); }}>
              + Entrada extra
            </button>
            <button className="boton boton--dorado boton--chico" onClick={guardarEntradas} disabled={guardandoEntradas}>
              {guardandoEntradas ? 'Guardando…' : 'Guardar entradas'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', padding: 'var(--space-3)' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {entradasLocal.map((_, i) => <th key={i} style={{ width: 36 }}>{i + 1}</th>)}
                <th style={{ width: 40, color: 'var(--amber)' }}>C</th>
                <th style={{ width: 40 }}>H</th>
                <th style={{ width: 40 }}>E</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{juego.equipo_visitante} (V)</td>
                {entradasVisitante.map((v, i) => (
                  <td key={i}>
                    <InputNumerico value={v} style={{ width: 32 }}
                      onChange={(nv) => setEntradasVisitante((p) => p.map((x, idx) => idx === i ? nv : x))} />
                  </td>
                ))}
                <td style={{ fontWeight: 700 }}>{carrerasVisitanteCalc}</td>
                <td>{juego.hits_visitante ?? '—'}</td>
                <td>{juego.errores_visitante ?? '—'}</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{juego.equipo_local} (HC)</td>
                {entradasLocal.map((v, i) => (
                  <td key={i}>
                    <InputNumerico value={v} style={{ width: 32 }}
                      onChange={(nv) => setEntradasLocal((p) => p.map((x, idx) => idx === i ? nv : x))} />
                  </td>
                ))}
                <td style={{ fontWeight: 700 }}>{carrerasLocalCalc}</td>
                <td>{juego.hits_local ?? '—'}</td>
                <td>{juego.errores_local ?? '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', padding: '0 var(--space-3) var(--space-3)' }}>
          Hits y errores totales se cargan desde "Resultado" en el calendario de juegos.
        </p>
      </div>

      {/* ── BATEO ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="tarjeta-lista__cabecera">
          <h3>Bateo</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="boton boton--fantasma boton--chico"
              onClick={() => setFilasBateo((p) => [...p, {
                roster_id: '', posicion: 'P', nombres: '', apellidos: '', numero_camiseta: '', equipoEtiqueta: '',
                ...Object.fromEntries(COLS_BATEO.filter(([,,t]) => t !== 'text').map(([k]) => [k, 0])),
              }])}>
              + Agregar fila
            </button>
            <button className="boton boton--dorado boton--chico" onClick={guardarBateo} disabled={guardandoBateo}>
              {guardandoBateo ? 'Guardando…' : 'Guardar bateo'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', padding: 'var(--space-3)' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 200 }}>Jugador</th>
                {COLS_BATEO.map(([key, label]) => <th key={key} style={{ width: 46 }}>{label}</th>)}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filasBateo.map((f, idx) => (
                <tr key={idx}>
                  <td>
                    <select value={f.roster_id}
                      onChange={(e) => {
                        const r = todoElRoster.find((x) => String(x.id) === e.target.value);
                        setBateo(idx, 'roster_id', Number(e.target.value));
                        if (r) {
                          setBateo(idx, 'nombres', r.nombres);
                          setBateo(idx, 'apellidos', r.apellidos);
                          setBateo(idx, 'numero_camiseta', r.numero_camiseta);
                          setBateo(idx, 'equipoEtiqueta', rosterLocal.some((x) => x.id === r.id) ? juego.equipo_local : juego.equipo_visitante);
                        }
                      }}
                      style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }}>
                      <option value="">Selecciona…</option>
                      {todoElRoster.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos}
                          {' '}({rosterLocal.some((x) => x.id === r.id) ? juego.equipo_local : juego.equipo_visitante})
                        </option>
                      ))}
                    </select>
                  </td>
                  {COLS_BATEO.map(([key,, tipo]) => (
                    <td key={key}>
                      {key === 'tl' ? (
                        <input type="text" readOnly tabIndex={-1} value={(Number(f.o)||0)+(Number(f.a)||0)+(Number(f.e)||0)}
                          title="TL = O + A + E (automático)"
                          style={{ width: 40, background: '#f0f4ff', cursor: 'not-allowed', fontWeight: 700 }} />
                      ) : tipo === 'text' ? (
                        <select value={f[key] || ''} onChange={(e) => setBateo(idx, key, e.target.value)}>
                          {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <InputNumerico value={f[key]} style={{ width: 40 }}
                          onChange={(v) => setBateo(idx, key, v)} />
                      )}
                    </td>
                  ))}
                  <td>
                    <button className="boton boton--peligro" onClick={() => setFilasBateo((p) => p.filter((_, i) => i !== idx))}>×</button>
                  </td>
                </tr>
              ))}
              {filasBateo.length === 0 && (
                <tr><td colSpan={COLS_BATEO.length + 2} style={{ textAlign: 'center', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)', padding: 'var(--space-4)' }}>
                  Usa "+ Agregar fila" para registrar el bateo.
                </td></tr>
              )}
              {filasBateo.length > 0 && (
                <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>TOTALES</td>
                  {COLS_BATEO.map(([key,, tipo]) => (
                    <td key={key}>{tipo === 'text' ? '' : totalesBateo[key]}</td>
                  ))}
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PITCHEO ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="tarjeta-lista__cabecera">
          <h3>Labor de lanzadores</h3>
          <button className="boton boton--dorado boton--chico" onClick={guardarPitcheo} disabled={guardandoPitcheo}>
            {guardandoPitcheo ? 'Guardando…' : 'Guardar pitcheo'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', padding: '0 var(--space-3)' }}>
          Solo diligencia esta tabla para los jugadores que lanzaron. Si la categoría no lleva pitcheo, "Guardar" mostrará un error — es normal.
        </p>
        <div style={{ overflowX: 'auto', padding: 'var(--space-3)' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>#</th>
                <th style={{ textAlign: 'left', minWidth: 160 }}>Jugador</th>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {COLS_PITCHEO.map(([key, label]) => <th key={key} style={{ width: 44 }}>{label}</th>)}
                <th style={{ width: 60 }}>IL frac.</th>
              </tr>
            </thead>
            <tbody>
              {filasPitcheo.map((f) => (
                <tr key={f.roster_id}>
                  <td style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-soft)' }}>{f.numero_camiseta ?? ''}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{f.nombres} {f.apellidos}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', whiteSpace: 'nowrap' }}>{f.equipoEtiqueta}</td>
                  {COLS_PITCHEO.map(([key,, step]) => (
                    <td key={key}>
                      <InputNumerico value={f[key]} permitirDecimales={!!step} style={{ width: 40 }}
                        onChange={(v) => actualizarCelda(filasPitcheo, setFilasPitcheo, f.roster_id, key, v)} />
                    </td>
                  ))}
                  <td style={{ fontWeight: 700, color: 'var(--blue-txt)' }}>{formatIL(f.il)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DATOS TÉCNICOS (solo lectura — se editan desde "Resultado") ── */}
      <div className="tarjeta-lista">
        <div className="tarjeta-lista__cabecera"><h3>Datos técnicos</h3></div>
        <div style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 2 }}>
          <p><b>Tiempo de juego:</b> {juego.hora_inicio ? `Inicio ${juego.hora_inicio.slice(0,5)}` : '—'}{juego.hora_final ? ` · Final ${juego.hora_final.slice(0,5)}` : ''}{juego.duracion_minutos ? ` · Duración: ${juego.duracion_minutos} minutos` : ''}</p>
          <p><b>Árbitros:</b> {arbitros.length ? arbitros.map((a) => `${a.nombres} ${a.apellidos}`).join(', ') : '—'}{juego.entidad_arbitros ? ` — Entidad: ${juego.entidad_arbitros}` : ''}</p>
          <p><b>Anotador:</b> {juego.anotador_oficial || '—'}{juego.entidad_anotador ? ` — Entidad: ${juego.entidad_anotador}` : ''}</p>
          <p><b>Estadio:</b> {juego.estadio || '—'}{juego.estadio_direccion ? ` — ${juego.estadio_direccion}` : ''}</p>
          <p><b>Fecha:</b> {juego.fecha}{juego.fecha_fin && juego.fecha_fin !== juego.fecha ? ` a ${juego.fecha_fin}` : ''}</p>
          {juego.ronda && <p><b>Ronda:</b> {juego.ronda}</p>}
          <p><b>Jugador más valioso del juego:</b> {mvp ? `${mvp.nombres} ${mvp.apellidos} (${mvpEquipo})` : '—'}</p>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', padding: '0 var(--space-4) var(--space-4)' }}>
          Estos datos se editan desde el botón "Resultado" en el calendario de juegos.
        </p>
      </div>
    </div>
  );
}