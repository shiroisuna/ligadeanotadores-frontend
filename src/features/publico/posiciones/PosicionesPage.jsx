import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';

function n(valor) {
  return valor === null || valor === undefined ? '—' : valor;
}

export default function PosicionesPage() {
  const [categoria, setCategoria] = useState(null);
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);

  function alCambiarCategoria(temporadaCategoriaId, categoriaSeleccionada) {
    setCategoria(categoriaSeleccionada);
    setCargando(true);
    api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setFilas)
      .finally(() => setCargando(false));
  }

  const avanzado = categoria?.nivel_standings === 'avanzado';

  // La API ya ordena por grupo, así que agrupamos manteniendo ese orden.
  const grupos = [];
  for (const f of filas) {
    const nombreGrupo = f.grupo || 'General';
    let g = grupos.find((x) => x.nombre === nombreGrupo);
    if (!g) { g = { nombre: nombreGrupo, filas: [] }; grupos.push(g); }
    g.filas.push(f);
  }

  return (
    <div>
      <Marcador onCambiarCategoria={alCambiarCategoria} />

      <main className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 'var(--space-1)' }}>Tabla de posiciones</h1>
        <p style={{ color: 'var(--color-ink-soft)', marginBottom: 'var(--space-5)' }}>
          {categoria ? `${categoria.categoria_nombre} — ${categoria.copa_nombre || 'Temporada regular'}` : ''}
        </p>

        {cargando && <div className="vacio">Cargando…</div>}

        {!cargando && filas.length === 0 && (
          <div className="vacio">Todavía no hay juegos registrados en esta categoría.</div>
        )}

        {!cargando && grupos.map((g) => (
          <div key={g.nombre} style={{ marginBottom: 'var(--space-6)' }}>
            {grupos.length > 1 && (
              <h2 style={{ fontSize: 15, color: 'var(--color-field)', marginBottom: 'var(--space-2)' }}>
                Grupo {g.nombre}
              </h2>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th style={{ textAlign: 'left' }}>Equipo</th>
                    <th>JJ</th>
                    <th>JG</th>
                    <th>JP</th>
                    <th>JE</th>
                    <th>AVE</th>
                    <th>PTOS</th>
                    <th>C.A</th>
                    {avanzado && <th>IJO</th>}
                    {avanzado && <th>MEDIA1</th>}
                    <th>C.P</th>
                    {avanzado && <th>IJD</th>}
                    {avanzado && <th>MEDIA2</th>}
                    {avanzado && <th>BCE</th>}
                    <th>D.C</th>
                    <th>REND</th>
                  </tr>
                </thead>
                <tbody>
                  {g.filas.map((f, i) => (
                    <tr key={f.equipo_inscrito_id}>
                      <td>{i + 1}</td>
                      <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TeamBadge nombre={f.equipo} logoUrl={f.logo_url} tamano={26} />
                        {f.equipo}
                      </td>
                      <td>{f.jj}</td>
                      <td style={{ color: 'var(--color-win)' }}>{f.jg}</td>
                      <td style={{ color: 'var(--color-loss)' }}>{f.jp}</td>
                      <td>{f.je}</td>
                      <td>{n(f.ave)}</td>
                      <td>{n(f.ptos)}</td>
                      <td>{f.carreras_anotadas}</td>
                      {avanzado && <td>{n(f.ijo)}</td>}
                      {avanzado && <td>{n(f.media1)}</td>}
                      <td>{f.carreras_permitidas}</td>
                      {avanzado && <td>{n(f.ijd)}</td>}
                      {avanzado && <td>{n(f.media2)}</td>}
                      {avanzado && <td>{n(f.bce)}</td>}
                      <td>{f.dc > 0 ? '+' : ''}{f.dc}</td>
                      <td>{f.rend !== null ? `${f.rend}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
