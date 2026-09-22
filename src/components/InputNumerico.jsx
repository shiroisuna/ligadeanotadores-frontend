// Input de texto que solo permite escribir números (sin las flechitas
// molestas de type="number", que hacen perder tiempo al cargar mucha
// data rápido). Usa permitirDecimales={true} para campos como IL/IJ.
export function InputNumerico({ value, onChange, permitirDecimales = false, ...props }) {
  function alCambiar(e) {
    const v = e.target.value;
    const patron = permitirDecimales ? /^\d*\.?\d*$/ : /^\d*$/;
    if (v === '' || patron.test(v)) {
      onChange(v);
    }
  }

  return (
    <input
      type="text"
      inputMode={permitirDecimales ? 'decimal' : 'numeric'}
      value={value}
      onChange={alCambiar}
      {...props}
    />
  );
}