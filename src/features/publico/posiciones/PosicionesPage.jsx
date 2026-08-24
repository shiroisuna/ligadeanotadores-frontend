import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRama } from '../../../hooks/useRama';
import { TeamBadge } from '../../../components/TeamBadge';
import { usePlayerModal } from '../../../components/PlayerModalProvider';
import { api } from '../../../api/client';

function n(v) { return v === null || v === undefined ? '—' : v; }

export default function PosicionesPage() {
  const { temporadaCategoriaId, categoria } = useRama();
  const { abrirJugador } = usePlayerModal();
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);

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
    <main className="contenedor" style={{ padding: '1.5rem 1rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>Tabla de posiciones</h1>
      <p style={{ color: 'var(--txt-3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        {categoria ? `${categoria.categoria_nombre}${categoria.copa_nombre ? ' — ' + categoria.copa_nombre : ''}` : ''}
      </p>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && filas.length === 0 && <div className="vacio">Sin juegos registrados todavía.</div>}

      {!cargando && grupos.map((g) => (
        <div key={g.nombre} style={{ marginBottom: '2rem' }}>
          {grupos.length > 1 && (
            <h2 style={{ fontSize: '0.85rem', color: 'var(--blue-txt)', marginBottom: '0.5rem', fontWeight: 700 }}>
              Grupo {g.nombre}
            </h2>
          )}
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="tabla-oscura">
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
                    <td>
                      <span className="equipo-cell">
                        <TeamBadge nombre={f.equipo} logoUrl={f.logo_url} tamano={22} />
                        <span>{f.equipo}</span>
                      </span>
                    </td>
                    <td>{f.jj}</td>
                    <td className="txt-green">{f.jg}</td>
                    <td className="txt-red">{f.jp}</td>
                    <td>{f.je}</td>
                    <td className="txt-blue">{n(f.ave)}</td>
                    <td>{n(f.ptos)}</td>
                    <td>{f.carreras_anotadas}</td>
                    {avanzado && <><td>{n(f.ijo)}</td><td>{n(f.media1)}</td></>}
                    <td>{f.carreras_permitidas}</td>
                    {avanzado && <><td>{n(f.ijd)}</td><td>{n(f.media2)}</td><td>{n(f.bce)}</td></>}
                    <td>{f.dc > 0 ? '+' : ''}{f.dc}</td>
                    <td>{f.rend != null ? `${f.rend}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </main>
  );
}
