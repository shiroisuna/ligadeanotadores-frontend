import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';

export default function CategoriasAdminPage() {
  const { notificar } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState(null);

  function cargar() {
    api.get('/categorias').then(setCategorias);
    api.get('/disciplinas').then(setDisciplinas);
  }

  useEffect(cargar, []);

  async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Esto falla si ya tiene temporadas o equipos asociados.`)) return;
    try {
      await api.delete(`/categorias/${id}`);
      notificar('Categoría eliminada', 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Categorías</h1>
          <p>El catálogo de categorías/ligas (Infantil AA, Softbol Dos Lagunas, etc.) que luego se activan por temporada.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => setModalAbierto(true)}>+ Nueva categoría</button>
      </div>

      {categorias.length === 0 && <div className="vacio">No hay categorías creadas todavía.</div>}

      {categorias.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nombre</th>
              <th style={{ textAlign: 'left' }}>Disciplina</th>
              <th>Lleva pitcheo</th>
              <th style={{ textAlign: 'left' }}>Nivel de posiciones</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{c.nombre}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{c.disciplina}</td>
                <td>{c.lleva_pitcheo ? 'Sí' : 'No'}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{c.nivel_standings}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="boton boton--fantasma boton--chico" onClick={() => setCategoriaEditar(c)}>Editar</button>
                  <button className="boton boton--peligro" onClick={() => eliminar(c.id, c.nombre)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModalNuevaCategoria
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        disciplinas={disciplinas}
        onDisciplinaCreada={(d) => setDisciplinas((prev) => [...prev, d])}
        onCreada={() => { setModalAbierto(false); cargar(); notificar('Categoría creada', 'exito'); }}
      />

      {categoriaEditar && (
        <ModalEditarCategoria
          categoria={categoriaEditar}
          disciplinas={disciplinas}
          onCerrar={() => setCategoriaEditar(null)}
          onGuardada={() => { setCategoriaEditar(null); cargar(); notificar('Categoría actualizada', 'exito'); }}
        />
      )}
    </div>
  );
}

function ModalEditarCategoria({ categoria, disciplinas, onCerrar, onGuardada }) {
  const { notificar } = useToast();
  const [form, setForm] = useState({
    disciplina_id: categoria.disciplina_id,
    nombre: categoria.nombre,
    lleva_pitcheo: categoria.lleva_pitcheo,
    nivel_standings: categoria.nivel_standings,
    orden_visual: categoria.orden_visual || 0,
  });
  const [enviando, setEnviando] = useState(false);

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.put(`/categorias/${categoria.id}`, form);
      onGuardada();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Editar — ${categoria.nombre}`} abierto onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Disciplina</label>
          <select value={form.disciplina_id} onChange={(e) => set('disciplina_id', e.target.value)}>
            {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Nombre de la categoría</label>
          <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>¿Lleva pitcheo?</label>
            <select value={form.lleva_pitcheo ? '1' : '0'} onChange={(e) => set('lleva_pitcheo', e.target.value === '1')}>
              <option value="1">Sí</option>
              <option value="0">No (softbol / béisbol menor)</option>
            </select>
          </div>
          <div className="campo">
            <label>Nivel de tabla de posiciones</label>
            <select value={form.nivel_standings} onChange={(e) => set('nivel_standings', e.target.value)}>
              <option value="basico">Básico</option>
              <option value="avanzado">Avanzado (muestra IJO/MEDIA1/IJD/MEDIA2/BCE)</option>
            </select>
          </div>
        </div>
        <div className="campo">
          <label>Orden en el menú</label>
          <input type="number" value={form.orden_visual} onChange={(e) => set('orden_visual', Number(e.target.value))} style={{ width: 100 }} />
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalNuevaCategoria({ abierto, onCerrar, disciplinas, onDisciplinaCreada, onCreado, onCreada }) {
  const { notificar } = useToast();
  const [disciplinaId, setDisciplinaId] = useState('');
  const [disciplinaNueva, setDisciplinaNueva] = useState('');
  const [nombre, setNombre] = useState('');
  const [llevaPitcheo, setLlevaPitcheo] = useState(true);
  const [nivel, setNivel] = useState('basico');
  const [orden, setOrden] = useState(0);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      let idDisciplina = disciplinaId;
      if (!idDisciplina && disciplinaNueva) {
        const nueva = await api.post('/disciplinas', { nombre: disciplinaNueva });
        idDisciplina = nueva.id;
        onDisciplinaCreada(nueva);
      }
      await api.post('/categorias', {
        disciplina_id: idDisciplina,
        nombre,
        lleva_pitcheo: llevaPitcheo,
        nivel_standings: nivel,
        orden_visual: Number(orden) || 0,
      });
      setNombre(''); setDisciplinaNueva(''); setOrden(0);
      onCreada();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Nueva categoría" abierto={abierto} onCerrar={onCerrar}>
      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Disciplina</label>
          <select value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
            <option value="">— Crear una nueva abajo —</option>
            {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>

        {!disciplinaId && (
          <div className="campo">
            <label>Nombre de la disciplina nueva</label>
            <input value={disciplinaNueva} onChange={(e) => setDisciplinaNueva(e.target.value)} placeholder="Béisbol, Softbol…" />
          </div>
        )}

        <div className="campo">
          <label>Nombre de la categoría</label>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Infantil AA" />
        </div>

        <div className="campo--fila">
          <div className="campo">
            <label>¿Lleva pitcheo?</label>
            <select value={llevaPitcheo ? '1' : '0'} onChange={(e) => setLlevaPitcheo(e.target.value === '1')}>
              <option value="1">Sí</option>
              <option value="0">No (softbol / béisbol menor)</option>
            </select>
          </div>
          <div className="campo">
            <label>Nivel de tabla de posiciones</label>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
              <option value="basico">Básico</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>
        </div>

        <div className="campo">
          <label>Orden en el menú (opcional)</label>
          <input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} style={{ width: 100 }} />
        </div>

        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Crear categoría'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
