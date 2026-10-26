import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { useAuth } from '../../../auth/AuthContext';
import { InputNumerico } from '../../../components/InputNumerico';
import { InputInnings } from '../../../components/InputInnings';
import { navegarConFlechas } from '../../../components/Navegacionceldas';
import { formatInnings } from '../../../utils/innings';

// El box score es la ÚNICA carga del juego: al guardarlo se generan las
// estadísticas (bateo, fildeo y pitcheo) como pendientes, para revisarlas
// en "Revisar estadísticas" y aprobarlas.

// [clave, etiqueta, tipo]  tipo: 'pos' | 'calc' | 'innings' | 'c' (solo receptor) | undefined (número)
const COLS_BATEO = [
  ['posicion', 'Pos', 'pos'],
  ['vb', 'VB'], ['ca', 'CA'], ['hc', 'H'], ['bb', 'BB'], ['sh', 'SH'], ['sf', 'SF'],
  ['gp', 'GP'], ['in_', 'IN'], ['al', 'AL', 'calc'],
  ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'], ['ba', 'BA', 'calc'],
  ['ci', 'CI'], ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'],
  ['ij', 'IJ', 'innings'], ['o', 'O'], ['a', 'A'], ['e', 'E'], ['tl', 'TL', 'calc'],
  ['dp', 'DP'], ['di', 'DI'],
  ['pb', 'PB', 'c'], ['ir', 'IR', 'c'], ['or_c', 'OR·C', 'c'],
];

// Orden del box score físico: I, R, C, B, G, P, S, E, T.L, VB, HP, H2, H3, HR, IL, CP, CL, SO, BB, BI, SH, SF, GP, WP, BK
const COLS_PITCHEO = [
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['b', 'B'], ['g', 'G'], ['p', 'P'], ['s', 'S'], ['e', 'E'],
  ['tl', 'T.L'], ['vb_enfrentados', 'VB'], ['hp', 'HP'], ['h2', 'H2'], ['h3', 'H3'], ['hr', 'HR'],
  ['il', 'IL', 'innings'], ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'], ['bi', 'BI'],
  ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'], ['wp', 'WP'], ['bk', 'BK'],
];

const NUM_ENTRADAS_DEFECTO = 7;
// BA = bateador adicional, SHF = short field (softbol). DH y BA solo batean.
const POSICIONES = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SHF', 'DH', 'BA'];
const TITULO_COL = {
  AL: 'AL = VB + BB + SH + SF + GP + IN (automático)',
  BA: 'BA = H + 2B + 2×3B + 3×HR (automático)',
  TL: 'TL = O + A + E (automático)',
  IJ: 'Innings jugados en esa posición (0,33 = 1/3)',
  IL: 'Innings lanzados (0,33 = 1/3)',
  PB: 'Solo receptor', IR: 'Solo receptor', 'OR·C': 'Outs robando — solo receptor',
};

const n = (v) => Number(v) || 0;
let contadorFilas = 0;
const nuevaClave = () => `n${++contadorFilas}`;
const calcAL = (f) => n(f.vb) + n(f.bb) + n(f.sh) + n(f.sf) + n(f.gp) + n(f.in_);
const calcBA = (f) => n(f.hc) + n(f.h2) + 2 * n(f.h3) + 3 * n(f.hr);
const calcTL = (f) => n(f.o) + n(f.a) + n(f.e);
const CALCULOS = { al: calcAL, ba: calcBA, tl: calcTL };

function filaNueva(columnas, extra = {}) {
  const fila = { roster_id: '', ...extra };
  columnas.forEach(([k, , tipo]) => { if (tipo !== 'pos' && tipo !== 'calc') fila[k] = 0; });
  return fila;
}

function sumar(filas, clave) {
  if (CALCULOS[clave]) return filas.reduce((acc, f) => acc + CALCULOS[clave](f), 0);
  return Math.round(filas.reduce((acc, f) => acc + n(f[clave]), 0) * 100) / 100;
}

