import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { useAuth } from '../../../auth/AuthContext';
import { InputNumerico } from '../../../components/InputNumerico';
import { InputInnings } from '../../../components/InputInnings';
import { navegarConFlechas } from '../../../components/Navegacionceldas';

// Esta pantalla ya NO es una segunda carga: las estadísticas se generan
// solas al guardar el box score. Aquí se revisan, se corrigen si hay un
// error y se aprueban para que salgan publicadas.

// ── Columnas de bateo con AL y BA calculados (solo lectura) ───────────
const COLS_BATEO = [
  ['vb',  'VB'],  ['ca',  'CA'],  ['hc',  'HC'],  ['bb',  'BB'],
  ['sh',  'SH'],  ['sf',  'SF'],  ['gp',  'GP'],  ['in_', 'IN'],
  ['al_manual', 'AL', true],  // calculado — readonly
  ['h2',  '2B'],  ['h3',  '3B'],  ['hr',  'HR'],
  ['ba_calc', 'BA', true],    // calculado — readonly
  ['ci',  'CI'],  ['br',  'BR'],  ['or_', 'OR'],  ['so',  'SO'],
];

// ── Columnas de pitcheo: I, R, C, B, G, P, S, E, luego el resto, con IL
// justo después de HR ──────────────────────────────────────────────────
const COLS_PITCHEO = [
  ['i',  'I'],  ['r',  'R'],  ['c',  'C'],  ['b',  'B'],
  ['g',  'G'],  ['p',  'P'],  ['s',  'S'],  ['e',  'E'],
  ['tl', 'T.L'],  // total de lanzamientos
  ['vb', 'VB'], ['hp', 'HP'], ['h2', 'H2'], ['h3', 'H3'], ['hr', 'HR'],
  ['il', 'IL', 'innings'],
  ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'],
  ['bi', 'BI'], ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'],
  ['wp', 'WP'], ['bk', 'BK'],
];

const COLS_FILDEO    = [['ij','IJ'],['o','O'],['a','A'],['e','E'],['tl','TL'],['dp','DP'],['di','DI']];
const COLS_FILDEO_C  = [...COLS_FILDEO, ['pb','PB'],['ir','IR'],['or_','OR']];
const POSICIONES     = ['P','C','1B','2B','3B','SS','LF','CF','RF','SHF'];

// Calcular AL y BA desde la fila
function calcAL(f) {
  return (Number(f.vb)||0) + (Number(f.bb)||0) + (Number(f.sh)||0) +
         (Number(f.sf)||0) + (Number(f.gp)||0) + (Number(f.in_)||0);
}
// Total de lances = Outs + Asistencias + Errores (automático)
function calcTL(f) {
  return (Number(f.o)||0) + (Number(f.a)||0) + (Number(f.e)||0);
}
function calcBA(f) {
  return (Number(f.hc)||0) + (Number(f.h2)||0) + 2*(Number(f.h3)||0) + 3*(Number(f.hr)||0);
}

