import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';

export default function TemporadasAdminPage() {
  const { notificar } = useToast();
  const [temporadas, setTemporadas] = useState([]);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState([]);
  const [temporadaId, setTemporadaId] = useState(null);
  const [categoriasActivas, setCategoriasActivas] = useState([]);

  const [modalTemporada, setModalTemporada] = useState(false);
  const [modalActivar, setModalActivar] = useState(false);

  function cargarTemporadas() {
    api.get('/temporadas').then((data) => {
      setTemporadas(data);
      if (!data.find((t) => t.id === temporadaId)) setTemporadaId(data[0]?.id ?? null);
    });
  }

  function cargarActivas() {
    if (!temporadaId) return;
    api.get(`/temporadas/categorias?temporada_id=${temporadaId}`).then(setCategoriasActivas);
  }

  useEffect(cargarTemporadas, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(cargarActivas, [temporadaId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.get('/categorias').then(setCategoriasCatalogo); }, []);

  async function eliminarActiva(id, nombre) {
    if (!confirm(`¿Desactivar "${nombre}" de esta temporada?`)) return;
    try {
      await api.delete(`/temporadas/categorias/${id}`);
      notificar('Categoría desactivada de la temporada', 'exito');
      cargarActivas();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  const temporadaActual = temporadas.find((t) => t.id === temporadaId);

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Temporadas</h1>
          <p>Crea la temporada, y luego activa dentro de ella las categorías que van a jugar.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => setModalTemporada(true)}>+ Nueva temporada</button>
      </div>

      <div className="panel-doble">
        <div className="tarjeta-lista">
          <div className="tarjeta-lista__cabecera"><h3>Temporadas</h3></div>
          {temporadas.length === 0 && <div className="vacio">No hay temporadas todavía.</div>}
          {temporadas.map((t) => (
            <div
              key={t.id}
              className={`item-lista ${t.id === temporadaId ? 'item-lista--activo' : ''}`}
              onClick={() => setTemporadaId(t.id)}
            >
              <span>{t.nombre}</span>
              {t.activa ? <span className="item-lista__grupo">activa</span> : null}
            </div>
          ))}
        </div>

        <div className="tarjeta-lista">
          <div className="tarjeta-lista__cabecera">
            <h3>{temporadaActual ? `Categorías activas en ${temporadaActual.nombre}` : 'Selecciona una temporada'}</h3>
            {temporadaActual && (
              <button className="boton boton--dorado boton--chico" onClick={() => setModalActivar(true)}>+ Activar categoría</button>
            )}
          </div>

          {!temporadaActual && <div className="vacio">Elige una temporada de la izquierda.</div>}
          {temporadaActual && categoriasActivas.length === 0 && <div className="vacio">Ninguna categoría activada todavía.</div>}

          {temporadaActual && categoriasActivas.map((c) => (
            <div key={c.id} className="item-lista">
              <span>{c.categoria_nombre} {c.copa_nombre && <span style={{ color: 'var(--color-ink-soft)' }}>— {c.copa_nombre}</span>}</span>
              <button className="boton boton--peligro" onClick={() => eliminarActiva(c.id, c.categoria_nombre)}>Quitar</button>
            </div>
          ))}
        </div>
      </div>

      <ModalNuevaTemporada
        abierto={modalTemporada}
        onCerrar={() => setModalTemporada(false)}
        onCreada={(t) => { setModalTemporada(false); cargarTemporadas(); setTemporadaId(t.id); notificar('Temporada creada', 'exito'); }}
      />

      {temporadaActual && (
        <ModalActivarCategoria
          abierto={modalActivar}
          onCerrar={() => setModalActivar(false)}
          temporadaId={temporadaActual.id}
          categorias={categoriasCatalogo.filter((c) => !categoriasActivas.find((a) => a.categoria_id === c.id))}
          onCreada={() => { setModalActivar(false); cargarActivas(); notificar('Categoría activada', 'exito'); }}
        />
      )}
    </div>
  );
}

function ModalNuevaTemporada({ abierto, onCerrar, onCreada }) {
  const { notificar } = useToast();
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [activa, setActiva] = useState(true);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const nueva = await api.post('/temporadas', { nombre, fecha_inicio: fechaInicio || null, activa });
      setNombre(''); setFechaInicio('');
      onCreada(nueva);
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Nueva temporada" abierto={abierto} onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Nombre</label>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Temporada 2026-2027" />
        </div>
        <div className="campo">
          <label>Fecha de inicio (opcional)</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div className="campo">
          <label>
            <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} style={{ marginRight: 6 }} />
            Marcar como temporada activa
          </label>
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Crear temporada'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalActivarCategoria({ abierto, onCerrar, temporadaId, categorias, onCreada }) {
  const { notificar } = useToast();
  const [categoriaId, setCategoriaId] = useState('');
  const [copa, setCopa] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/temporadas/categorias', {
        temporada_id: temporadaId,
        categoria_id: categoriaId,
        copa_nombre: copa || null,
      });
      setCategoriaId(''); setCopa('');
      onCreada();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Activar categoría en esta temporada" abierto={abierto} onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Categoría</label>
          <select required value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Selecciona…</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {categorias.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 4 }}>
              Todas las categorías del catálogo ya están activas en esta temporada, o no has creado ninguna todavía en "Categorías".
            </p>
          )}
        </div>
        <div className="campo">
          <label>Nombre de la copa (opcional)</label>
          <input value={copa} onChange={(e) => setCopa(e.target.value)} placeholder="Copa Rafael Alejandro Torrealba" />
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando || !categoriaId}>
            {enviando ? 'Guardando…' : 'Activar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
