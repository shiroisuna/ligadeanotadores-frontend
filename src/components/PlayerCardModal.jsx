import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { TeamBadge } from './TeamBadge';
import { api } from '../api/client';

export function PlayerCardModal({ abierto, onCerrar }) {
  const [equipos, setEquipos] = useState([]);
  const [equipoElegido, setEquipoElegido] = useState(null);
  const [stats, setStats] = useState(null);
  const [contacto, setContacto] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    api.getAuth('/jugadores/mi-perfil')
      .then((data) => {
        setEquipos(data);
        setEquipoElegido(data[0] || null);
      })
      .finally(() => setCargando(false));
  }, [abierto]);

  useEffect(() => {
    if (!equipoElegido) { setStats(null); setContacto(null); return; }
    api.get(`/lideres/jugador/${equipoElegido.roster_id}`).then(setStats);
    api.getAuth(`/jugadores/perfil/${equipoElegido.roster_id}`).then(setContacto);
  }, [equipoElegido]);

  const b = stats?.bateo;
  const p = stats?.pitcheo;
  const edad = contacto?.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(contacto.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <Modal titulo="Mi tarjeta" abierto={abierto} onCerrar={onCerrar} ancho={420}>
      {cargando && <div className="vacio">Cargando…</div>}

      {!cargando && equipos.length === 0 && (
        <div className="vacio">Tu cuenta todavía no está vinculada a ningún roster.</div>
      )}

      {!cargando && equipos.length > 0 && (
        <>
          {equipos.length > 1 && (
            <div className="campo" style={{ marginBottom: 'var(--space-4)' }}>
              <label>Temporada</label>
              <select
                value={equipoElegido?.roster_id}
                onChange={(e) => setEquipoElegido(equipos.find((eq) => String(eq.roster_id) === e.target.value))}
              >
                {equipos.map((eq) => (
                  <option key={eq.roster_id} value={eq.roster_id}>
                    {eq.temporada_nombre} — {eq.categoria_nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="tarjeta-jugador">
            <div className="tarjeta-jugador__cabecera">
              {stats?.foto_url ? (
                <img
                  src={stats.foto_url}
                  alt=""
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <TeamBadge nombre={equipoElegido.equipo} logoUrl={equipoElegido.logo_url} tamano={56} />
              )}
              <div>
                <div className="tarjeta-jugador__equipo">{equipoElegido.equipo}</div>
                <div className="tarjeta-jugador__meta">
                  #{equipoElegido.numero_camiseta ?? '—'} · {equipoElegido.posicion_principal ?? 'Sin posición'}
                </div>
                <div className="tarjeta-jugador__meta">{equipoElegido.categoria_nombre}</div>
              </div>
            </div>

            {contacto && (
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-line)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-ink-soft)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                {edad !== null && <span><strong style={{ color: 'var(--color-ink)' }}>{edad}</strong> años</span>}
                {contacto.email && <span>{contacto.email}</span>}
                {contacto.telefono && <span>{contacto.telefono}</span>}
              </div>
            )}

            {b && (
              <div className="tarjeta-jugador__stats">
                <div><span className="cifra">{b.promedio_bateo}</span><label>AVE</label></div>
                <div><span className="cifra">{b.hits}</span><label>H</label></div>
                <div><span className="cifra">{b.jonrones}</span><label>HR</label></div>
                <div><span className="cifra">{b.carreras_impulsadas}</span><label>CI</label></div>
                <div><span className="cifra">{b.bases_robadas}</span><label>BR</label></div>
                <div><span className="cifra">{b.juegos_jugados}</span><label>JJ</label></div>
              </div>
            )}

            {p && (
              <div className="tarjeta-jugador__stats">
                <div><span className="cifra">{p.ganados}-{p.perdidos}</span><label>G-P</label></div>
                <div><span className="cifra">{p.efectividad}</span><label>EFE</label></div>
                <div><span className="cifra">{p.ponches}</span><label>SO</label></div>
                <div><span className="cifra">{p.innings_lanzados}</span><label>IL</label></div>
              </div>
            )}

            {!b && !p && (
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-soft)', fontSize: 13, padding: 'var(--space-3)' }}>
                Todavía no tienes estadística registrada en esta temporada.
              </p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
