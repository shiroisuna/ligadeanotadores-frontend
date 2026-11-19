import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useToast } from '../../../components/Toast';
import { useTemporadaCategoria } from '../../../hooks/useTemporadaCategoria';

const FASES = [
  { clave: 'concentrado', nombre: 'Concentrado', usaGrupos: true },
  { clave: 'semifinal', nombre: 'Semifinal', usaGrupos: false },
  { clave: 'final', nombre: 'Final', usaGrupos: false },
];

// Etiquetas de los dos grupos del concentrado (Art. 10 del reglamento los llama Grupo 1 y Grupo 2).
const GRUPO_CONC_1 = 'A';
const GRUPO_CONC_2 = 'B';

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
  const [fasesConfig, setFasesConfig] = useState([]);   // fases que ya tienen equipos
  const [guardando, setGuardando] = useState(false);

  const cfg = FASES.find((f) => f.clave === fase);

  // Fase de la que se toman los clasificados: la semifinal viene del concentrado si existe;
  // en categorías de un solo grupo (sin concentrado) viene directo de la ronda eliminatoria.
  const anterior = fase === 'concentrado' ? 'eliminatoria'
    : fase === 'semifinal' ? (fasesConfig.includes('concentrado') ? 'concentrado' : 'eliminatoria')
    : 'semifinal';
  const cantidadSugerida = fase === 'concentrado' ? 4
    : fase === 'semifinal' ? (anterior === 'concentrado' ? 2 : 4) : 2;
  useEffect(() => { setCantidad(cantidadSugerida); }, [fase, anterior]); // eslint-disable-line react-hooks/exhaustive-deps

  function cargar() {
    if (!temporadaCategoriaId) return;
    api.get(`/fases?temporada_categoria_id=${temporadaCategoriaId}`)
      .then((l) => setFasesConfig(l.map((x) => x.fase))).catch(() => setFasesConfig([]));
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
      const filas = await api.get(`/posiciones?temporada_categoria_id=${temporadaCategoriaId}&fase=${anterior}`);
      const porGrupo = {};
      filas.forEach((f) => { const g = f.grupo || ''; (porGrupo[g] = porGrupo[g] || []).push(f); });
      const nombresGrupo = Object.keys(porGrupo).sort();
      const N = Number(cantidad) || 0;
      const nuevo = {};
      nombresGrupo.forEach((g, gi) => {
        porGrupo[g].slice(0, N).forEach((f, i) => {
          const pos = i + 1;
          let grupoConcentrado = '';
          if (fase === 'concentrado') {
            if (nombresGrupo.length === 2) {
              // Reglamento Art. 10: Grupo 1 = 1ºA, 2ºB, 3ºA, 4ºB · Grupo 2 = 1ºB, 2ºA, 3ºB, 4ºA
              const impar = pos % 2 === 1;
              const primeroGrupo = gi === 0;
              grupoConcentrado = (impar === primeroGrupo) ? GRUPO_CONC_1 : GRUPO_CONC_2;
            } else {
              grupoConcentrado = f.grupo || '';
            }
          }
          nuevo[Number(f.equipo_inscrito_id)] = grupoConcentrado;
        });
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
          <label>Preseleccionar los primeros de cada grupo de «{anterior}»</label>
          <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} style={{ maxWidth: 90 }} />
        </div>
        <button className="boton boton--fantasma" onClick={sugerir}>Sugerir equipos</button>
        {fase === 'concentrado' && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-ink-soft)' }}>
            Arma el concentrado cruzado según el reglamento: Grupo {GRUPO_CONC_1} = 1ºA, 2ºB, 3ºA, 4ºB · Grupo {GRUPO_CONC_2} = 1ºB, 2ºA, 3ºB, 4ºA.
          </span>
        )}
      </div>

      {inscritos.length === 0 && <div className="vacio">Esta categoría no tiene equipos inscritos.</div>}
      {inscritos.length > 0 && (
        <table className="tabla" style={{ background: '#fff' }}>
          <thead>
            <tr>
              <th>Juega</th>
              <th style={{ textAlign: 'left' }}>Equipo</th>
              <th>Grupo en eliminatoria</th>
              {cfg.usaGrupos && <th>Grupo en {cfg.nombre}</th>}
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
