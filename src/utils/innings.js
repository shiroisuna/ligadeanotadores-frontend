// Innings en notación de béisbol: se guardan en decimal (tercios) y se
// muestran SIEMPRE como fracción.
//   0,33 → 1/3    0,67 → 2/3    1,33 → 1 1/3    3,67 → 3 2/3    3 → 3

const FRACCIONES = [
  { valor: 0, texto: '' },
  { valor: 1 / 3, texto: '1/3' },
  { valor: 1 / 2, texto: '1/2' },
  { valor: 2 / 3, texto: '2/3' },
  { valor: 1, texto: '' }, // 0,99 → se lleva al entero siguiente
];

// Número (o texto con coma) → "3 2/3"
export function formatInnings(valor, vacio = '—') {
  if (valor === null || valor === undefined || valor === '') return vacio;
  const num = Number(String(valor).replace(',', '.'));
  if (Number.isNaN(num)) return vacio;

  let entero = Math.floor(num);
  const frac = num - entero;
  let mejor = FRACCIONES[0];
  for (const f of FRACCIONES) {
    if (Math.abs(frac - f.valor) < Math.abs(frac - mejor.valor)) mejor = f;
  }
  if (mejor.valor === 1) entero += 1;
  if (!mejor.texto) return `${entero}`;
  return entero > 0 ? `${entero} ${mejor.texto}` : mejor.texto;
}

// Texto que escribe el usuario → decimal en tercios (o null si no es válido).
// Acepta: "0,33", "0.67", "3,67", "1 1/3", "2/3", "3", y también la
// notación de anotador "3.1" (= 3 1/3) y "3.2" (= 3 2/3).
export function parseInnings(texto) {
  const t = String(texto ?? '').trim().replace(',', '.');
  if (t === '') return 0;

  const fraccion = t.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (fraccion) {
    const entero = Number(fraccion[1] || 0);
    const den = Number(fraccion[3]);
    if (!den) return null;
    return redondear(entero + Number(fraccion[2]) / den);
  }

  const decimal = t.match(/^(\d*)(?:\.(\d*))?$/);
  if (!decimal) return null;
  const entero = Number(decimal[1] || 0);
  const dec = decimal[2] || '';
  if (dec === '' || /^0+$/.test(dec)) return entero;
  if (dec === '1') return redondear(entero + 1 / 3); // 3.1 → 3 1/3
  if (dec === '2') return redondear(entero + 2 / 3); // 3.2 → 3 2/3
  return redondear(entero + Number(`0.${dec}`));
}

// Lleva al tercio (o medio) más cercano con 2 decimales: 0.33, 0.5, 0.67
function redondear(n) {
  const entero = Math.floor(n);
  const frac = n - entero;
  let mejor = FRACCIONES[0];
  for (const f of FRACCIONES) {
    if (Math.abs(frac - f.valor) < Math.abs(frac - mejor.valor)) mejor = f;
  }
  return Math.round((entero + mejor.valor) * 100) / 100;
}
