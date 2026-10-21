import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import MatrizCruces from '../../../components/MatrizCruces';
import { api } from '../../../api/client';

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

  function alCambiarCategoria(id, cat) {
    setTemporadaCategoriaId(id);
    setCategoria(cat);
  }

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setFilas).finally(() => setCargando(false));
  }, [temporadaCategoriaId]);

  const avanzado = categoria?.nivel_standings === 'avanzado';

  const grupos = [];
  for (const f of filas) {
    const g = f.grupo || 'General';
    let grp = grupos.find((x) => x.nombre === g);
    if (!grp) { grp = { nombre: g, filas: [] }; grupos.push(grp); }
    grp.filas.push(f);
  }

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />
      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Tabla de posiciones</h1>
        <p style={{ color: 'var(--txt-3)', marginBottom: 'var(--space-5)', fontSize: 14 }}>
          {categoria ? `${categoria.categoria_nombre}${categoria.copa_nombre ? ' — ' + categoria.copa_nombre : ''}` : ''}
        </p>
        {cargando && <div className="vacio">Cargando…</div>}
        {!cargando && filas.length === 0 && <div className="vacio">Sin juegos registrados todavía.</div>}
        {!cargando && grupos.map((g) => (
          <div key={g.nombre} style={{ marginBottom: 'var(--space-6)' }}>
            {grupos.length > 1 && (
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
        <MatrizCruces temporadaCategoriaId={temporadaCategoriaId} />
      </main>
    </div>
  );
}