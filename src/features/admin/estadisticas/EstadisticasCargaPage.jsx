import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';

// ── Columnas exactas de tu Excel ──────────────────────────────────────
const COLS_BATEO = [
  ['vb', 'VB'], ['ca', 'CA'], ['hc', 'HC'], ['bb', 'BB'],
  ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'], ['in_', 'IN'], ['al', 'AL'],
  ['h2', 'H2'], ['h3', 'H3'], ['hr', 'HR'], ['ba', 'BA'],
  ['ci', 'CI'], ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'],
];

const COLS_PITCHEO = [
  ['g', 'G'], ['p', 'P'], ['s', 'S'], ['e', 'E'],
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['b', 'B'],
  ['il', 'IL'], ['vb', 'VB'], ['hp', 'HP'],
  ['h2', 'H2'], ['h3', 'H3'], ['hr', 'HR'],
  ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'],
  ['bi', 'BI'], ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'],
  ['wp', 'WP'], ['bk', 'BK'],
];

const COLS_FILDEO = [
  ['ij', 'IJ'], ['o', 'O'], ['a', 'A'], ['e', 'E'],
  ['tl', 'TL'], ['dp', 'DP'], ['di', 'DI'],
];

const COLS_FILDEO_C = [
  ...COLS_FILDEO,
  ['pb', 'PB'], ['ir', 'IR'], ['or_', 'OR'],
];

const POSICIONES = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

function filaVacia(roster_id, campos) {
  const f = { roster_id };
  campos.forEach(([k]) => { f[k] = 0; });
  return f;
}

function fusionar(vacia, existente, campos) {
  if (!existente) return vacia;
  const f = { ...vacia };
  campos.forEach(([k]) => { f[k] = existente[k] ?? 0; });
  return f;
}

