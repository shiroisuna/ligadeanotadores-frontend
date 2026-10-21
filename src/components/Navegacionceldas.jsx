// Navegación con teclado estilo Excel para las tablas de carga.
// Uso: <div onKeyDown={navegarConFlechas}> ...<table>... </div>
//   ← → ↑ ↓  mueven el foco a la celda vecina (y seleccionan su contenido)
//   Enter     baja a la celda de abajo
// En los <select> (jugador / posición) ↑ ↓ siguen cambiando la opción,
// y ← → saltan a la celda vecina.
const TECLAS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];

function control(celda) {
  if (!celda) return null;
  const c = celda.querySelector('input:not([disabled]), select:not([disabled])');
  return c || null;
}

function enfocar(el) {
  el.focus();
  if (el.tagName === 'INPUT' && typeof el.select === 'function') el.select();
}

export function navegarConFlechas(e) {
  if (!TECLAS.includes(e.key)) return;
  const el = e.target;
  const esInput = el instanceof HTMLInputElement;
  const esSelect = el instanceof HTMLSelectElement;
  if (!esInput && !esSelect) return;
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

  const td = el.closest('td');
  const tr = td && td.parentElement;
  if (!td || !tr) return;

  if (esSelect && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter')) return;

  const colIdx = Array.from(tr.children).indexOf(td);
  let destino = null;

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const paso = e.key === 'ArrowRight' ? 1 : -1;
    for (let i = colIdx + paso; i >= 0 && i < tr.children.length; i += paso) {
      const c = control(tr.children[i]);
      if (c) { destino = c; break; }
    }
  } else {
    const paso = e.key === 'ArrowUp' ? -1 : 1; // Enter baja
    let fila = paso === 1 ? tr.nextElementSibling : tr.previousElementSibling;
    while (fila) {
      const c = control(fila.children[colIdx]);
      if (c) { destino = c; break; }
      fila = paso === 1 ? fila.nextElementSibling : fila.previousElementSibling;
    }
  }

  if (destino) {
    e.preventDefault();
    enfocar(destino);
  }
}