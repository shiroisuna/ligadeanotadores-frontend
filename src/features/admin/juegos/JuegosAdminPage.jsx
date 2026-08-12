import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

const ESTADOS = ['programado', 'jugado', 'suspendido', 'pospuesto', 'ganado_forfeit', 'ganado_mesa', 'ganado_retiro'];
const ESTADOS_CON_GANADOR = ['ganado_forfeit', 'ganado_mesa', 'ganado_retiro'];

export default function JuegosAdminPage() {
  const { notificar } = useToast();
  const {
    temporadas, categorias,
    temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [juegos, setJuegos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [juegoEditar, setJuegoEditar] = useState(null);

  function cargarJuegos() {
    if (!temporadaCategoriaId) return;
    setCargando(true);
    api.get(`/juegos?temporada_categoria_id=${temporadaCategoriaId}`)
      .then(setJuegos)
      .finally(() => setCargando(false));
  }

  useEffect(cargarJuegos, [temporadaCategoriaId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!temporadaCategoriaId) return;
    api.get(`/equipos/inscritos?temporada_categoria_id=${temporadaCategoriaId}`).then(setInscritos);
  }, [temporadaCategoriaId]);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Calendario y juegos</h1>
          <p>Programa partidos y registra el resultado final de cada uno.</p>
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
          <button className="boton boton--dorado" style={{ alignSelf: 'flex-end' }} onClick={() => setModalNuevo(true)}>
            + Nuevo juego
          </button>
        </div>
      </div>

      {cargando && <div className="vacio">Cargando…</div>}
      {!cargando && juegos.length === 0 && <div className="vacio">No hay juegos programados en esta categoría.</div>}

      {!cargando && juegos.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Fecha</th>
              <th style={{ textAlign: 'left' }}>Local</th>
              <th style={{ textAlign: 'left' }}>Visitante</th>
              <th>Marcador</th>
              <th style={{ textAlign: 'left' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {juegos.map((j) => (
              <tr key={j.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                  {j.fecha} {j.hora ? j.hora.slice(0, 5) : ''}
                </td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_local}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.equipo_visitante}</td>
                <td>{j.carreras_local ?? '—'} - {j.carreras_visitante ?? '—'}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{j.estado}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="boton boton--fantasma boton--chico" onClick={() => setJuegoEditar(j)}>Resultado</button>
                  <Link className="boton boton--primario boton--chico" to={`/admin/boxscore/${j.id}`}>Box score</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModalNuevoJuego
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        temporadaCategoriaId={temporadaCategoriaId}
        inscritos={inscritos}
        onCreado={() => { setModalNuevo(false); cargarJuegos(); notificar('Juego programado', 'exito'); }}
      />

      {juegoEditar && (
        <ModalResultado
          juego={juegoEditar}
          onCerrar={() => setJuegoEditar(null)}
          onGuardado={() => { setJuegoEditar(null); cargarJuegos(); notificar('Resultado actualizado', 'exito'); }}
        />
      )}
    </div>
  );
}

function ModalNuevoJuego({ abierto, onCerrar, temporadaCategoriaId, inscritos, onCreado }) {
  const { notificar } = useToast();
  const [equipoLocal, setEquipoLocal] = useState('');
  const [equipoVisitante, setEquipoVisitante] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/juegos', {
        temporada_categoria_id: temporadaCategoriaId,
        equipo_local_id: equipoLocal,
        equipo_visitante_id: equipoVisitante,
        fecha, hora: hora || null,
      });
      setEquipoLocal(''); setEquipoVisitante(''); setFecha(''); setHora('');
      onCreado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Programar juego" abierto={abierto} onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Equipo local</label>
          <select required value={equipoLocal} onChange={(e) => setEquipoLocal(e.target.value)}>
            <option value="">Selecciona…</option>
            {inscritos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Equipo visitante</label>
          <select required value={equipoVisitante} onChange={(e) => setEquipoVisitante(e.target.value)}>
            <option value="">Selecciona…</option>
            {inscritos.filter((e) => String(e.id) !== equipoLocal).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Fecha</label>
            <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="campo">
            <label>Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Programar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalResultado({ juego, onCerrar, onGuardado }) {
  const { notificar } = useToast();
  const [form, setForm] = useState({
    estado: juego.estado,
    carreras_local: juego.carreras_local ?? '',
    carreras_visitante: juego.carreras_visitante ?? '',
    hits_local: juego.hits_local ?? '',
    hits_visitante: juego.hits_visitante ?? '',
    errores_local: juego.errores_local ?? '',
    errores_visitante: juego.errores_visitante ?? '',
    arbitros: juego.arbitros ?? '',
    anotador_oficial: juego.anotador_oficial ?? '',
    equipo_ganador_id: juego.equipo_ganador_id ?? '',
  });
  const [enviando, setEnviando] = useState(false);
  const necesitaGanador = ESTADOS_CON_GANADOR.includes(form.estado);

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.put(`/juegos/${juego.id}`, { ...form, equipo_ganador_id: necesitaGanador ? form.equipo_ganador_id : null });
      onGuardado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Resultado — ${juego.equipo_local} vs ${juego.equipo_visitante}`} abierto onCerrar={onCerrar} ancho={520}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Estado</label>
          <select value={form.estado} onChange={(e) => set('estado', e.target.value)}>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {necesitaGanador && (
          <div className="campo">
            <label>Equipo ganador</label>
            <select required value={form.equipo_ganador_id} onChange={(e) => set('equipo_ganador_id', e.target.value)}>
              <option value="">Selecciona…</option>
              <option value={juego.equipo_local_id}>{juego.equipo_local}</option>
              <option value={juego.equipo_visitante_id}>{juego.equipo_visitante}</option>
            </select>
          </div>
        )}
        <div className="campo--fila">
          <div className="campo">
            <label>Carreras local</label>
            <input type="number" value={form.carreras_local} onChange={(e) => set('carreras_local', e.target.value)} />
          </div>
          <div className="campo">
            <label>Carreras visitante</label>
            <input type="number" value={form.carreras_visitante} onChange={(e) => set('carreras_visitante', e.target.value)} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Hits local</label>
            <input type="number" value={form.hits_local} onChange={(e) => set('hits_local', e.target.value)} />
          </div>
          <div className="campo">
            <label>Hits visitante</label>
            <input type="number" value={form.hits_visitante} onChange={(e) => set('hits_visitante', e.target.value)} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Errores local</label>
            <input type="number" value={form.errores_local} onChange={(e) => set('errores_local', e.target.value)} />
          </div>
          <div className="campo">
            <label>Errores visitante</label>
            <input type="number" value={form.errores_visitante} onChange={(e) => set('errores_visitante', e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label>Árbitros</label>
          <input value={form.arbitros} onChange={(e) => set('arbitros', e.target.value)} />
        </div>
        <div className="campo">
          <label>Anotador oficial</label>
          <input value={form.anotador_oficial} onChange={(e) => set('anotador_oficial', e.target.value)} />
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar resultado'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