// ── Componente principal ──────────────────────────────────────────────
export default function EstadisticasCargaPage() {
  const { juegoId } = useParams();
  const { notificar } = useToast();

  const [juego, setJuego] = useState(null);
  const [rosterLocal, setRosterLocal] = useState([]);
  const [rosterVisitante, setRosterVisitante] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filas editables por sección
  const [filasBateo, setFilasBateo] = useState([]);
  const [filasPitcheo, setFilasPitcheo] = useState([]);
  const [filasFildeo, setFilasFildeo] = useState([]);

  const [guardando, setGuardando] = useState({ bateo: false, pitcheo: false, fildeo: false });

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

      const roster = [
        ...rl.map((r) => ({ ...r, equipo: j.equipo_local })),
        ...rv.map((r) => ({ ...r, equipo: j.equipo_visitante })),
      ];

      setRosterLocal(rl);
      setRosterVisitante(rv);

      setFilasBateo(roster.map((r) =>
        fusionar(
          { ...filaVacia(r.id, COLS_BATEO), nombres: r.nombres, apellidos: r.apellidos, numero_camiseta: r.numero_camiseta, equipo: r.equipo },
          existente.bateo.find((x) => x.roster_id === r.id),
          COLS_BATEO
        )
      ));

      setFilasPitcheo(roster.map((r) =>
        fusionar(
          { ...filaVacia(r.id, COLS_PITCHEO), nombres: r.nombres, apellidos: r.apellidos, numero_camiseta: r.numero_camiseta, equipo: r.equipo },
          existente.pitcheo.find((x) => x.roster_id === r.id),
          COLS_PITCHEO
        )
      ));

      // Fildeo: una fila por posición — arranca con las que ya existen
      if (existente.fildeo.length > 0) {
        setFilasFildeo(existente.fildeo.map((ef) => {
          const jugador = roster.find((r) => r.id === ef.roster_id);
          return {
            ...ef,
            nombres: jugador?.nombres || '',
            apellidos: jugador?.apellidos || '',
            numero_camiseta: jugador?.numero_camiseta,
            equipo: jugador?.equipo || '',
          };
        }));
      }

      setCargando(false);
    }
    cargar();
  }, [juegoId]);

  function actualizarCelda(filas, setFilas, roster_id, campo, valor) {
    setFilas(filas.map((f) => f.roster_id === roster_id ? { ...f, [campo]: valor } : f));
  }

  function actualizarFildeo(idx, campo, valor) {
    setFilasFildeo((prev) => prev.map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
  }

  function agregarFilaFildeo() {
    // Agrega fila vacía para que el anotador elija jugador y posición
    setFilasFildeo((prev) => [...prev, {
      roster_id: '', posicion: 'P', nombres: '', apellidos: '', numero_camiseta: '', equipo: '',
      ...Object.fromEntries(COLS_FILDEO_C.map(([k]) => [k, 0])),
    }]);
  }

  function quitarFilaFildeo(idx) {
    setFilasFildeo((prev) => prev.filter((_, i) => i !== idx));
  }

  async function guardar(tipo) {
    setGuardando((g) => ({ ...g, [tipo]: true }));
    try {
      let lineas;
      if (tipo === 'bateo') lineas = filasBateo;
      else if (tipo === 'pitcheo') lineas = filasPitcheo;
      else lineas = filasFildeo.filter((f) => f.roster_id);

      await api.put(`/estadisticas/${juegoId}/${tipo}`, { lineas });
      notificar(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} guardado`, 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardando((g) => ({ ...g, [tipo]: false }));
    }
  }

  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego) return <div className="vacio">Juego no encontrado.</div>;

  const todosRoster = [
    ...rosterLocal.map((r) => ({ ...r, equipo: juego.equipo_local })),
    ...rosterVisitante.map((r) => ({ ...r, equipo: juego.equipo_visitante })),
  ];

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Estadísticas del juego</h1>
          <p>{juego.equipo_local} vs {juego.equipo_visitante} — {juego.fecha}</p>
        </div>
        <Link to="/admin/estadisticas" className="boton boton--fantasma">← Volver</Link>
      </div>

      {/* ── BATEO ─────────────────────────────────────────────────── */}
      <SeccionEstadistica
        titulo="Bateo"
        onGuardar={() => guardar('bateo')}
        guardando={guardando.bateo}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 160 }}>Jugador</th>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {COLS_BATEO.map(([k, l]) => <th key={k} style={{ width: 46 }}>{l}</th>)}
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
                  {COLS_BATEO.map(([k]) => (
                    <td key={k}>
                      <input
                        type="number"
                        min={0}
                        value={f[k]}
                        style={{ width: 42 }}
                        onChange={(e) => actualizarCelda(filasBateo, setFilasBateo, f.roster_id, k, Number(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SeccionEstadistica>

      {/* ── PITCHEO ───────────────────────────────────────────────── */}
      <SeccionEstadistica
        titulo="Pitcheo"
        onGuardar={() => guardar('pitcheo')}
        guardando={guardando.pitcheo}
        nota="Solo diligencia los jugadores que lanzaron."
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 160 }}>Jugador</th>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {COLS_PITCHEO.map(([k, l]) => <th key={k} style={{ width: 40 }}>{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {filasPitcheo.map((f) => (
                <tr key={f.roster_id}>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    {f.numero_camiseta != null ? `#${f.numero_camiseta} ` : ''}{f.nombres} {f.apellidos}
                  </td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', whiteSpace: 'nowrap' }}>
                    {f.equipo}
                  </td>
                  {COLS_PITCHEO.map(([k]) => (
                    <td key={k}>
                      <input
                        type="number"
                        min={0}
                        step={k === 'il' ? '0.01' : '1'}
                        value={f[k]}
                        style={{ width: 38 }}
                        onChange={(e) => actualizarCelda(filasPitcheo, setFilasPitcheo, f.roster_id, k, Number(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SeccionEstadistica>

      {/* ── FILDEO ────────────────────────────────────────────────── */}
      <SeccionEstadistica
        titulo="Fildeo individual por posición"
        onGuardar={() => guardar('fildeo')}
        guardando={guardando.fildeo}
        nota="Agrega una fila por jugador por posición jugada. Un jugador puede aparecer varias veces si jugó en varias posiciones."
        accionExtra={
          <button className="boton boton--fantasma boton--chico" onClick={agregarFilaFildeo}>
            + Agregar fila
          </button>
        }
      >
        <div style={{ overflowX: 'auto' }}>
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
                    <td style={{ textAlign: 'left' }}>
                      <select
                        value={f.roster_id}
                        onChange={(e) => {
                          const r = todosRoster.find((x) => String(x.id) === e.target.value);
                          actualizarFildeo(idx, 'roster_id', Number(e.target.value));
                          if (r) {
                            actualizarFildeo(idx, 'nombres', r.nombres);
                            actualizarFildeo(idx, 'apellidos', r.apellidos);
                            actualizarFildeo(idx, 'numero_camiseta', r.numero_camiseta);
                            actualizarFildeo(idx, 'equipo', r.equipo);
                          }
                        }}
                        style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }}
                      >
                        <option value="">Selecciona…</option>
                        {todosRoster.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.numero_camiseta != null ? `#${r.numero_camiseta} ` : ''}{r.nombres} {r.apellidos} ({r.equipo})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={f.posicion}
                        onChange={(e) => actualizarFildeo(idx, 'posicion', e.target.value)}
                      >
                        {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    {COLS_FILDEO_C.map(([k]) => (
                      <td key={k}>
                        {/* Solo mostrar las columnas del catcher si la posición es C */}
                        {(cols.find(([ck]) => ck === k)) ? (
                          <input
                            type="number"
                            min={0}
                            step={k === 'ij' ? '0.01' : '1'}
                            value={f[k] ?? 0}
                            style={{ width: 40 }}
                            onChange={(e) => actualizarFildeo(idx, k, Number(e.target.value))}
                          />
                        ) : (
                          <span style={{ color: 'var(--color-line)', fontSize: 10 }}>—</span>
                        )}
                      </td>
                    ))}
                    <td>
                      <button className="boton boton--peligro" onClick={() => quitarFilaFildeo(idx)}>×</button>
                    </td>
                  </tr>
                );
              })}
              {filasFildeo.length === 0 && (
                <tr>
                  <td colSpan={COLS_FILDEO_C.length + 3} style={{ textAlign: 'center', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)', padding: 'var(--space-4)' }}>
                    Usa "+ Agregar fila" para registrar el fildeo de cada jugador por posición.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SeccionEstadistica>
    </div>
  );
}

function SeccionEstadistica({ titulo, onGuardar, guardando, nota, accionExtra, children }) {
  return (
    <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-5)' }}>
      <div className="tarjeta-lista__cabecera">
        <h3>{titulo}</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {accionExtra}
          <button
            className="boton boton--dorado boton--chico"
            onClick={onGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : `Guardar ${titulo.toLowerCase()}`}
          </button>
        </div>
      </div>
      {nota && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', padding: '0 var(--space-3)', margin: 0 }}>
          {nota}
        </p>
      )}
      {children}
    </div>
  );
}