// Quita los textos vacíos y deja solo números
function limpiar(f, columnas, extra = []) {
  const fila = { roster_id: Number(f.roster_id) };
  extra.forEach((k) => { fila[k] = f[k]; });
  columnas.forEach(([k, , tipo]) => { if (tipo !== 'pos' && tipo !== 'calc') fila[k] = n(f[k]); });
  return fila;
}

export default function BoxScoreAdminPage() {
  const { juegoId } = useParams();
  const { notificar } = useToast();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';

  const [juego, setJuego] = useState(null);
  const [rosterLocal, setRosterLocal] = useState([]);
  const [rosterVisitante, setRosterVisitante] = useState([]);
  const [filasBateo, setFilasBateo] = useState([]);
  const [filasPitcheo, setFilasPitcheo] = useState([]);
  const [entradasLocal, setEntradasLocal] = useState(Array(NUM_ENTRADAS_DEFECTO).fill(0));
  const [entradasVisitante, setEntradasVisitante] = useState(Array(NUM_ENTRADAS_DEFECTO).fill(0));
  const [arbitros, setArbitros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState('');

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

      setFilasBateo(existente.bateo.map((b) => ({ ...b, _key: `b${b.id}` })));
      setFilasPitcheo(existente.pitcheo.map((p) => ({ ...p, _key: `p${p.id}` })));

      const innings = Number(j.num_innings) || NUM_ENTRADAS_DEFECTO;
      const maxEntrada = Math.max(innings, ...entradas.map((e) => e.numero_entrada), 0);
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
    cargar().catch((err) => { notificar(err.message, 'error'); setCargando(false); });
  }, [juegoId]); // eslint-disable-line

  // ── Guardado ──────────────────────────────────────────────────────────
  async function guardarEntradas() {
    const entradas = [
      ...entradasLocal.map((carreras, i) => ({ equipo_inscrito_id: juego.equipo_local_id, numero_entrada: i + 1, carreras: n(carreras) })),
      ...entradasVisitante.map((carreras, i) => ({ equipo_inscrito_id: juego.equipo_visitante_id, numero_entrada: i + 1, carreras: n(carreras) })),
    ];
    await api.put(`/juegos/${juegoId}/entradas`, { entradas });
  }

  async function guardarBateo() {
    const sinJugador = filasBateo.some((f) => !f.roster_id);
    if (sinJugador) throw new Error('Hay filas de bateo sin jugador seleccionado');
    const lineas = filasBateo.map((f) => limpiar(f, COLS_BATEO, ['posicion']));
    await api.put(`/boxscore/${juegoId}/bateo`, { lineas });
  }

  async function guardarPitcheo() {
    const sinJugador = filasPitcheo.some((f) => !f.roster_id);
    if (sinJugador) throw new Error('Hay filas de pitcheo sin lanzador seleccionado');
    const lineas = filasPitcheo.map((f) => limpiar(f, COLS_PITCHEO));
    await api.put(`/boxscore/${juegoId}/pitcheo`, { lineas });
  }

  async function ejecutar(que, fn, mensaje) {
    setGuardando(que);
    try {
      await fn();
      notificar(mensaje, 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardando('');
    }
  }

  function guardarTodo() {
    return ejecutar('todo', async () => {
      await guardarEntradas();
      await guardarBateo();
      if (llevaPitcheo) await guardarPitcheo();
    }, 'Box score guardado — las estadísticas quedaron pendientes de revisión y aprobación');
  }

  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego) return <div className="vacio">Juego no encontrado.</div>;

  const llevaPitcheo = juego.lleva_pitcheo === undefined || juego.lleva_pitcheo === null ? true : !!juego.lleva_pitcheo;

  const equipos = [
    { id: juego.equipo_visitante_id, nombre: juego.equipo_visitante, etiqueta: 'Visitante', roster: rosterVisitante, entradas: entradasVisitante, setEntradas: setEntradasVisitante },
    { id: juego.equipo_local_id, nombre: juego.equipo_local, etiqueta: 'Home club', roster: rosterLocal, entradas: entradasLocal, setEntradas: setEntradasLocal },
  ];
  const equipoDe = (roster_id) => equipos.find((e) => e.roster.some((r) => Number(r.id) === Number(roster_id)));

  const todoElRoster = [...rosterVisitante, ...rosterLocal];
  const mvp = juego.mvp_roster_id ? todoElRoster.find((r) => r.id === juego.mvp_roster_id) : null;

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Box score</h1>
          <p>{juego.equipo_visitante} (V) vs {juego.equipo_local} (HC) — {juego.fecha}{juego.fecha_fin && juego.fecha_fin !== juego.fecha ? ` a ${juego.fecha_fin}` : ''}{juego.categoria_nombre ? ` · ${juego.categoria_nombre}` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/admin/juegos" className="boton boton--fantasma">← Calendario</Link>
          <button className="boton boton--dorado" onClick={guardarTodo} disabled={!!guardando}>
            {guardando === 'todo' ? 'Guardando…' : 'Guardar box score'}
          </button>
        </div>
      </div>

      <FlujoAprobacion juegoId={juegoId} esAdmin={esAdmin} />

      {/* ── LÍNEA DE ANOTACIÓN (centrada) ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tarjeta-lista__cabecera">
          <h3>Línea de anotación</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="boton boton--fantasma boton--chico"
              onClick={() => { setEntradasLocal((p) => [...p, 0]); setEntradasVisitante((p) => [...p, 0]); }}>
              + Entrada extra
            </button>
            <button className="boton boton--fantasma boton--chico" disabled={!!guardando}
              onClick={() => ejecutar('entradas', guardarEntradas, 'Línea de anotación guardada')}>
              {guardando === 'entradas' ? 'Guardando…' : 'Guardar entradas'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', padding: 'var(--space-4) var(--space-3)' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable linea-anotacion">
            <thead>
              <tr>
                <th className="linea-anotacion__equipo">Equipo</th>
                {entradasLocal.map((_, i) => <th key={i}>{i + 1}</th>)}
                <th className="linea-anotacion__total">C</th>
                <th className="linea-anotacion__total">H</th>
                <th className="linea-anotacion__total">E</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((eq) => {
                const filas = filasBateo.filter((f) => equipoDe(f.roster_id)?.id === eq.id);
                return (
                  <tr key={eq.id}>
                    <td className="linea-anotacion__equipo">{eq.nombre} <small>({eq.etiqueta === 'Visitante' ? 'V' : 'HC'})</small></td>
                    {eq.entradas.map((v, i) => (
                      <td key={i}>
                        <InputNumerico value={v} style={{ width: 34, textAlign: 'center' }}
                          onChange={(nv) => eq.setEntradas((p) => p.map((x, idx) => (idx === i ? nv : x)))} />
                      </td>
                    ))}
                    <td className="linea-anotacion__total"><b>{eq.entradas.reduce((a, b) => a + n(b), 0)}</b></td>
                    <td className="linea-anotacion__total">{sumar(filas, 'hc')}</td>
                    <td className="linea-anotacion__total">{sumar(filas, 'e')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="nota-chica">Carreras = suma de las entradas. Hits y errores salen del bateo y fildeo de cada equipo.</p>
      </div>

      {/* ── BATEO Y FILDEO, un bloque por equipo ── */}
      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tarjeta-lista__cabecera">
          <h3>Bateo y fildeo</h3>
          <button className="boton boton--fantasma boton--chico" disabled={!!guardando}
            onClick={() => ejecutar('bateo', guardarBateo, 'Bateo y fildeo guardados (pendientes de aprobación)')}>
            {guardando === 'bateo' ? 'Guardando…' : 'Guardar bateo'}
          </button>
        </div>
        <p className="nota-chica">
          Una fila por jugador y posición. Si un jugador cambió de posición durante el juego, agrégale otra fila con la nueva
          posición y sus innings (IJ) en ella. PB, IR y OR·C solo se llenan para el receptor (C).
        </p>
        {equipos.map((eq) => (
          <BloqueEquipo key={eq.id} titulo={`${eq.nombre} — ${eq.etiqueta}`}
            onAgregar={() => setFilasBateo((p) => [...p, filaNueva(COLS_BATEO, { posicion: '', _equipo: eq.id, _key: nuevaClave() })])}
            textoAgregar="+ Agregar jugador">
            <TablaLineas
              columnas={COLS_BATEO}
              filas={filasBateo}
              setFilas={setFilasBateo}
              filtro={(f) => (f.roster_id ? equipoDe(f.roster_id)?.id === eq.id : f._equipo === eq.id)}
              roster={eq.roster}
              vacio='Usa "+ Agregar jugador" para registrar el bateo.'
            />
          </BloqueEquipo>
        ))}
      </div>

      {/* ── PITCHEO, un bloque por equipo ── */}
      {llevaPitcheo ? (
        <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="tarjeta-lista__cabecera">
            <h3>Labor de lanzadores</h3>
            <button className="boton boton--fantasma boton--chico" disabled={!!guardando}
              onClick={() => ejecutar('pitcheo', guardarPitcheo, 'Pitcheo guardado (pendiente de aprobación)')}>
              {guardando === 'pitcheo' ? 'Guardando…' : 'Guardar pitcheo'}
            </button>
          </div>
          <p className="nota-chica">Una fila por cada lanzador que trabajó. IL se escribe 0,33 / 0,67 / 3,67 y se ve como 1/3, 2/3, 3 2/3.</p>
          {equipos.map((eq) => (
            <BloqueEquipo key={eq.id} titulo={`${eq.nombre} — ${eq.etiqueta}`}
              onAgregar={() => setFilasPitcheo((p) => [...p, filaNueva(COLS_PITCHEO, { _equipo: eq.id, _key: nuevaClave() })])}
              textoAgregar="+ Agregar lanzador">
              <TablaLineas
                columnas={COLS_PITCHEO}
                filas={filasPitcheo}
                setFilas={setFilasPitcheo}
                filtro={(f) => (f.roster_id ? equipoDe(f.roster_id)?.id === eq.id : f._equipo === eq.id)}
                roster={eq.roster}
                vacio='Usa "+ Agregar lanzador" para registrar el pitcheo.'
              />
            </BloqueEquipo>
          ))}
        </div>
      ) : (
        <p className="nota-chica" style={{ marginBottom: 'var(--space-5)' }}>Esta categoría no lleva estadística de pitcheo.</p>
      )}

      {/* ── DATOS TÉCNICOS (solo lectura — se editan desde "Resultado") ── */}
      <div className="tarjeta-lista">
        <div className="tarjeta-lista__cabecera"><h3>Datos técnicos</h3></div>
        <div style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 2 }}>
          <p><b>Tiempo de juego:</b> {juego.hora_inicio ? `Inicio ${juego.hora_inicio.slice(0, 5)}` : '—'}{juego.hora_final ? ` · Final ${juego.hora_final.slice(0, 5)}` : ''}{juego.duracion_minutos ? ` · Duración: ${juego.duracion_minutos} minutos` : ''}</p>
          <p><b>Árbitros:</b> {arbitros.length ? arbitros.map((a) => `${a.nombres} ${a.apellidos}`).join(', ') : '—'}{juego.entidad_arbitros ? ` — Entidad: ${juego.entidad_arbitros}` : ''}</p>
          <p><b>Anotador:</b> {juego.anotador_oficial || '—'}{juego.entidad_anotador ? ` — Entidad: ${juego.entidad_anotador}` : ''}</p>
          <p><b>Estadio:</b> {juego.estadio || '—'}{juego.estadio_direccion ? ` — ${juego.estadio_direccion}` : ''}</p>
          {juego.ronda && <p><b>Ronda:</b> {juego.ronda}</p>}
          <p><b>Jugador más valioso del juego:</b> {mvp ? `${mvp.nombres} ${mvp.apellidos}` : '—'}</p>
        </div>
        <p className="nota-chica">Estos datos se editan desde el botón "Resultado" en el calendario de juegos.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-5) 0' }}>
        <button className="boton boton--dorado" onClick={guardarTodo} disabled={!!guardando}>
          {guardando === 'todo' ? 'Guardando…' : 'Guardar box score'}
        </button>
      </div>
    </div>
  );
}

