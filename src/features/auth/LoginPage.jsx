import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const usuario = await login(email, password);
      navigate(usuario.rol === 'administrador' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-field)',
    }}>
      <form
        onSubmit={alEnviar}
        style={{
          background: 'var(--color-chalk)',
          padding: 'var(--space-7)',
          borderRadius: 'var(--radius-md)',
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <img
          src="/logo-labsmi.jpg"
          alt="LABSMI"
          style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto', display: 'block' }}
        />
        <h1 style={{ fontSize: 22, textAlign: 'center' }}>Liga de Anotadores</h1>
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-body)' }}>
          Municipio Independencia
        </p>

        <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.06em' }}>
          CORREO
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.06em' }}>
          CONTRASEÑA
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {error && <p style={{ color: 'var(--color-loss)', fontFamily: 'var(--font-body)', fontSize: 14, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          style={{
            background: 'var(--color-amber)',
            border: 'none',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 'var(--space-1)',
  padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--color-line)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
};
