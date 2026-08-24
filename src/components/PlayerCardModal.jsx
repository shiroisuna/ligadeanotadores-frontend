import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { TeamBadge } from './TeamBadge';
import { useToast } from './Toast';
import { api } from '../api/client';

export function PlayerCardModal({ abierto, onCerrar }) {
  const { notificar } = useToast();
  const [equipos, setEquipos] = useState([]);
  const [equipoElegido, setEquipoElegido] = useState(null);
  const [stats, setStats] = useState(null);
  const [contacto, setContacto] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [estadoPago, setEstadoPago] = useState(null);
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false);

  function cargarEstadoPago() {
    api.getAuth('/pagos/mi-estado').then(setEstadoPago);
  }

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    setMostrarFormularioPago(false);
    cargarEstadoPago();
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

  const pagado = estadoPago?.pagado ?? true; // mientras carga, no bloquear de golpe

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

            {/* ---- Contenido protegido por la mensualidad ---- */}
            <div style={{ position: 'relative' }}>
              <div className={pagado ? '' : 'tarjeta-jugador__borroso'}>
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

              {!pagado && !mostrarFormularioPago && (
                <div className="tarjeta-jugador__candado">
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, margin: 0, textAlign: 'center', maxWidth: 220 }}>
                    Debes registrar el pago de tu mensualidad ({estadoPago?.periodo}) para ver tu ficha.
                  </p>
                  <button className="boton boton--dorado" onClick={() => setMostrarFormularioPago(true)}>
                    Registrar pago
                  </button>
                </div>
              )}
            </div>
          </div>

          {!pagado && mostrarFormularioPago && (
            <FormularioPago
              estadoPago={estadoPago}
              onCancelar={() => setMostrarFormularioPago(false)}
              onRegistrado={() => {
                setMostrarFormularioPago(false);
                cargarEstadoPago();
                notificar('Pago registrado — tu ficha ya está visible', 'exito');
              }}
            />
          )}
        </>
      )}
    </Modal>
  );
}

function FormularioPago({ estadoPago, onCancelar, onRegistrado }) {
  const { notificar } = useToast();
  const [verDatos, setVerDatos] = useState(false);
  const [referencia, setReferencia] = useState('');
  const [telefonoOrigen, setTelefonoOrigen] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [enviando, setEnviando] = useState(false);

  const pm = estadoPago?.pago_movil;

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/pagos', { referencia, telefono_origen: telefonoOrigen, fecha_pago: fechaPago });
      onRegistrado();
    } catch (err) {
      notificar(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-line)', paddingTop: 'var(--space-4)' }}>
      <button
        type="button"
        className="boton boton--fantasma"
        style={{ marginBottom: 'var(--space-3)' }}
        onClick={() => setVerDatos((v) => !v)}
      >
        {verDatos ? 'Ocultar' : '👁 Ver'} datos de pago móvil
      </button>

      {verDatos && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, background: 'var(--color-chalk)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {pm?.monto && <div><strong>Monto:</strong> {pm.monto}</div>}
          {pm?.banco && <div><strong>Banco:</strong> {pm.banco}</div>}
          {pm?.cedula && <div><strong>Cédula/RIF:</strong> {pm.cedula}</div>}
          {pm?.telefono && <div><strong>Teléfono:</strong> {pm.telefono}</div>}
          {!pm?.banco && !pm?.telefono && (
            <span style={{ color: 'var(--color-ink-soft)' }}>El administrador todavía no ha cargado los datos de pago móvil.</span>
          )}
        </div>
      )}

      <form onSubmit={alEnviar}>
        <div className="campo">
          <label>Número de referencia</label>
          <input required value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </div>
        <div className="campo">
          <label>Teléfono desde el que pagaste</label>
          <input required value={telefonoOrigen} onChange={(e) => setTelefonoOrigen(e.target.value)} placeholder="0412-1234567" />
        </div>
        <div className="campo">
          <label>Fecha del pago</label>
          <input required type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
        </div>
        <div className="formulario__acciones">
          <button type="button" className="boton boton--fantasma" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar pago'}
          </button>
        </div>
      </form>
    </div>
  );
}
