import { useEffect, useState } from 'react';
import { api } from '../../../api/client';

export default function NosotrosPage() {
  const [c, setC] = useState(null);
  useEffect(() => { api.get('/contenido').then(setC); }, []);

  return (
    <main className="contenedor" style={{ padding: '1.5rem 1rem', maxWidth: 780 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Nosotros</h1>

      {!c && <div className="vacio">Cargando…</div>}

      {c && (
        <>
          {(c.vision || c.mision) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {c.vision && (
                <div className="card" style={{ padding: '1rem' }}>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--blue-txt)', marginBottom: '0.5rem' }}>Visión</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--txt-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.vision}</p>
                </div>
              )}
              {c.mision && (
                <div className="card" style={{ padding: '1rem' }}>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--blue-txt)', marginBottom: '0.5rem' }}>Misión</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--txt-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.mision}</p>
                </div>
              )}
            </div>
          )}

          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Contacto</h2>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              ['Dirección', c.contacto_direccion],
              ['Teléfono', c.contacto_telefono],
              ['Correo', c.contacto_email, `mailto:${c.contacto_email}`],
              ['WhatsApp', c.contacto_whatsapp, `https://wa.me/${(c.contacto_whatsapp||'').replace(/\D/g,'')}`],
              ['Facebook', c.contacto_facebook, c.contacto_facebook],
              ['Instagram', c.contacto_instagram, c.contacto_instagram],
            ].filter(([, v]) => v).map(([label, val, href]) => (
              <div key={label} style={{ fontSize: '0.85rem', color: 'var(--txt-2)' }}>
                <strong style={{ color: 'var(--txt-3)' }}>{label}:</strong>{' '}
                {href ? <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-txt)' }}>{val}</a> : val}
              </div>
            ))}
            {!c.contacto_direccion && !c.contacto_telefono && !c.contacto_email && (
              <div className="vacio">Sin datos de contacto todavía.</div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