// Pasos del flujo: box score → revisión → aprobación
function FlujoAprobacion({ juegoId, esAdmin }) {
  return (
    <div className="flujo-boxscore">
      <span className="flujo-boxscore__paso flujo-boxscore__paso--activo">1. Llenar box score</span>
      <span className="flujo-boxscore__flecha">→</span>
      <Link className="flujo-boxscore__paso" to={`/admin/estadisticas/${juegoId}`}>2. Revisar y corregir estadísticas</Link>
      <span className="flujo-boxscore__flecha">→</span>
      {esAdmin
        ? <Link className="flujo-boxscore__paso" to="/admin/aprobaciones">3. Aprobar y publicar</Link>
        : <span className="flujo-boxscore__paso">3. El administrador aprueba</span>}
    </div>
  );
}

function BloqueEquipo({ titulo, onAgregar, textoAgregar, children }) {
  return (
    <div style={{ padding: '0 var(--space-3) var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-3) 0 var(--space-2)' }}>
        <h4 style={{ margin: 0, fontSize: 14 }}>{titulo}</h4>
        <button className="boton boton--fantasma boton--chico" onClick={onAgregar}>{textoAgregar}</button>
      </div>
      {children}
    </div>
  );
}

// Tabla editable genérica (bateo o pitcheo) para las filas de UN equipo
function TablaLineas({ columnas, filas, setFilas, filtro, roster, vacio }) {
  const visibles = filas.filter(filtro);

  function cambiar(key, campo, valor) {
    setFilas((prev) => prev.map((f) => (f._key === key ? { ...f, [campo]: valor } : f)));
  }
  function quitar(key) {
    setFilas((prev) => prev.filter((f) => f._key !== key));
  }

  return (
    <div style={{ overflowX: 'auto' }} onKeyDown={navegarConFlechas}>
      <table className="tabla tabla-editable">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', minWidth: 190 }}>Jugador</th>
            {columnas.map(([k, l, tipo]) => (
              <th key={k} title={TITULO_COL[l]} style={{ width: tipo === 'innings' ? 56 : 44, color: tipo === 'calc' ? 'var(--amber)' : undefined }}>{l}</th>
            ))}
            <th style={{ width: 36 }}></th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((f) => (
            <tr key={f._key}>
              <td>
                <select value={f.roster_id} onChange={(e) => cambiar(f._key, 'roster_id', e.target.value ? Number(e.target.value) : '')}
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  <option value="">Selecciona…</option>
                  {roster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos}
                    </option>
                  ))}
                </select>
              </td>
              {columnas.map(([k, l, tipo]) => (
                <td key={k}>
                  {tipo === 'pos' ? (
                    <select value={f[k] || ''} onChange={(e) => cambiar(f._key, k, e.target.value)} style={{ minWidth: 58 }}>
                      <option value="">—</option>
                      {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : tipo === 'calc' ? (
                    <input type="text" readOnly tabIndex={-1} value={CALCULOS[k](f)} title={TITULO_COL[l]}
                      style={{ width: 40, background: '#f0f4ff', cursor: 'not-allowed', fontWeight: 700 }} />
                  ) : tipo === 'innings' ? (
                    <InputInnings value={f[k]} style={{ width: 52 }} onChange={(v) => cambiar(f._key, k, v)} />
                  ) : tipo === 'c' && f.posicion !== 'C' ? (
                    <span style={{ color: 'var(--color-line)', fontSize: 10 }}>—</span>
                  ) : (
                    <InputNumerico value={f[k] ?? 0} style={{ width: 40 }} onChange={(v) => cambiar(f._key, k, v)} />
                  )}
                </td>
              ))}
              <td>
                <button className="boton boton--peligro" title="Quitar fila" onClick={() => quitar(f._key)}>×</button>
              </td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr><td colSpan={columnas.length + 2} style={{ textAlign: 'center', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)', padding: 'var(--space-3)' }}>{vacio}</td></tr>
          )}
          {visibles.length > 0 && (
            <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
              <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>TOTALES</td>
              {columnas.map(([k, , tipo]) => (
                <td key={k}>{tipo === 'pos' || tipo === 'c' ? '' : tipo === 'innings' ? formatInnings(sumar(visibles, k)) : sumar(visibles, k)}</td>
              ))}
              <td></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
