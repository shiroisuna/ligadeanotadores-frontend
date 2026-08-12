import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';

const COLS_BATEO = [
  ['posicion', 'Pos', 'text'], ['vb', 'VB'], ['ca', 'CA'], ['hc', 'H'], ['bb', 'BB'],
  ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'], ['in_', 'IN'], ['al', 'AL'],
  ['h2', '2B'], ['h3', '3B'], ['hr', 'HR'], ['ba', 'BA'], ['ci', 'CI'],
  ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'], ['ij', 'IJ'], ['o', 'O'],
  ['a', 'A'], ['e', 'E'], ['tl', 'TL'], ['dp', 'DP'], ['di', 'DI'],
];

const COLS_PITCHEO = [
  ['g', 'G'], ['p', 'P'], ['s', 'S'], ['e', 'E'],
  ['vb_enfrentados', 'VB'], ['hp', 'H'], ['h2', '2B'], ['h3', '3B'],
  ['hr', 'HR'], ['il', 'IL'], ['tl', 'TL'], ['cp', 'CP'], ['cl', 'CL'],
  ['so', 'SO'], ['bb', 'BB'], ['bi', 'BI'], ['sf', 'SF'], ['gp', 'GP'], ['wp', 'WP'], ['bk', 'BK'],
];

function filaVacia(roster, columnas) {
  const fila = { roster_id: roster.id, nombres: roster.nombres, apellidos: roster.apellidos, equipoEtiqueta: roster.equipoEtiqueta };
  columnas.forEach(([key, , tipo]) => { fila[key] = tipo === 'text' || tipo === 'select' ? '' : 0; });
  return fila;
}

function fusionarConExistente(filaVacia, existente, columnas) {
  if (!existente) return filaVacia;
  const fila = { ...filaVacia };
  columnas.forEach(([key]) => { fila[key] = existente[key] ?? fila[key]; });
  return fila;
}

export default function BoxScoreAdminPage() {
  const { juegoId } = useParams();
  const { notificar } = useToast();

  const [juego, setJuego] = useState(null);
  const [filasBateo, setFilasBateo] = useState([]);
  const [filasPitcheo, setFilasPitcheo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoBateo, setGuardandoBateo] = useState(false);
  const [guardandoPitcheo, setGuardandoPitcheo] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const j = await api.get(`/juegos/${juegoId}`);
      setJuego(j);

      const [rosterLocal, rosterVisitante, existente] = await Promise.all([
        api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_local_id}`),
        api.get(`/jugadores/roster?equipo_inscrito_id=${j.equipo_visitante_id}`),
        api.get(`/boxscore/${juegoId}`),
      ]);

      const roster = [
        ...rosterLocal.map((r) => ({ ...r, equipoEtiqueta: j.equipo_local })),
        ...rosterVisitante.map((r) => ({ ...r, equipoEtiqueta: j.equipo_visitante })),
      ];

      setFilasBateo(roster.map((r) => fusionarConExistente(
        filaVacia(r, COLS_BATEO), existente.bateo.find((x) => x.roster_id === r.id), COLS_BATEO
      )));
      setFilasPitcheo(roster.map((r) => fusionarConExistente(
        filaVacia(r, COLS_PITCHEO), existente.pitcheo.find((x) => x.roster_id === r.id), COLS_PITCHEO
      )));

      setCargando(false);
    }
    cargar();
  }, [juegoId]);

  function actualizarCelda(filas, setFilas, roster_id, campo, valor) {
    setFilas(filas.map((f) => (f.roster_id === roster_id ? { ...f, [campo]: valor } : f)));
  }

  async function guardarBateo() {
    setGuardandoBateo(true);
    try {
      await api.put(`/boxscore/${juegoId}/bateo`, { lineas: filasBateo });
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
      await api.put(`/boxscore/${juegoId}/pitcheo`, { lineas: filasPitcheo });
      notificar('Pitcheo guardado', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardandoPitcheo(false);
    }
  }

  if (cargando) return <div className="vacio">Cargando…</div>;
  if (!juego) return <div className="vacio">Juego no encontrado.</div>;

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Box score</h1>
          <p>{juego.equipo_local} vs {juego.equipo_visitante} — {juego.fecha}</p>
        </div>
        <Link to="/admin/juegos" className="boton boton--fantasma">← Volver al calendario</Link>
      </div>

      <div className="tarjeta-lista" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="tarjeta-lista__cabecera">
          <h3>Bateo</h3>
          <button className="boton boton--dorado boton--chico" onClick={guardarBateo} disabled={guardandoBateo}>
            {guardandoBateo ? 'Guardando…' : 'Guardar bateo'}
          </button>
        </div>
        <div style={{ overflowX: 'auto', padding: 'var(--space-3)' }}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Jugador</th>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {COLS_BATEO.map(([key, label]) => <th key={key} style={{ width: 48 }}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filasBateo.map((f) => (
                <tr key={f.roster_id}>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{f.nombres} {f.apellidos}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', whiteSpace: 'nowrap' }}>{f.equipoEtiqueta}</td>
                  {COLS_BATEO.map(([key, , tipo]) => (
                    <td key={key}>
                      <input
                        type={tipo === 'text' ? 'text' : 'number'}
                        value={f[key]}
                        style={{ width: 44 }}
                        onChange={(e) => actualizarCelda(filasBateo, setFilasBateo, f.roster_id, key, tipo === 'text' ? e.target.value : Number(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tarjeta-lista">
        <div className="tarjeta-lista__cabecera">
          <h3>Pitcheo</h3>
          <button className="boton boton--dorado boton--chico" onClick={guardarPitcheo} disabled={guardandoPitcheo}>
            {guardandoPitcheo ? 'Guardando…' : 'Guardar pitcheo'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', padding: '0 var(--space-3)' }}>
          Solo diligencia esta tabla para los jugadores que lanzaron. Si la categoría no lleva pitcheo, "Guardar" mostrará un error — es normal.
        </p>
        <div style={{ overflowX: 'auto', padding: 'var(--space-3)' }}>
          <table className="tabla tabla-editable">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Jugador</th>
                <th style={{ textAlign: 'left' }}>Equipo</th>
                {COLS_PITCHEO.map(([key, label]) => <th key={key} style={{ width: 48 }}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filasPitcheo.map((f) => (
                <tr key={f.roster_id}>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{f.nombres} {f.apellidos}</td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', whiteSpace: 'nowrap' }}>{f.equipoEtiqueta}</td>
                  {COLS_PITCHEO.map(([key]) => (
                    <td key={key}>
                      <input
                        type="number"
                        value={f[key]}
                        style={{ width: 44 }}
                        onChange={(e) => actualizarCelda(filasPitcheo, setFilasPitcheo, f.roster_id, key, Number(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
