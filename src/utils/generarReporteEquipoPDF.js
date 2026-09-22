import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MORADO = [90, 30, 143];   // encabezados de tabla
const DORADO = [230, 180, 20];  // acentos de texto

function fmt3(v) { return Number(v || 0).toFixed(3); }
function fmt2(v) { return Number(v || 0).toFixed(2); }

// datos = { nombreLiga, equipo, categoria, temporadaNombre, posiciones, bateo, pitcheo, fildeo, llevaPitcheo }
export function generarReporteEquipoPDF(datos) {
  const {
    nombreLiga = 'Liga de Anotadores', equipo, categoria, temporadaNombre,
    posiciones = [], bateo = [], pitcheo = [], fildeo = [], llevaPitcheo,
  } = datos;

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const fecha = new Date().toLocaleString('es-VE');
  const anchoPagina = doc.internal.pageSize.getWidth();

  function cabecera(pagina) {
    doc.setFontSize(16);
    doc.setTextColor(...MORADO);
    doc.setFont(undefined, 'bold');
    doc.text(nombreLiga.toUpperCase(), anchoPagina / 2, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(...DORADO);
    doc.text(`REPORTE DE EQUIPO - ${equipo?.toUpperCase() || ''} (${categoria?.toUpperCase() || ''})`, anchoPagina / 2, 58, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'normal');
    doc.text(`TEMPORADA: ${temporadaNombre || ''} | FECHA: ${fecha}`, anchoPagina / 2, 72, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(40, 82, anchoPagina - 40, 82);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${pagina}`, anchoPagina / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
  }

  function tituloSeccion(texto, y) {
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.setFont(undefined, 'bold');
    doc.text(texto, 40, y);
    return y + 10;
  }

  let pagina = 1;
  cabecera(pagina);

  // ── 1. Tabla de posiciones ──
  let y = tituloSeccion('1. TABLA DE POSICIONES', 105);
  autoTable(doc, {
    startY: y,
    head: [['POS', 'EQUIPO', 'JJ', 'JG', 'JP', 'JE', 'PTS']],
    body: posiciones.map((p, i) => [i + 1, p.equipo, p.jj, p.jg, p.jp, p.je, p.ptos]),
    headStyles: { fillColor: MORADO, textColor: 255, fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.section === 'body' && posiciones[data.row.index]?.equipo === equipo) {
        data.cell.styles.fillColor = [255, 247, 224];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  // ── 2. Labor ofensiva ──
  doc.addPage(); pagina++; cabecera(pagina);
  y = tituloSeccion('2. LABOR OFENSIVA (BATEO)', 105);
  const bateoOrdenado = [...bateo].sort((a, b) => (b.hits || 0) - (a.hits || 0));
  autoTable(doc, {
    startY: y,
    head: [['#', 'JUGADOR', 'JJ', 'VB', 'CA', 'H', '2B', '3B', 'HR', 'CI', 'BB', 'SO', 'BR', 'AVG']],
    body: bateoOrdenado.map((f, i) => [
      i + 1, `${f.nombres} ${f.apellidos}`, f.juegos_jugados, f.vb, f.carreras_anotadas, f.hits,
      f.dobles, f.triples, f.jonrones, f.carreras_impulsadas, f.bases_por_bolas, f.ponches, f.bases_robadas,
      fmt3(f.promedio_bateo),
    ]),
    headStyles: { fillColor: MORADO, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'left' }, 13: { textColor: [180, 30, 30], fontStyle: 'bold' } },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // ── 3. Labor defensiva ──
  doc.addPage(); pagina++; cabecera(pagina);
  y = tituloSeccion('3. LABOR DEFENSIVA (FILDEO GENERAL)', 105);
  const fildeoOrdenado = [...fildeo].sort((a, b) => (b.total || 0) - (a.total || 0));
  autoTable(doc, {
    startY: y,
    head: [['#', 'JUGADOR', 'I.J', 'OUTS', 'ASIST', 'ERROR', 'TOTAL', 'AVED']],
    body: fildeoOrdenado.map((f, i) => [
      i + 1, `${f.nombres} ${f.apellidos}`, f.ij, f.outs, f.asistencias, f.errores, f.total, fmt3(f.aved),
    ]),
    headStyles: { fillColor: MORADO, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'left' }, 7: { textColor: [180, 30, 30], fontStyle: 'bold' } },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // ── 4. Labor de lanzadores ──
  if (llevaPitcheo) {
    doc.addPage(); pagina++; cabecera(pagina);
    y = tituloSeccion('4. LABOR DE LANZADORES', 105);
    const pitcheoOrdenado = [...pitcheo].sort((a, b) => (a.efectividad ?? 999) - (b.efectividad ?? 999));
    autoTable(doc, {
      startY: y,
      head: [['#', 'LANZADOR', 'IL', 'JG', 'JP', 'SO', 'BB', 'CL', 'ERA']],
      body: pitcheoOrdenado.map((f, i) => [
        i + 1, `${f.nombres} ${f.apellidos}`, f.innings_lanzados, f.ganados, f.perdidos,
        f.ponches, f.bases_por_bolas, f.carreras_limpias, fmt2(f.efectividad),
      ]),
      headStyles: { fillColor: MORADO, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'left' }, 8: { textColor: [180, 30, 30], fontStyle: 'bold' } },
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 4 },
    });
  }

  const nombreArchivo = `Reporte_Equipo_${(equipo || 'equipo').replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}