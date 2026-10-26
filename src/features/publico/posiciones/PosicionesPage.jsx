import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import MatrizCruces from '../../../components/MatrizCruces';
import { api } from '../../../api/client';
import { formatInnings } from '../../../utils/innings';

function n(v) { return v === null || v === undefined ? '—' : v; }

// Nivel de la tabla según la categoría:
//   sencillo → JJ, JG, JP, JE, PTOS, AVE (Semillas)
//   basico   → + C.A, C.P, D.C, REND
//   avanzado → + IJO, M1, IJD, M2, BCE
function nivelTabla(categoria) {
  const nivel = categoria?.nivel_standings || 'basico';
  if (nivel === 'basico' && /semilla/i.test(categoria?.categoria_nombre || '')) return 'sencillo';
  return nivel;
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

  const nivel = nivelTabla(categoria);
  const sencilla = nivel === 'sencillo';
  const avanzado = nivel === 'avanzado';

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
                    <th>PTOS</th><th>AVE</th>
                    {!sencilla && <th>C.A</th>}
                    {avanzado && <><th>IJO</th><th>M1</th></>}
                    {!sencilla && <th>C.P</th>}
                    {avanzado && <><th>IJD</th><th>M2</th><th>BCE</th></>}
                    {!sencilla && <><th>D.C</th><th>REND</th></>}
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
                      <td style={{ color: 'var(--blue-txt)', fontWeight: 700 }}>{n(f.ptos)}</td>
                      <td>{n(f.ave)}</td>
                      {!sencilla && <td>{f.carreras_anotadas}</td>}
                      {avanzado && <><td>{formatInnings(f.ijo)}</td><td>{n(f.media1)}</td></>}
                      {!sencilla && <td>{f.carreras_permitidas}</td>}
                      {avanzado && <><td>{formatInnings(f.ijd)}</td><td>{n(f.media2)}</td><td>{n(f.bce)}</td></>}
                      {!sencilla && <>
                        <td>{f.dc > 0 ? '+' : ''}{f.dc}</td>
                        <td>{f.rend != null ? `${f.rend}%` : '—'}</td>
                      </>}
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
