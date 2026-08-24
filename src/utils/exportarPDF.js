// Exporta el calendario o los resultados a PDF con el membrete de la liga.
// Usa jsPDF + jsPDF-AutoTable — se importan como CDN en el HTML o con npm.
// npm install jspdf jspdf-autotable

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const LIGA_TITULO  = 'LIGA DE ANOTADORES DE BÉISBOL Y SOFTBOL';
const LIGA_SUBTITULO = 'Municipio Independencia — Santa Teresa del Tuy';

function membrete(doc) {
  const ancho = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 41, 59);          // slate-800
  doc.rect(0, 0, ancho, 30, 'F');

  // Logo — si existe en /logo-labsmi.jpg lo incrustamos,
  // si no, ponemos solo el texto.
  try {
    doc.addImage('/logo-labsmi.jpg', 'JPEG', 8, 4, 20, 20);
  } catch (_) {}

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(LIGA_TITULO, ancho / 2, 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);       // slate-400
  doc.text(LIGA_SUBTITULO, ancho / 2, 20, { align: 'center' });

  // Fecha de generación
  doc.setFontSize(7);
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    ancho - 8, 26, { align: 'right' }
  );

  doc.setTextColor(0, 0, 0);
  return 35; // Y de inicio del contenido
}

// ─────────────────────────────────────────────────────────────────────
// Exportar calendario de juegos a PDF
// juegos: el array que ya tienes, agrupado en el componente de calendario
// porFecha: [{ fecha, juegos: [...] }]
// ─────────────────────────────────────────────────────────────────────
export function exportarCalendarioPDF({ porFecha, categoriaNombre, temporadaNombre, copaNombre }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  let y = membrete(doc);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CALENDARIO DE JUEGOS', doc.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' });
  y += 8;

  if (temporadaNombre || categoriaNombre) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const sub = [categoriaNombre, copaNombre].filter(Boolean).join(' — ');
    doc.text(`${temporadaNombre || ''}  ${sub}`, doc.internal.pageSize.getWidth() / 2, y + 3, { align: 'center' });
    y += 7;
    doc.setTextColor(0, 0, 0);
  }

  // Agrupar por semana (bloques de domingo a sábado)
  for (const grupo of porFecha) {
    const fecha = new Date(grupo.fecha + 'T00:00:00');
    const fechaStr = fecha.toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    // Encabezado de fecha
    doc.setFillColor(30, 41, 59);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(8, y, doc.internal.pageSize.getWidth() - 16, 6, 'F');
    doc.text(fechaStr.toUpperCase(), 12, y + 4.2);
    doc.setTextColor(0, 0, 0);
    y += 7;

    // Tabla de juegos del día
    const rows = grupo.juegos.map((j) => [
      j.estadio || '—',
      j.categoria || '—',
      j.equipo_visitante || '—',
      'vs',
      j.equipo_local || '—',
      j.hora ? j.hora.slice(0, 5) : '—',
      j.anotador_oficial || '—',
    ]);

    doc.autoTable({
      head: [['Estadio', 'Categoría', 'Visitador', '', 'Home Club', 'Hora', 'Anotador']],
      body: rows,
      startY: y,
      margin: { left: 8, right: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 8,  halign: 'center' },
        4: { cellWidth: 40 },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 35 },
      },
    });

    y = doc.lastAutoTable.finalY + 5;
    if (y > 180) { doc.addPage(); y = membrete(doc) + 2; }
  }

  doc.save(`calendario-${categoriaNombre || 'liga'}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────
// Exportar hoja de resultados de un juego a PDF
// ─────────────────────────────────────────────────────────────────────
export function exportarResultadoPDF({ juego, estadisticas }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  let y = membrete(doc);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('HOJA DE RESULTADOS', doc.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' });
  y += 10;

  // Encabezado del juego
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${juego.fecha}  |  Hora: ${juego.hora?.slice(0,5) || '—'}  |  Estadio: ${juego.estadio || '—'}`, 15, y);
  y += 7;
  doc.text(`Árbitros: ${juego.arbitros || '—'}  |  Anotador: ${juego.anotador_oficial || '—'}`, 15, y);
  y += 7;

  // Marcador principal
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const mitad = doc.internal.pageSize.getWidth() / 2;
  doc.text(`${juego.equipo_local}`, mitad - 30, y, { align: 'right' });
  doc.text(`${juego.carreras_local ?? '—'}  -  ${juego.carreras_visitante ?? '—'}`, mitad, y, { align: 'center' });
  doc.text(`${juego.equipo_visitante}`, mitad + 30, y, { align: 'left' });
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `H ${juego.hits_local ?? '—'}/${juego.hits_visitante ?? '—'}  ·  E ${juego.errores_local ?? '—'}/${juego.errores_visitante ?? '—'}`,
    mitad, y, { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
  y += 8;

  // Estadística de bateo
  if (estadisticas?.bateo?.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BATEO', 15, y);
    y += 4;

    doc.autoTable({
      head: [['#', 'Jugador', 'Equipo', 'VB', 'CA', 'HC', 'BB', 'H2', 'H3', 'HR', 'CI', 'BR', 'SO', 'AVE']],
      body: estadisticas.bateo.map((b) => [
        b.numero_camiseta ?? '—', `${b.nombres} ${b.apellidos}`, b.equipo,
        b.vb, b.ca, b.hc, b.bb, b.h2, b.h3, b.hr, b.ci, b.br, b.so,
        b.vb > 0 ? (b.hc / b.vb).toFixed(3) : '.000',
      ]),
      startY: y,
      margin: { left: 8, right: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Estadística de pitcheo
  if (estadisticas?.pitcheo?.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PITCHEO', 15, y);
    y += 4;

    doc.autoTable({
      head: [['#', 'Pitcher', 'Equipo', 'G', 'P', 'S', 'IL', 'VB', 'HP', 'SO', 'BB', 'CL', 'EFE']],
      body: estadisticas.pitcheo.map((p) => [
        p.numero_camiseta ?? '—', `${p.nombres} ${p.apellidos}`, p.equipo,
        p.g, p.p, p.s, p.il, p.vb, p.hp, p.so, p.bb, p.cl,
        p.il > 0 ? (p.cl * 7 / p.il).toFixed(2) : '0.00',
      ]),
      startY: y,
      margin: { left: 8, right: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    });
  }

  doc.save(`resultado-${juego.equipo_local}-vs-${juego.equipo_visitante}-${juego.fecha}.pdf`);
}
