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
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
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
          <p>Catálogo de categorías/ligas. Define si lleva pitcheo, nivel de posiciones e innings por juego.</p>
        </div>
        <button className="boton boton--dorado" onClick={() => setModalAbierto(true)}>+ Nueva categoría</button>
      </div>

      {categorias.length === 0 && <div className="vacio">Sin categorías todavía.</div>}

      {categorias.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nombre</th>
              <th style={{ textAlign: 'left' }}>Disciplina</th>
              <th>Pitcheo</th>
              <th>Innings</th>
              <th style={{ textAlign: 'left' }}>Nivel pos.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id}>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{c.nombre}</td>
                <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{c.disciplina}</td>
                <td>{c.lleva_pitcheo ? 'Sí' : 'No'}</td>
                <td>{c.num_innings || 7}</td>
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

      <ModalCategoria
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        disciplinas={disciplinas}
        onDisciplinaCreada={(d) => setDisciplinas((p) => [...p, d])}
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

function FormCategoria({ form, setForm, disciplinas, onDisciplinaCreada, onSubmit, enviando, onCerrar, titulo }) {
  const { notificar } = useToast();
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function crearDisciplina() {
    const nombre = prompt('Nombre de la nueva disciplina:');
    if (!nombre) return;
    try {
      const nueva = await api.post('/disciplinas', { nombre });
      onDisciplinaCreada?.(nueva);
      set('disciplina_id', nueva.id);
    } catch (err) {
      notificar(err.message, 'error');
    }
  }

  return (
    <Modal titulo={titulo} abierto onCerrar={onCerrar}>
      <form onSubmit={onSubmit}>
        <div className="campo">
          <label>Disciplina</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={form.disciplina_id || ''} onChange={(e) => set('disciplina_id', e.target.value)} style={{ flex: 1 }}>
              <option value="">Selecciona…</option>
              {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
            <button type="button" className="boton boton--fantasma boton--chico" onClick={crearDisciplina}>+ Nueva</button>
          </div>
        </div>
        <div className="campo">
          <label>Nombre</label>
          <input required value={form.nombre || ''} onChange={(e) => set('nombre', e.target.value)} placeholder="Infantil AA" />
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>¿Lleva pitcheo?</label>
            <select value={form.lleva_pitcheo ? '1' : '0'} onChange={(e) => set('lleva_pitcheo', e.target.value === '1')}>
              <option value="1">Sí</option>
              <option value="0">No (softbol / menor sin pitcheo)</option>
            </select>
          </div>
          <div className="campo">
            <label>Innings por juego</label>
            <input type="number" min={1} max={12} value={form.num_innings || 7}
              onChange={(e) => set('num_innings', Number(e.target.value))} />
          </div>
        </div>
        <div className="campo--fila">
          <div className="campo">
            <label>Nivel tabla de posiciones</label>
            <select value={form.nivel_standings || 'basico'} onChange={(e) => set('nivel_standings', e.target.value)}>
              <option value="basico">Básico</option>
              <option value="avanzado">Avanzado (IJO/MEDIA1/IJD/MEDIA2/BCE)</option>
            </select>
          </div>
          <div className="campo">
            <label>Orden visual</label>
            <input type="number" value={form.orden_visual || 0} onChange={(e) => set('orden_visual', Number(e.target.value))} />
          </div>
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalCategoria({ abierto, onCerrar, disciplinas, onDisciplinaCreada, onCreada }) {
  const { notificar } = useToast();
  const [form, setForm] = useState({ lleva_pitcheo: true, nivel_standings: 'basico', num_innings: 7 });
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/categorias', form);
      setForm({ lleva_pitcheo: true, nivel_standings: 'basico', num_innings: 7 });
      onCreada();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) return null;
  return <FormCategoria titulo="Nueva categoría" form={form} setForm={setForm}
    disciplinas={disciplinas} onDisciplinaCreada={onDisciplinaCreada}
    onSubmit={alEnviar} enviando={enviando} onCerrar={onCerrar} />;
}

function ModalEditarCategoria({ categoria, disciplinas, onCerrar, onGuardada }) {
  const { notificar } = useToast();
  const [form, setForm] = useState({ ...categoria, disciplina_id: categoria.disciplina_id });
  const [enviando, setEnviando] = useState(false);

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

  return <FormCategoria titulo={`Editar — ${categoria.nombre}`} form={form} setForm={setForm}
    disciplinas={disciplinas} onSubmit={alEnviar} enviando={enviando} onCerrar={onCerrar} />;
}
