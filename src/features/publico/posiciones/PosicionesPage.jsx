import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import MatrizCruces from '../../../components/MatrizCruces';
import { api } from '../../../api/client';
import { exportarTablaPDF } from '../../../utils/exportarPDF';

const NOMBRE_FASE = {
  eliminatoria: 'Ronda eliminatoria', concentrado: 'Concentrado', semifinal: 'Semifinal', final: 'Final',
};

function n(v) { return v === null || v === undefined ? '—' : v; }

// Convierte un decimal (ej. 2.67) a fracción de innings (ej. "2 2/3"),
// redondeando al más cercano entre 1/3, 1/2 y 2/3.
function formatInningsFraccion(valor) {
  const num = Number(valor);
  if (Number.isNaN(num)) return '—';
  const entero = Math.floor(num);
  const frac = num - entero;
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

export default function PosicionesPage() {
  const [temporadaCategoriaId, setTemporadaCategoriaId] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fases, setFases] = useState([{ fase: 'eliminatoria' }]);
  const [fase, setFase] = useState('eliminatoria');
  const [grupoSel, setGrupoSel] = useState('');   // '' = el primero · '__todos' = todos los grupos

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
    setGrupoSel('');
  }

  // Fases disponibles de la categoría (la eliminatoria siempre; las demás cuando el admin las configura)
  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setFase('eliminatoria');
    setGrupoSel('');
    api.get(`/fases?temporada_categoria_id=${temporadaCategoriaId}`)
      .then((f) => setFases(f.length ? f : [{ fase: 'eliminatoria' }]))
      .catch(() => setFases([{ fase: 'eliminatoria' }]));
  }, [temporadaCategoriaId]);

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}&fase=${fase}`)
      .then(setFilas).finally(() => setCargando(false));
  }, [temporadaCategoriaId, fase]);

  const avanzado = categoria?.nivel_standings === 'avanzado';

  const grupos = [];
  for (const f of filas) {
    const g = f.grupo || 'General';
    let grp = grupos.find((x) => x.nombre === g);
    if (!grp) { grp = { nombre: g, filas: [] }; grupos.push(grp); }
    grp.filas.push(f);
  }

  // Con varios grupos (A, B…) se ve uno a la vez, como se publica; "Todos" muestra los dos juntos.
  const hayVariosGrupos = grupos.length > 1;
  const grupoActivo = !hayVariosGrupos ? ''
    : (grupoSel === '__todos' || grupos.some((g) => g.nombre === grupoSel)) ? grupoSel : grupos[0].nombre;
  const gruposVisibles = grupoActivo === '' || grupoActivo === '__todos'
    ? grupos : grupos.filter((g) => g.nombre === grupoActivo);

  async function descargarPDF(todosLosGrupos = false) {
    const lista = todosLosGrupos ? grupos : gruposVisibles;
    const cols = ['Pos', 'Equipo', 'JJ', 'JG', 'JP', 'JE', 'AVE', 'PTOS', 'C.A',
      ...(avanzado ? ['IJO', 'M1'] : []), 'C.P', ...(avanzado ? ['IJD', 'M2', 'BCE'] : []), 'D.C', 'REND'];
    const secciones = lista.map((g) => ({
      titulo: hayVariosGrupos ? `Grupo ${g.nombre}` : undefined,
      nota: fases.length > 1 ? `Fase: ${NOMBRE_FASE[fase]}` : undefined,
      columnas: cols,
      filas: g.filas.map((f, i) => [
        i + 1, f.equipo, f.jj, f.jg, f.jp, f.je, n(f.ave), n(f.ptos), f.carreras_anotadas,
        ...(avanzado ? [formatInningsFraccion(f.ijo), n(f.media1)] : []), f.carreras_permitidas,
        ...(avanzado ? [formatInningsFraccion(f.ijd), n(f.media2), n(f.bce)] : []),
        `${f.dc > 0 ? '+' : ''}${f.dc}`, f.rend != null ? `${f.rend}%` : '—',
      ]),
    }));
    await exportarTablaPDF({
      titulo: `TABLA DE POSICIONES${fases.length > 1 ? ' — ' + NOMBRE_FASE[fase].toUpperCase() : ''}`,
      subtitulo: categoria ? `${categoria.categoria_nombre}${categoria.copa_nombre ? ' — ' + categoria.copa_nombre : ''}` : '',
      secciones, nombreArchivo: `Posiciones_${(categoria?.categoria_nombre || 'liga').replace(/\s+/g, '_')}_${fase}${hayVariosGrupos && lista.length === 1 ? '_Grupo_' + lista[0].nombre : ''}`,
    });
  }

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />
      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Tabla de posiciones</h1>
        <p style={{ color: 'var(--txt-3)', marginBottom: 'var(--space-5)', fontSize: 14 }}>
          {categoria ? `${categoria.categoria_nombre}${categoria.copa_nombre ? ' — ' + categoria.copa_nombre : ''}` : ''}
        </p>
        {fases.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
            {fases.map((f) => (
              <button key={f.fase}
                className={`boton ${fase === f.fase ? 'boton--dorado' : 'boton--fantasma'}`}
                onClick={() => { setFase(f.fase); setGrupoSel(''); }}>
                {NOMBRE_FASE[f.fase]}
              </button>
            ))}
          </div>
        )}
        {hayVariosGrupos && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
            {grupos.map((g) => (
              <button key={g.nombre}
                className={`boton boton--chico ${grupoActivo === g.nombre ? 'boton--primario' : 'boton--fantasma'}`}
                onClick={() => setGrupoSel(g.nombre)}>
                Grupo {g.nombre}
              </button>
            ))}
            <button className={`boton boton--chico ${grupoActivo === '__todos' ? 'boton--primario' : 'boton--fantasma'}`}
              onClick={() => setGrupoSel('__todos')}>
              Todos los grupos
            </button>
          </div>
        )}
        {filas.length > 0 && (
          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="boton boton--fantasma" onClick={() => descargarPDF(false)}>
              📄 Descargar PDF{hayVariosGrupos && grupoActivo !== '__todos' ? ` (Grupo ${grupoActivo})` : ''}
            </button>
            {hayVariosGrupos && grupoActivo !== '__todos' && (
              <button className="boton boton--fantasma" onClick={() => descargarPDF(true)}>📄 PDF de todos los grupos</button>
            )}
          </div>
        )}
        {cargando && <div className="vacio">Cargando…</div>}
        {!cargando && filas.length === 0 && <div className="vacio">{fase === 'eliminatoria' ? 'Sin juegos registrados todavía.' : 'Esta fase aún no tiene equipos asignados.'}</div>}
        {!cargando && gruposVisibles.map((g) => (
          <div key={g.nombre} style={{ marginBottom: 'var(--space-6)' }}>
            {gruposVisibles.length > 1 && (
              <h2 style={{ fontSize: 13, color: 'var(--blue-txt)', marginBottom: 8, fontWeight: 700 }}>Grupo {g.nombre}</h2>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th style={{ textAlign: 'left' }}>Equipo</th>
                    <th>JJ</th><th>JG</th><th>JP</th><th>JE</th>
                    <th>AVE</th><th>PTOS</th><th>C.A</th>
                    {avanzado && <><th>IJO</th><th>M1</th></>}
                    <th>C.P</th>
                    {avanzado && <><th>IJD</th><th>M2</th><th>BCE</th></>}
                    <th>D.C</th><th>REND</th>
                  </tr>
                </thead>
                <tbody>
                  {g.filas.map((f, i) => (
                    <tr key={f.equipo_inscrito_id}>
                      <td>{i + 1}</td>
                      <td style={{ textAlign: 'left' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TeamBadge nombre={f.equipo} logoUrl={f.logo_url} tamano={22} />
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>{f.equipo}</span>
                        </span>
                      </td>
                      <td>{f.jj}</td>
                      <td style={{ color: 'var(--color-win)', fontWeight: 600 }}>{f.jg}</td>
                      <td style={{ color: 'var(--color-loss)', fontWeight: 600 }}>{f.jp}</td>
                      <td>{f.je}</td>
                      <td style={{ color: 'var(--blue-txt)', fontWeight: 700 }}>{n(f.ave)}</td>
                      <td>{n(f.ptos)}</td>
                      <td>{f.carreras_anotadas}</td>
                      {avanzado && <><td>{formatInningsFraccion(f.ijo)}</td><td>{n(f.media1)}</td></>}
                      <td>{f.carreras_permitidas}</td>
                      {avanzado && <><td>{formatInningsFraccion(f.ijd)}</td><td>{n(f.media2)}</td><td>{n(f.bce)}</td></>}
                      <td>{f.dc > 0 ? '+' : ''}{f.dc}</td>
                      <td>{f.rend != null ? `${f.rend}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <MatrizCruces temporadaCategoriaId={temporadaCategoriaId} fase={fase} grupo={grupoActivo === '__todos' ? '' : grupoActivo} />
      </main>
    </div>
  );
}
