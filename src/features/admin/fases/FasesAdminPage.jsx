import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

const FASES = [
  { clave: 'concentrado', nombre: 'Concentrado', anterior: 'eliminatoria', usaGrupos: true },
  { clave: 'semifinal', nombre: 'Semifinal', anterior: 'concentrado', usaGrupos: false },
  { clave: 'final', nombre: 'Final', anterior: 'semifinal', usaGrupos: false },
];

export default function FasesAdminPage() {
  const { notificar } = useToast();
  const {
    temporadas, categorias, temporadaId, setTemporadaId,
    temporadaCategoriaId, setTemporadaCategoriaId,
  } = useTemporadaCategoria();

  const [fase, setFase] = useState('concentrado');
  const [inscritos, setInscritos] = useState([]);
  const [sel, setSel] = useState({});          // { equipo_inscrito_id: grupo ('' si no usa grupo) }
  const [cantidad, setCantidad] = useState(4);
  const [guardando, setGuardando] = useState(false);

  const cfg = FASES.find((f) => f.clave === fase);

  function cargar() {
    if (!temporadaCategoriaId) return;
    Promise.all([
      api.get(`/fases/equipos?temporada_categoria_id=${temporadaCategoriaId}&fase=eliminatoria`),
      api.get(`/fases/equipos?temporada_categoria_id=${temporadaCategoriaId}&fase=${fase}`),
    ]).then(([todos, actuales]) => {
      setInscritos(todos);
      const m = {};
      actuales.forEach((e) => { m[Number(e.equipo_inscrito_id)] = e.grupo || ''; });
      setSel(m);
    });
  }
  useEffect(cargar, [temporadaCategoriaId, fase]); // eslint-disable-line react-hooks/exhaustive-deps

  function alternar(id) {
    setSel((prev) => {
      const nuevo = { ...prev };
      if (id in nuevo) delete nuevo[id]; else nuevo[id] = '';
      return nuevo;
    });
  }

  function cambiarGrupo(id, valor) {
    setSel((prev) => ({ ...prev, [id]: valor.toUpperCase().slice(0, 3) }));
  }

  // Preselecciona los N mejores de cada grupo de la fase anterior (se puede ajustar a mano).
  async function sugerir() {
    try {
      const filas = await api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}&fase=${cfg.anterior}`);
      const porGrupo = {};
      filas.forEach((f) => { const g = f.grupo || ''; (porGrupo[g] = porGrupo[g] || []).push(f); });
      const nuevo = {};
      Object.values(porGrupo).forEach((lista) => {
        lista.slice(0, Number(cantidad) || 0).forEach((f) => { nuevo[Number(f.equipo_inscrito_id)] = cfg.usaGrupos ? (f.grupo || '') : ''; });
      });
      setSel(nuevo);
      notificar(`Se preseleccionaron ${Object.keys(nuevo).length} equipos. Revisa y guarda.`, 'exito');
    } catch (err) { notificar(err.message, 'error'); }
  }

  async function guardar() {
    setGuardando(true);
    try {
      const equipos = Object.entries(sel).map(([id, grupo]) => ({ equipo_inscrito_id: Number(id), grupo: grupo || null }));
      if (cfg.usaGrupos && equipos.some((e) => !e.grupo)) {
        notificar('Indica el grupo (A, B…) de cada equipo del concentrado', 'error');
        setGuardando(false);
        return;
      }
      await api.put(`/fases/${fase}/equipos`, { temporada_categoria_id: Number(temporadaCategoriaId), equipos });
      notificar(`Fase ${cfg.nombre} guardada (${equipos.length} equipos)`, 'exito');
      cargar();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="admin__cabecera">
        <div>
          <h1>Fases del torneo</h1>
          <p>Define qué equipos juegan el concentrado, la semifinal y la final. Cada fase tiene su propia tabla de posiciones, que arranca en cero.</p>
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
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FASES.map((f) => (
          <button key={f.clave} className={`boton ${fase === f.clave ? 'boton--dorado' : 'boton--fantasma'}`}
            onClick={() => setFase(f.clave)}>{f.nombre}</button>
        ))}
      </div>

      <div className="campo--fila" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
        <div className="campo">
          <label>Preseleccionar los primeros de cada grupo de «{cfg.anterior}»</label>
          <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} style={{ maxWidth: 90 }} />
        </div>
        <button className="boton boton--fantasma" onClick={sugerir}>Sugerir equipos</button>
      </div>

      {inscritos.length === 0 && <div className="vacio">Esta categoría no tiene equipos inscritos.</div>}
      {inscritos.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th>Juega</th>
              <th style={{ textAlign: 'left' }}>Equipo</th>
              <th>Grupo en eliminatoria</th>
              {cfg.usaGrupos && <th>Grupo en {cfg.nombre} (A, B…)</th>}
            </tr>
          </thead>
          <tbody>
            {inscritos.map((e) => {
              const id = Number(e.equipo_inscrito_id);
              const marcado = id in sel;
              return (
                <tr key={id}>
                  <td><input type="checkbox" checked={marcado} onChange={() => alternar(id)} /></td>
                  <td style={{ textAlign: 'left', fontFamily: 'var(--font-body)' }}>{e.nombre}</td>
                  <td>{e.grupo || '—'}</td>
                  {cfg.usaGrupos && (
                    <td>
                      <input disabled={!marcado} value={sel[id] || ''} onChange={(ev) => cambiarGrupo(id, ev.target.value)}
                        style={{ width: 60, textAlign: 'center' }} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="formulario__acciones" style={{ marginTop: 16 }}>
        <button className="boton boton--primario" disabled={guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : `Guardar ${cfg.nombre} (${Object.keys(sel).length} equipos)`}
        </button>
      </div>
    </div>
  );
}
