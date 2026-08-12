import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TeamBadge } from '../../../components/TeamBadge';
import { api } from '../../../api/client';

function Estadistica({ etiqueta, valor }) {
  return (
    <div className="stat-jugador">
      <div className="stat-jugador__valor cifra">{valor ?? '—'}</div>
      <div className="stat-jugador__etiqueta">{etiqueta}</div>
    </div>
  );
}

export default function JugadorDetallePage() {
  const { rosterId } = useParams();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.get(`/lideres/jugador/${rosterId}`)
      .then(setDatos)
      .finally(() => setCargando(false));
  }, [rosterId]);

  const b = datos?.bateo;
  const p = datos?.pitcheo;
  const nombre = b ? `${b.nombres} ${b.apellidos}` : p ? `${p.nombres} ${p.apellidos}` : '';
  const equipo = b?.equipo || p?.equipo;

  return (
    <div className="contenedor" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
      <Link to="/lideres" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-ink-soft)' }}>
        ← Volver a líderes
      </Link>

      {cargando && <div className="vacio">Cargando…</div>}

      {!cargando && !b && !p && (
        <div className="vacio">No hay estadísticas registradas para este jugador todavía.</div>
      )}

      {!cargando && (b || p) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: 'var(--space-4) 0 var(--space-6)' }}>
            <TeamBadge nombre={equipo} tamano={56} />
            <div>
              <h1 style={{ fontSize: 26 }}>{nombre}</h1>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-soft)', margin: 0 }}>
                {equipo} {b?.posicion_principal ? `· ${b.posicion_principal}` : ''}
              </p>
            </div>
          </div>

          {b && (
            <>
              <h2 style={{ fontSize: 16, marginBottom: 'var(--space-3)' }}>Bateo</h2>
              <div className="stats-grid">
                <Estadistica etiqueta="Juegos" valor={b.juegos_jugados} />
                <Estadistica etiqueta="Veces al bate" valor={b.vb} />
                <Estadistica etiqueta="Hits" valor={b.hits} />
                <Estadistica etiqueta="Dobles" valor={b.dobles} />
                <Estadistica etiqueta="Triples" valor={b.triples} />
                <Estadistica etiqueta="Jonrones" valor={b.jonrones} />
                <Estadistica etiqueta="Anotadas" valor={b.carreras_anotadas} />
                <Estadistica etiqueta="Impulsadas" valor={b.carreras_impulsadas} />
                <Estadistica etiqueta="Bases robadas" valor={b.bases_robadas} />
                <Estadistica etiqueta="Base por bolas" valor={b.bases_por_bolas} />
                <Estadistica etiqueta="Ponches" valor={b.ponches} />
                <Estadistica etiqueta="Promedio" valor={b.promedio_bateo} />
                <Estadistica etiqueta="Slugging" valor={b.slugging} />
              </div>
            </>
          )}

          {p && (
            <>
              <h2 style={{ fontSize: 16, margin: 'var(--space-6) 0 var(--space-3)' }}>Pitcheo</h2>
              <div className="stats-grid">
                <Estadistica etiqueta="Ganados" valor={p.ganados} />
                <Estadistica etiqueta="Perdidos" valor={p.perdidos} />
                <Estadistica etiqueta="Salvados" valor={p.salvados} />
                <Estadistica etiqueta="Innings lanzados" valor={p.innings_lanzados} />
                <Estadistica etiqueta="Ponches" valor={p.ponches} />
                <Estadistica etiqueta="Carreras limpias" valor={p.carreras_limpias} />
                <Estadistica etiqueta="Efectividad" valor={p.efectividad} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
