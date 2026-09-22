import { useEffect, useState } from 'react';
import { Marcador } from '../../../components/Marcador';
import { api } from '../../../api/client';

export default function NosotrosPage() {
  const [c, setC] = useState(null);
  useEffect(() => { api.get('/contenido').then(setC); }, []);

  return (
    <div>
      <Marcador />
      <main className="contenedor" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-8)', maxWidth: 780 }}>
        <h1 style={{ fontSize: 28, marginBottom: 'var(--space-6)' }}>Nosotros</h1>
        {!c && <div className="vacio">Cargando…</div>}
        {c && (
          <>
            {(c.vision || c.mision) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                {c.vision && (
                  <div className="tarjeta-lista" style={{ padding: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 14, marginBottom: 8, color: 'var(--color-field)' }}>Visión</h2>
                    <p style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6, fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.vision}</p>
                  </div>
                )}
                {c.mision && (
                  <div className="tarjeta-lista" style={{ padding: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 14, marginBottom: 8, color: 'var(--color-field)' }}>Misión</h2>
                    <p style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6, fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.mision}</p>
                  </div>
                )}
              </div>
            )}
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-4)' }}>Contacto</h2>
            <div className="tarjeta-lista" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              {c.contacto_direccion && <div><strong>Dirección:</strong> {c.contacto_direccion}</div>}
              {c.contacto_telefono && <div><strong>Teléfono:</strong> {c.contacto_telefono}</div>}
              {c.contacto_email && <div><strong>Correo:</strong> <a href={`mailto:${c.contacto_email}`} style={{ color: 'var(--blue-txt)' }}>{c.contacto_email}</a></div>}
              {c.contacto_whatsapp && <div><strong>WhatsApp:</strong> <a href={`https://wa.me/${c.contacto_whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-txt)' }}>{c.contacto_whatsapp}</a></div>}
              {c.contacto_facebook && <div><strong>Facebook:</strong> <a href={c.contacto_facebook} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-txt)' }}>{c.contacto_facebook}</a></div>}
              {c.contacto_instagram && <div><strong>Instagram:</strong> <a href={c.contacto_instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-txt)' }}>{c.contacto_instagram}</a></div>}
              {!c.contacto_direccion && !c.contacto_telefono && !c.contacto_email && <div className="vacio">Sin datos de contacto todavía.</div>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
