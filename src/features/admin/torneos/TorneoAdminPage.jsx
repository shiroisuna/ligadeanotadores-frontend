import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { TeamBadge } from '../../../components/TeamBadge';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

const FASES_DEFAULT = [
  { nombre: 'Cuartos de Final', orden: 1, num_equipos: 8 },
  { nombre: 'Semifinal',        orden: 2, num_equipos: 4 },
  { nombre: 'Final',            orden: 3, num_equipos: 2 },
];

export default function TorneoAdminPage() {
  const { notificar } = useToast();
  const {
    temporadas, categorias,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState(null);
  const [fases, setFases] = useState([]);
  const [cruces, setCruces] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [juegos, setJuegos] = useState([]);

  const [modalTorneo, setModalTorneo] = useState(false);
  const [modalCruce, setModalCruce] = useState(null); // { fase_id, orden }

  function cargarTorneos() {
    if (!temporadaCategoriaId) return;
    api.get(`/torneos?temporada_categoria_id=${temporadaCategoriaId}`).then((data) => {
      setTorneos(data);
      if (!data.find((t) => t.id === torneoId)) setTorneoId(data[0]?.id ?? null);
    });
  }

  function cargarDetalle() {
    if (!torneoId) return;
    Promise.all([
      api.get(`/torneos/${torneoId}/fases`),
      api.get(`/torneos/${torneoId}/cruces`),
    ]).then(([f, c]) => { setFases(f); setCruces(c); });
  }

  useEffect(cargarTorneos, [temporadaCategoriaId]); // eslint-disable-line
  useEffect(cargarDetalle, [torneoId]); // eslint-disable-line
  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then(setEquipos);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`).then(setJuegos);
  }, [temporadaCategoriaId]);

  async function crearTorneo(nombre) {
    try {
      const nuevo = await api.post('/torneos', { temporada_categoria_id: temporadaCategoriaId, nombre });
      // Crear las 3 fases por defecto
      for (const f of FASES_DEFAULT) {
        await api.post(`/torneos/${nuevo.id}/fases`, f);
      }
      setTorneoId(nuevo.id);
      cargarTorneos();
      notificar('Torneo creado con Cuartos, Semifinal y Final', 'exito');
      setModalTorneo(false);
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  async function eliminarTorneo() {
    if (!confirm('¿Eliminar este torneo y todos sus cruces?')) return;
    try {
      await api.delete(`/torneos/${torneoId}`);
      setTorneoId(null);
      cargarTorneos();
      notificar('Torneo eliminado', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  async function guardarCruce({ fase_id, equipo_local_id, equipo_visitante_id, juego_id, orden }) {
    try {
      await api.post(`/torneos/${torneoId}/cruces`, {
        fase_id, equipo_local_id, equipo_visitante_id,
        juego_id: juego_id || null, orden,
      });
      cargarDetalle();
      notificar('Cruce agregado', 'exito');
      setModalCruce(null);
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  async function vincularJuego(cruceId, juego_id) {
    try {
      await api.put(`/torneos/${torneoId}/cruces/${cruceId}`, { juego_id });
      cargarDetalle();
      notificar('Juego vinculado', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  async function eliminarCruce(cruceId) {
    if (!confirm('¿Quitar este cruce?')) return;
    try {
      await api.delete(`/torneos/${torneoId}/cruces/${cruceId}`);
      cargarDetalle();
      notificar('Cruce eliminado', 'exito');
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  const torneoActual = torneos.find((t) => t.id === torneoId);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Torneos</h1>
          <p>Arma el bracket de cuartos, semifinal y final vinculando los juegos existentes.</p>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Temporada</label>
            <select value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
              {temporadas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Categoría</label>
            <select value={temporadaCategoriaId} onChange={(e) => setTemporadaCategoriaId(e.target.value)}>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.categoria_nombre}</option>)}
            </select>
          </div>
          <button className="boton boton--dorado" onClick={() => setModalTorneo(true)}>+ Nuevo torneo</button>
        </div>
      </div>

      {/* Selector de torneo */}
      {torneos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          {torneos.map((t) => (
            <button
              key={t.id}
              onClick={() => setTorneoId(t.id)}
              className={`boton ${t.id === torneoId ? 'boton--primario' : 'boton--fantasma'}`}
            >
              {t.nombre}
            </button>
          ))}
          {torneoActual && (
            <button className="boton boton--peligro" onClick={eliminarTorneo}>Eliminar torneo</button>
          )}
        </div>
      )}

      {!torneoActual && <div className="vacio">Crea un torneo para comenzar a armar el bracket.</div>}

      {/* Bracket por fases */}
      {torneoActual && fases.map((fase) => {
        const crucesDeEstaFase = cruces.filter((c) => c.fase_id === fase.id);
        return (
          <div key={fase.id} style={{ marginBottom: 'var(--space-6)' }}>
            <div className="tarjeta-lista__cabecera" style={{ borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }}>
              <h3>{fase.nombre}</h3>
              <button
                className="boton boton--fantasma boton--chico"
                onClick={() => setModalCruce({ fase_id: fase.id, orden: crucesDeEstaFase.length + 1 })}
              >
                + Agregar cruce
              </button>
            </div>

            {crucesDeEstaFase.length === 0 && (
              <div className="vacio" style={{ borderTop: '1px solid var(--border)' }}>
                Sin cruces en esta fase todavía.
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              background: '#fff',
              border: '1px solid var(--border)',
              borderTop: 'none',
              borderRadius: '0 0 var(--r-lg) var(--r-lg)',
            }}>
              {crucesDeEstaFase.map((c) => (
                <TarjetaCruce
                  key={c.cruce_id}
                  cruce={c}
                  juegos={juegos}
                  onVincular={(juegoId) => vincularJuego(c.cruce_id, juegoId)}
                  onEliminar={() => eliminarCruce(c.cruce_id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Modal nuevo torneo */}
      <ModalNombreTorneo
        abierto={modalTorneo}
        onCerrar={() => setModalTorneo(false)}
        onCrear={crearTorneo}
      />

      {/* Modal nuevo cruce */}
      {modalCruce && (
        <ModalNuevoCruce
          abierto
          onCerrar={() => setModalCruce(null)}
          faseId={modalCruce.fase_id}
          orden={modalCruce.orden}
          equipos={equipos}
          juegos={juegos}
          onGuardar={guardarCruce}
        />
      )}
    </div>
  );
}

function TarjetaCruce({ cruce, juegos, onVincular, onEliminar }) {
  const [juegoSeleccionado, setJuegoSeleccionado] = useState(cruce.juego_id || '');
  const localGana = cruce.juego_estado === 'jugado' && cruce.carreras_local > cruce.carreras_visitante;
  const visitanteGana = cruce.juego_estado === 'jugado' && cruce.carreras_visitante > cruce.carreras_local;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
      {/* Equipos */}
      <div style={{ padding: '10px 12px', background: 'var(--bg-3)' }}>
        {[
          [cruce.equipo_local_id, cruce.equipo_local, cruce.logo_local, cruce.carreras_local, localGana],
          [cruce.equipo_visitante_id, cruce.equipo_visitante, cruce.logo_visitante, cruce.carreras_visitante, visitanteGana],
        ].map(([id, nombre, logo, carr, gana], i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 0', opacity: cruce.juego_estado === 'jugado' ? (gana ? 1 : 0.5) : 1,
            fontWeight: gana ? 700 : 400,
          }}>
            <TeamBadge nombre={nombre} logoUrl={logo} tamano={20} />
            <span style={{ flex: 1, fontSize: 13 }}>{nombre}</span>
            {cruce.juego_estado === 'jugado' && (
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>{carr}</span>
            )}
            {cruce.equipo_ganador_id === id && (
              <span style={{ fontSize: 10, background: 'rgba(21,128,61,0.15)', color: 'var(--color-win)', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>
                ✓ GANADOR
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Vincular juego */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <select
          value={juegoSeleccionado}
          onChange={(e) => setJuegoSeleccionado(e.target.value)}
          style={{ flex: 1, fontSize: 12 }}
        >
          <option value="">Sin juego vinculado</option>
          {juegos
            .filter((j) =>
              (j.equipo_local_id === cruce.equipo_local_id || j.equipo_visitante_id === cruce.equipo_local_id) &&
              (j.equipo_local_id === cruce.equipo_visitante_id || j.equipo_visitante_id === cruce.equipo_visitante_id)
            )
            .map((j) => (
              <option key={j.id} value={j.id}>
                {j.fecha} — {j.carreras_local ?? '?'}-{j.carreras_visitante ?? '?'} ({j.estado})
              </option>
            ))
          }
        </select>
        <button
          className="boton boton--primario boton--chico"
          onClick={() => onVincular(juegoSeleccionado || null)}
        >
          OK
        </button>
        <button className="boton boton--peligro boton--chico" onClick={onEliminar}>×</button>
      </div>
    </div>
  );
}

function ModalNombreTorneo({ abierto, onCerrar, onCrear }) {
  const [nombre, setNombre] = useState('');
  return (
    <Modal titulo="Nuevo torneo" abierto={abierto} onCerrar={onCerrar}>
      <div className="campo">
        <label>Nombre del torneo</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Torneo Clausura 2026" />
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--txt-3)', margin: '8px 0' }}>
        Se crearán automáticamente las fases: Cuartos de Final, Semifinal y Final.
      </p>
      <div className="formulario__acciones">
        <button className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
        <button className="boton boton--primario" disabled={!nombre} onClick={() => onCrear(nombre)}>
          Crear torneo
        </button>
      </div>
    </Modal>
  );
}

function ModalNuevoCruce({ abierto, onCerrar, faseId, orden, equipos, juegos, onGuardar }) {
  const [localId, setLocalId] = useState('');
  const [visitanteId, setVisitanteId] = useState('');
  const [juegoId, setJuegoId] = useState('');

  const juegosFiltrados = juegos.filter((j) =>
    localId && visitanteId && (
      (String(j.equipo_local_id) === String(localId) && String(j.equipo_visitante_id) === String(visitanteId)) ||
      (String(j.equipo_visitante_id) === String(localId) && String(j.equipo_local_id) === String(visitanteId))
    )
  );

  function alGuardar() {
    if (!localId || !visitanteId) return;
    onGuardar({
      fase_id: faseId, orden,
      equipo_local_id: Number(localId),
      equipo_visitante_id: Number(visitanteId),
      juego_id: juegoId ? Number(juegoId) : null,
    });
  }

  return (
    <Modal titulo="Agregar cruce" abierto={abierto} onCerrar={onCerrar} ancho={440}>
      <div className="campo">
        <label>Equipo local</label>
        <select value={localId} onChange={(e) => { setLocalId(e.target.value); setJuegoId(''); }}>
          <option value="">Selecciona…</option>
          {equipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>
      <div className="campo">
        <label>Equipo visitante</label>
        <select value={visitanteId} onChange={(e) => { setVisitanteId(e.target.value); setJuegoId(''); }}>
          <option value="">Selecciona…</option>
          {equipos.filter((e) => String(e.id) !== String(localId)).map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label>Juego (opcional — puedes vincularlo después)</label>
        <select value={juegoId} onChange={(e) => setJuegoId(e.target.value)} disabled={!localId || !visitanteId}>
          <option value="">Sin juego por ahora</option>
          {juegosFiltrados.map((j) => (
            <option key={j.id} value={j.id}>
              {j.fecha} — {j.equipo_local} {j.carreras_local ?? '?'} - {j.carreras_visitante ?? '?'} {j.equipo_visitante}
            </option>
          ))}
        </select>
        {localId && visitanteId && juegosFiltrados.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 4 }}>
            No hay juegos entre estos equipos todavía. Créalo en "Calendario y juegos" y luego vincúlalo.
          </p>
        )}
      </div>
      <div className="formulario__acciones">
        <button className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
        <button className="boton boton--primario" disabled={!localId || !visitanteId} onClick={alGuardar}>
          Agregar cruce
        </button>
      </div>
    </Modal>
  );
}
