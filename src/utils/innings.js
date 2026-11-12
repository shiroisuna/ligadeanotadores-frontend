// Muestra innings con fracción: 6.33 -> "6 1/3", 6.67 -> "6 2/3", 0.67 -> "2/3", 7 -> "7".
// Úsalo para IL, IJ, IJO, IJD y cualquier columna de innings.
export const KEYS_INNINGS = ['il', 'ij', 'ijo', 'ijd', 'innings_lanzados'];

export function formatInnings(valor) {
  const n = Number(valor);
  if (valor === null || valor === undefined || valor === '' || Number.isNaN(n)) return '0';
  const ent = Math.floor(n + 1e-6);
  const frac = n - ent;
  const F = [{ v: 0, t: '' }, { v: 1 / 3, t: '1/3' }, { v: 1 / 2, t: '1/2' }, { v: 2 / 3, t: '2/3' }, { v: 1, t: '+1' }];
  let mejor = F[0], dif = Math.abs(frac);
  for (const f of F) { const d = Math.abs(frac - f.v); if (d < dif) { mejor = f; dif = d; } }
  if (mejor.t === '+1') return String(ent + 1);
  if (!mejor.t) return String(ent);
  return ent > 0 ? `${ent} ${mejor.t}` : mejor.t;
}
