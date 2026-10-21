import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { InputNumerico } from '../../../components/InputNumerico';
import { navegarConFlechas } from '../../../components/Navegacionceldas';

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
  ['il', 'IL', '0.01'],
  ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'],
  ['bi', 'BI'], ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'],
  ['wp', 'WP'], ['bk', 'BK'],
];

const COLS_FILDEO    = [['ij','IJ'],['o','O'],['a','A'],['e','E'],['tl','TL'],['dp','DP'],['di','DI']];
const COLS_FILDEO_C  = [...COLS_FILDEO, ['pb','PB'],['ir','IR'],['or_','OR']];
const POSICIONES     = ['P','C','1B','2B','3B','SS','LF','CF','RF'];

function filaVacia(roster_id, cols) {
  const f = { roster_id };
  cols.forEach(([k,, readonly]) => { if (!readonly) f[k] = 0; });
  return f;
}

function fusionar(vacia, existente, cols) {
  if (!existente) return vacia;
  const f = { ...vacia };
  cols.forEach(([k,, readonly]) => { if (!readonly && existente[k] !== undefined) f[k] = existente[k] ?? 0; });
  return f;
}

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

  const [juego,            setJuego]            = useState(null);
  const [rosterLocal,      setRosterLocal]       = useState([]);
  const [rosterVisitante,  setRosterVisitante]   = useState([]);
  const [cargando,         setCargando]          = useState(true);
  const [filasBateo,       setFilasBateo]        = useState([]);
  const [filasPitcheo,     setFilasPitcheo]      = useState([]);
  const [filasFildeo,      setFilasFildeo]       = useState([]);
  const [guardando,        setGuardando]         = useState({ bateo: false, pitcheo: false, fildeo: false });

  useEffect(() => {
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

      setFilasBateo(roster.map((r) => fusionar(
        { ...filaVacia(r.id, COLS_BATEO), nombres: r.nombres, apellidos: r.apellidos, numero_camiseta: r.numero_camiseta, equipo: r.equipo },
        existente.bateo.find((x) => x.roster_id === r.id), COLS_BATEO
      )));

      // Pitcheo, igual que Fildeo: una fila por cada línea ya guardada,
      // con selector de jugador — no una fila fija por cada roster.
      if (existente.pitcheo.length > 0) {
        setFilasPitcheo(existente.pitcheo.map((ep) => {
          const jugador = roster.find((r) => r.id === ep.roster_id);
          return { ...ep, nombres: jugador?.nombres || '', apellidos: jugador?.apellidos || '', numero_camiseta: jugador?.numero_camiseta, equipo: jugador?.equipo || '' };
        }));
      } else {
        setFilasPitcheo([]);
      }

      if (existente.fildeo.length > 0) {
        setFilasFildeo(existente.fildeo.map((ef) => {
          const jugador = roster.find((r) => r.id === ef.roster_id);
          return { ...ef, nombres: jugador?.nombres || '', apellidos: jugador?.apellidos || '', numero_camiseta: jugador?.numero_camiseta, equipo: jugador?.equipo || '' };
        }));
      }
      setCargando(false);
    }
    cargar();
  }, [juegoId]);

  function setCelda(filas, setFilas, roster_id, campo, valor) {
    setFilas(filas.map((f) => f.roster_id === roster_id ? { ...f, [campo]: valor } : f));
  }
  function setFildeo(idx, campo, valor) {
    setFilasFildeo((prev) => prev.map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
  }
  function setPitcheo(idx, campo, valor) {
    setFilasPitcheo((prev) => prev.map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
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

  async function guardar(tipo) {
    setGuardando((g) => ({ ...g, [tipo]: true }));
    try {
      const lineas = tipo === 'fildeo'
        ? filasFildeo.filter((f) => f.roster_id).map((f) => aNumero({ ...f, tl: calcTL(f) }, ['roster_id', 'posicion', 'nombres', 'apellidos', 'numero_camiseta', 'equipo']))
        : tipo === 'pitcheo' ? filasPitcheo.filter((f) => f.roster_id).map((f) => aNumero(f, ['roster_id', 'nombres', 'apellidos', 'numero_camiseta', 'equipo']))
        : filasBateo.map((f) => aNumero({ ...f, al: calcAL(f), ba: calcBA(f) }, ['roster_id', 'nombres', 'apellidos', 'numero_camiseta', 'equipo']));
      await api.put(`/estadisticas/${juegoId}/${tipo}`, { lineas });
      notificar(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} guardado`, 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardando((g) => ({ ...g, [tipo]: false }));
    }
  }

  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego)   return <div className="vacio">Juego no encontrado.</div>;

  // Visitante primero, luego local (home club)
  const todosRoster = [
    ...rosterVisitante.map((r) => ({ ...r, equipo: `${juego.equipo_visitante} (V)` })),
    ...rosterLocal.map((r)     => ({ ...r, equipo: `${juego.equipo_local} (HC)` })),
  ];

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Estadísticas del juego</h1>
          <p>{juego.equipo_visitante} (visitante) vs {juego.equipo_local} (home club) — {juego.fecha}</p>
        </div>
        <Link to="/admin/estadisticas" className="boton boton--fantasma">← Volver</Link>
      </div>

      {/* ── BATEO ── */}
      <Seccion titulo="Bateo" onGuardar={() => guardar('bateo')} guardando={guardando.bateo}>
        <div style={{ overflowX: 'auto' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 160 }}>Jugador</th>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {COLS_BATEO.map(([k, l, readonly]) => (
                  <th key={k} style={{ width: 46, color: readonly ? 'var(--amber)' : undefined }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasBateo.map((f) => (
                <tr key={f.roster_id}>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    {f.numero_camiseta != null ? `#${f.numero_camiseta} ` : ''}{f.nombres} {f.apellidos}
                  </td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', whiteSpace: 'nowrap' }}>
                    {f.equipo}
                  </td>
                  {COLS_BATEO.map(([k,, readonly]) => {
                    if (k === 'al_manual') {
                      return (
                        <td key={k}>
                          <input type="number" readOnly value={calcAL(f)}
                            style={{ width: 42, background: '#f0f4ff', cursor: 'not-allowed', fontWeight: 700 }} />
                        </td>
                      );
                    }
                    if (k === 'ba_calc') {
                      return (
                        <td key={k}>
                          <input type="number" readOnly value={calcBA(f)}
                            style={{ width: 42, background: '#f0f4ff', cursor: 'not-allowed', fontWeight: 700 }} />
                        </td>
                      );
                    }
                    return (
                      <td key={k}>
                        <InputNumerico value={f[k] ?? 0} style={{ width: 42 }}
                          onChange={(v) => setCelda(filasBateo, setFilasBateo, f.roster_id, k, v)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      {/* ── PITCHEO (estilo Fildeo: agregar fila, elegir jugador) ── */}
      <Seccion titulo="Pitcheo" onGuardar={() => guardar('pitcheo')} guardando={guardando.pitcheo}
        nota="Una fila por jugador que lanzó. Si un pitcher entró más de una vez, agrega una fila por cada entrada."
        accionExtra={
          <button className="boton boton--fantasma boton--chico"
            onClick={() => setFilasPitcheo((p) => [...p, {
              roster_id: '', nombres: '', apellidos: '', numero_camiseta: '', equipo: '',
              ...Object.fromEntries(COLS_PITCHEO.map(([k]) => [k, 0])),
            }])}>
            + Agregar fila
          </button>
        }>
        <div style={{ overflowX: 'auto' }} onKeyDown={navegarConFlechas}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 180 }}>Jugador</th>
                {COLS_PITCHEO.map(([k, l]) => <th key={k} style={{ width: 40 }}>{l}</th>)}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filasPitcheo.map((f, idx) => (
                <tr key={idx}>
                  <td>
                    <select value={f.roster_id}
                      onChange={(e) => {
                        const r = todosRoster.find((x) => String(x.id) === e.target.value);
                        setPitcheo(idx, 'roster_id', Number(e.target.value));
                        if (r) { setPitcheo(idx,'nombres',r.nombres); setPitcheo(idx,'apellidos',r.apellidos); setPitcheo(idx,'equipo',r.equipo); }
                      }}
                      style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }}>
                      <option value="">Selecciona…</option>
                      {todosRoster.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos} ({r.equipo})
                        </option>
                      ))}
                    </select>
                  </td>
                  {COLS_PITCHEO.map(([k,, step]) => (
                    <td key={k}>
                      <InputNumerico value={f[k] ?? 0} permitirDecimales={!!step} style={{ width: 38 }}
                        onChange={(v) => setPitcheo(idx, k, v)} />
                    </td>
                  ))}
                  <td>
                    <button className="boton boton--peligro"
                      onClick={() => setFilasPitcheo((p) => p.filter((_, i) => i !== idx))}>×</button>
                  </td>
                </tr>
              ))}
              {filasPitcheo.length === 0 && (
                <tr><td colSpan={COLS_PITCHEO.length + 2} style={{ textAlign: 'center', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)', padding: 'var(--space-4)' }}>
                  Usa "+ Agregar fila" para registrar el pitcheo.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>

      {/* ── FILDEO ── */}
      <Seccion titulo="Fildeo individual por posición" onGuardar={() => guardar('fildeo')}
        guardando={guardando.fildeo}
        nota="Una fila por jugador por posición jugada."
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
                <th style={{ textAlign: 'left', minWidth: 180 }}>Jugador</th>
                <th style={{ width: 70 }}>Posición</th>
                {COLS_FILDEO_C.map(([k, l]) => <th key={k} style={{ width: 44 }}>{l}</th>)}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filasFildeo.map((f, idx) => {
                const cols = f.posicion === 'C' ? COLS_FILDEO_C : COLS_FILDEO;
                return (
                  <tr key={idx}>
                    <td>
                      <select value={f.roster_id}
                        onChange={(e) => {
                          const r = todosRoster.find((x) => String(x.id) === e.target.value);
                          setFildeo(idx, 'roster_id', Number(e.target.value));
                          if (r) { setFildeo(idx,'nombres',r.nombres); setFildeo(idx,'apellidos',r.apellidos); setFildeo(idx,'equipo',r.equipo); }
                        }}
                        style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }}>
                        <option value="">Selecciona…</option>
                        {todosRoster.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos} ({r.equipo})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select value={f.posicion} onChange={(e) => setFildeo(idx, 'posicion', e.target.value)}>
                        {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    {COLS_FILDEO_C.map(([k]) => (
                      <td key={k}>
                        {k === 'tl' ? (
                          <input type="text" readOnly tabIndex={-1} value={calcTL(f)} title="TL = O + A + E (automático)"
                            style={{ width: 40, background: '#f0f4ff', cursor: 'not-allowed', fontWeight: 700 }} />
                        ) : cols.find(([ck]) => ck === k) ? (
                          <InputNumerico value={f[k] ?? 0} permitirDecimales={k === 'ij'} style={{ width: 40 }}
                            onChange={(v) => setFildeo(idx, k, v)} />
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
              {filasFildeo.length === 0 && (
                <tr><td colSpan={COLS_FILDEO_C.length + 3} style={{ textAlign: 'center', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)', padding: 'var(--space-4)' }}>
                  Usa "+ Agregar fila" para registrar el fildeo.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>
    </div>
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
            {guardando ? 'Guardando…' : `Guardar ${titulo.toLowerCase()}`}
          </button>
        </div>
      </div>
      {nota && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', padding: '0 var(--space-3)', margin: 0 }}>{nota}</p>}
      {children}
    </div>
  );
}