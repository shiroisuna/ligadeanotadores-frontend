import { useEffect, useState } from 'react';
import { formatInnings, parseInnings } from '../utils/innings';

// Campo para cargar innings (IL, IJ). Se escribe como el anotador quiera
// (0,33 · 0,67 · 3,67 · 1 1/3 · 3.2) y siempre se ve como fracción.
// onChange recibe el número decimal (ej. 3.67).
export function InputInnings({ value, onChange, style, ...props }) {
  const [texto, setTexto] = useState(() => formatInnings(value, ''));
  const [editando, setEditando] = useState(false);

  // Si el valor cambia desde afuera (al cargar el juego), refrescar
  useEffect(() => {
    if (!editando) setTexto(formatInnings(value, ''));
  }, [value, editando]);

  function alCambiar(e) {
    const v = e.target.value;
    if (!/^[\d\s.,/]*$/.test(v)) return;
    setTexto(v);
    const n = parseInnings(v);
    if (n !== null) onChange(n);
  }

  function alSalir() {
    setEditando(false);
    const n = parseInnings(texto);
    setTexto(formatInnings(n ?? value, ''));
  }

  const invalido = editando && parseInnings(texto) === null;

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      onFocus={(e) => { setEditando(true); e.target.select(); }}
      onChange={alCambiar}
      onBlur={alSalir}
      title="Innings: escribe 0,33 · 0,67 · 1 1/3 · 3.2 — se muestra como fracción"
      style={{ ...style, ...(invalido ? { borderColor: 'var(--color-loss, #c0392b)' } : null) }}
      {...props}
    />
  );
}