export default function EstadisticasCargaPage() {
  const { juegoId } = useParams();
  const { notificar } = useToast();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';

  const [juego,            setJuego]            = useState(null);
  const [rosterLocal,      setRosterLocal]       = useState([]);
  const [rosterVisitante,  setRosterVisitante]   = useState([]);
  const [cargando,         setCargando]          = useState(true);
  const [filasBateo,       setFilasBateo]        = useState([]);
  const [filasPitcheo,     setFilasPitcheo]      = useState([]);
  const [filasFildeo,      setFilasFildeo]       = useState([]);
  const [guardando,        setGuardando]         = useState({ bateo: false, pitcheo: false, fildeo: false });
  const [aprobando,        setAprobando]         = useState(false);

  async function cargar() {
    setCargando(true);
    const [j, existente] = await Promise.all([
      api.get(`/juegos/${juegoId}`),
      api.get(`/estadisticas/${juegoId}`),
    ]);
    setJuego(j);

    const [rl, rv] = await Promise.all([
      api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_local_id}`),
      api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_visitante_id}`),
    ]);

    // Primero el VISITANTE y luego el LOCAL (home club)
    const roster = [
      ...rv.map((r) => ({ ...r, equipo: `${j.equipo_visitante} (V)` })),
      ...rl.map((r) => ({ ...r, equipo: `${j.equipo_local} (HC)` })),
    ];
    setRosterLocal(rl);
    setRosterVisitante(rv);

    const conJugador = (fila) => {
      const jugador = roster.find((r) => r.id === fila.roster_id);
      return { ...fila, nombres: jugador?.nombres || fila.nombres || '', apellidos: jugador?.apellidos || fila.apellidos || '', numero_camiseta: jugador?.numero_camiseta, equipo: jugador?.equipo || '' };
    };
    // Solo los jugadores que vienen del box score (no todo el roster en cero)
    const orden = (a, b) => roster.findIndex((r) => r.id === a.roster_id) - roster.findIndex((r) => r.id === b.roster_id);
    setFilasBateo(existente.bateo.map(conJugador).sort(orden));
    setFilasPitcheo(existente.pitcheo.map(conJugador));
    setFilasFildeo(existente.fildeo.map(conJugador).sort(orden));
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [juegoId]); // eslint-disable-line

  function setFila(setFilas, idx, campo, valor) {
    setFilas((prev) => prev.map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
  }
  function elegirJugador(setFilas, idx, valor) {
    const r = todosRoster.find((x) => String(x.id) === valor);
    setFilas((prev) => prev.map((f, i) => i === idx
      ? { ...f, roster_id: Number(valor) || '', nombres: r?.nombres || '', apellidos: r?.apellidos || '', numero_camiseta: r?.numero_camiseta, equipo: r?.equipo || '' }
      : f));
  }

  function aNumero(obj, camposExcluir = []) {
    const limpio = { ...obj };
    Object.keys(limpio).forEach((k) => {
      if (camposExcluir.includes(k)) return;
      if (typeof limpio[k] === 'string' && limpio[k] !== '') limpio[k] = Number(limpio[k]) || 0;
      else if (limpio[k] === '') limpio[k] = 0;
    });
    return limpio;
  }

  const TEXTO = ['roster_id', 'posicion', 'nombres', 'apellidos', 'numero_camiseta', 'equipo'];

  async function guardar(tipo) {
    setGuardando((g) => ({ ...g, [tipo]: true }));
    try {
      const lineas = tipo === 'fildeo'
        ? filasFildeo.filter((f) => f.roster_id).map((f) => aNumero({ ...f, tl: calcTL(f) }, TEXTO))
        : tipo === 'pitcheo' ? filasPitcheo.filter((f) => f.roster_id).map((f) => aNumero(f, TEXTO))
        : filasBateo.filter((f) => f.roster_id).map((f) => aNumero({ ...f, al: calcAL(f), ba: calcBA(f) }, TEXTO));
      if (!lineas.length) throw new Error('No hay filas con jugador para guardar');
      await api.put(`/estadisticas/${juegoId}/${tipo}`, { lineas });
      notificar(`Corrección de ${tipo} guardada`, 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardando((g) => ({ ...g, [tipo]: false }));
    }
  }

  async function aprobar() {
    if (!confirm('¿Aprobar el resultado y las estadísticas de este juego? Quedarán publicados en la página.')) return;
    setAprobando(true);
    try {
      await api.post(`/aprobaciones/juegos/${juegoId}/aprobar`);
      notificar('Juego aprobado y publicado', 'exito');
      await cargar();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setAprobando(false);
    }
  }

  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego)   return <div className="vacio">Juego no encontrado.</div>;

  // Visitante primero, luego local (home club)
  const todosRoster = [
    ...rosterVisitante.map((r) => ({ ...r, equipo: `${juego.equipo_visitante} (V)` })),
    ...rosterLocal.map((r)     => ({ ...r, equipo: `${juego.equipo_local} (HC)` })),
  ];

  const todas = [...filasBateo, ...filasPitcheo, ...filasFildeo];
  const sinDatos = todas.length === 0;
  const pendiente = todas.some((f) => Number(f.aprobado) === 0) || Number(juego.resultado_aprobado) === 0;

  const selectorJugador = (f, idx, setFilas) => (
    <select value={f.roster_id} onChange={(e) => elegirJugador(setFilas, idx, e.target.value)}
      style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }}>
      <option value="">Selecciona…</option>
      {todosRoster.map((r) => (
        <option key={r.id} value={r.id}>
          {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos} ({r.equipo})
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Revisión de estadísticas</h1>
          <p>{juego.equipo_visitante} (visitante) vs {juego.equipo_local} (home club) — {juego.fecha}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!sinDatos && (
            <span style={{
              fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '4px 12px',
              background: pendiente ? '#fef3c7' : '#dcfce7', color: pendiente ? '#92400e' : '#166534',
            }}>
              {pendiente ? 'Pendiente de aprobación' : 'Aprobado y publicado'}
            </span>
          )}
          <Link to={`/admin/boxscore/${juegoId}`} className="boton boton--fantasma">← Box score</Link>
          {esAdmin && !sinDatos && pendiente && (
            <button className="boton boton--primario" onClick={aprobar} disabled={aprobando}>
              {aprobando ? 'Aprobando…' : '✓ Aprobar y publicar'}
            </button>
          )}
        </div>
      </div>

      <div className="flujo-boxscore">
        <Link className="flujo-boxscore__paso" to={`/admin/boxscore/${juegoId}`}>1. Llenar box score</Link>
        <span className="flujo-boxscore__flecha">→</span>
        <span className="flujo-boxscore__paso flujo-boxscore__paso--activo">2. Revisar y corregir estadísticas</span>
        <span className="flujo-boxscore__flecha">→</span>
        <span className="flujo-boxscore__paso">3. {esAdmin ? 'Aprobar y publicar' : 'El administrador aprueba'}</span>
      </div>

      {sinDatos ? (
        <div className="vacio">
          Este juego todavía no tiene box score. Las estadísticas se generan solas al guardar el{' '}
          <Link to={`/admin/boxscore/${juegoId}`}>box score</Link>.
        </div>
      ) : (
        <p className="nota-chica" style={{ padding: '0 0 var(--space-4)', textAlign: 'center' }}>
          Estos datos vienen del box score. Si ves un error, corrígelo aquí y guarda esa sección.
          Ojo: si después se vuelve a guardar el box score, estas estadísticas se regeneran desde él.
        </p>
      )}

      {/* ── BATEO ── */}
      <Seccion titulo="Bateo" onGuardar={() => guardar('bateo')} guardando={guardando.bateo}
        accionExtra={
          <button className="boton boton--fantasma boton--chico"
            onClick={() => setFilasBateo((p) => [...p, { roster_id: '', ...Object.fromEntries(COLS_BATEO.filter(([,, ro]) => !ro).map(([k]) => [k, 0])) }])}>
            + Agregar fila
          </button>
        }>
        <div style={{ overflowX: 'auto' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 200 }}>Jugador</th>
                {COLS_BATEO.map(([k, l, readonly]) => (
                  <th key={k} style={{ width: 46, color: readonly ? 'var(--amber)' : undefined }}>{l}</th>
                ))}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filasBateo.map((f, idx) => (
                <tr key={idx}>
                  <td>{selectorJugador(f, idx, setFilasBateo)}</td>
                  {COLS_BATEO.map(([k,, readonly]) => (
                    <td key={k}>
                      {readonly ? (
                        <input type="text" readOnly tabIndex={-1} value={k === 'al_manual' ? calcAL(f) : calcBA(f)}
                          style={{ width: 42, background: '#f0f4ff', cursor: 'not-allowed', fontWeight: 700 }} />
                      ) : (
                        <InputNumerico value={f[k] ?? 0} style={{ width: 42 }}
                          onChange={(v) => setFila(setFilasBateo, idx, k, v)} />
                      )}
                    </td>
                  ))}
                  <td>
                    <button className="boton boton--peligro" onClick={() => setFilasBateo((p) => p.filter((_, i) => i !== idx))}>×</button>
                  </td>
                </tr>
              ))}
              {filasBateo.length === 0 && <FilaVacia columnas={COLS_BATEO.length + 2} />}
            </tbody>
          </table>
        </div>
      </Seccion>

      {/* ── PITCHEO ── */}
      <Seccion titulo="Pitcheo" onGuardar={() => guardar('pitcheo')} guardando={guardando.pitcheo}
        nota="Una fila por jugador que lanzó. IL: escribe 0,33 / 0,67 / 3,67 y se ve como 1/3, 2/3, 3 2/3."
        accionExtra={
          <button className="boton boton--fantasma boton--chico"
            onClick={() => setFilasPitcheo((p) => [...p, { roster_id: '', ...Object.fromEntries(COLS_PITCHEO.map(([k]) => [k, 0])) }])}>
            + Agregar fila
          </button>
        }>
        <div style={{ overflowX: 'auto' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 200 }}>Jugador</th>
                {COLS_PITCHEO.map(([k, l, tipo]) => <th key={k} style={{ width: tipo ? 56 : 40 }}>{l}</th>)}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filasPitcheo.map((f, idx) => (
                <tr key={idx}>
                  <td>{selectorJugador(f, idx, setFilasPitcheo)}</td>
                  {COLS_PITCHEO.map(([k,, tipo]) => (
                    <td key={k}>
                      {tipo === 'innings' ? (
                        <InputInnings value={f[k]} style={{ width: 52 }} onChange={(v) => setFila(setFilasPitcheo, idx, k, v)} />
                      ) : (
                        <InputNumerico value={f[k] ?? 0} style={{ width: 38 }} onChange={(v) => setFila(setFilasPitcheo, idx, k, v)} />
                      )}
                    </td>
                  ))}
                  <td>
                    <button className="boton boton--peligro"
                      onClick={() => setFilasPitcheo((p) => p.filter((_, i) => i !== idx))}>×</button>
                  </td>
                </tr>
              ))}
              {filasPitcheo.length === 0 && <FilaVacia columnas={COLS_PITCHEO.length + 2} />}
            </tbody>
          </table>
        </div>
      </Seccion>

      {/* ── FILDEO ── */}
      <Seccion titulo="Fildeo individual por posición" onGuardar={() => guardar('fildeo')}
        guardando={guardando.fildeo}
        nota="Una fila por jugador por posición jugada. IJ se ve como fracción (0,33 = 1/3)."
        accionExtra={
          <button className="boton boton--fantasma boton--chico"
            onClick={() => setFilasFildeo((p) => [...p, {
              roster_id: '', posicion: 'P', nombres: '', apellidos: '', numero_camiseta: '', equipo: '',
              ...Object.fromEntries(COLS_FILDEO_C.map(([k]) => [k, 0])),
            }])}>
            + Agregar fila
          </button>
        }>
        <div style={{ overflowX: 'auto' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 200 }}>Jugador</th>
                <th style={{ width: 70 }}>Posición</th>
                {COLS_FILDEO_C.map(([k, l]) => <th key={k} style={{ width: k === 'ij' ? 56 : 44 }}>{l}</th>)}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filasFildeo.map((f, idx) => {
                const cols = f.posicion === 'C' ? COLS_FILDEO_C : COLS_FILDEO;
                return (
                  <tr key={idx}>
                    <td>{selectorJugador(f, idx, setFilasFildeo)}</td>
                    <td>
                      <select value={f.posicion} onChange={(e) => setFila(setFilasFildeo, idx, 'posicion', e.target.value)}>
                        {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    {COLS_FILDEO_C.map(([k]) => (
                      <td key={k}>
                        {k === 'tl' ? (
                          <input type="text" readOnly tabIndex={-1} value={calcTL(f)} title="TL = O + A + E (automático)"
                            style={{ width: 40, background: '#f0f4ff', cursor: 'not-allowed', fontWeight: 700 }} />
                        ) : k === 'ij' ? (
                          <InputInnings value={f[k]} style={{ width: 52 }} onChange={(v) => setFila(setFilasFildeo, idx, k, v)} />
                        ) : cols.find(([ck]) => ck === k) ? (
                          <InputNumerico value={f[k] ?? 0} style={{ width: 40 }}
                            onChange={(v) => setFila(setFilasFildeo, idx, k, v)} />
                        ) : (
                          <span style={{ color: 'var(--color-line)', fontSize: 10 }}>—</span>
                        )}
                      </td>
                    ))}
                    <td>
                      <button className="boton boton--peligro"
                        onClick={() => setFilasFildeo((p) => p.filter((_, i) => i !== idx))}>×</button>
                    </td>
                  </tr>
                );
              })}
              {filasFildeo.length === 0 && <FilaVacia columnas={COLS_FILDEO_C.length + 3} />}
            </tbody>
          </table>
        </div>
      </Seccion>
    </div>
  );
}

function FilaVacia({ columnas }) {
  return (
    <tr><td colSpan={columnas} style={{ textAlign: 'center', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)', padding: 'var(--space-4)' }}>
      Sin datos — se llenan desde el box score.
    </td></tr>
  );
}

function Seccion({ titulo, onGuardar, guardando, nota, accionExtra, children }) {
  return (
    <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
      <div className="tarjeta-lista__cabecera">
        <h3>{titulo}</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {accionExtra}
          <button className="boton boton--dorado boton--chico" onClick={onGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar corrección'}
          </button>
        </div>
      </div>
      {nota && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', padding: '0 var(--space-3)', margin: 0 }}>{nota}</p>}
      {children}
    </div>
  );
}
