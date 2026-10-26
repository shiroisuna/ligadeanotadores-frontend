import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatInnings } from './innings';

const TITULO   = 'LIGA DE ANOTADORES DE BÉISBOL Y SOFTBOL';
const SUBTITULO = 'Municipio Independencia — Santa Teresa del Tuy';

// Carga el logo como base64 para que jsPDF pueda usarlo
function cargarImagenBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(null);
    img.src = url + '?t=' + Date.now();
  });
}

async function membrete(doc) {
  const ancho = doc.internal.pageSize.getWidth();
  // Franja azul
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, ancho, 28, 'F');

  // Logo
  const logoB64 = await cargarImagenBase64('/logo-labsmi.jpg');
  if (logoB64) {
    try { doc.addImage(logoB64, 'JPEG', 6, 3, 22, 22); } catch (_) {}
  }

  // Texto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(TITULO, ancho / 2, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text(SUBTITULO, ancho / 2, 19, { align: 'center' });

  const hoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(7);
  doc.text('Generado: ' + hoy, ancho - 8, 25, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  return 33; // Y de inicio del contenido
}

// ─────────────────────────────────────────────────────────────────────
// Exportar CALENDARIO a PDF
// ─────────────────────────────────────────────────────────────────────
export async function exportarCalendarioPDF({ porFecha, categoriaNombre, temporadaNombre, copaNombre }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  let y = await membrete(doc);

  const ancho = doc.internal.pageSize.getWidth();
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CALENDARIO DE JUEGOS', ancho / 2, y + 4, { align: 'center' });
  y += 9;

  if (temporadaNombre || categoriaNombre) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const sub = [categoriaNombre, copaNombre].filter(Boolean).join(' — ');
    doc.text((temporadaNombre || '') + '  ' + sub, ancho / 2, y + 3, { align: 'center' });
    y += 7;
    doc.setTextColor(0, 0, 0);
  }

  for (const grupo of porFecha) {
    const fecha = new Date(grupo.fecha + 'T00:00:00');
    const fechaStr = fecha.toLocaleDateString('es-VE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }).toUpperCase();

    // Cabecera de fecha
    doc.setFillColor(30, 58, 138);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.rect(8, y, ancho - 16, 6, 'F');
    doc.text(fechaStr, 12, y + 4.2);
    doc.setTextColor(0, 0, 0);
    y += 7;

    const rows = grupo.juegos.map((j) => [
      j.estadio || '—',
      j.categoria_nombre || '—',
      j.equipo_visitante || '—',
      'vs',
      j.equipo_local || '—',
      j.hora ? j.hora.slice(0, 5) : '—',
      j.anotador_oficial || '—',
    ]);

    autoTable(doc, {
      head: [['Estadio', 'Categoría', 'Visitador', '', 'Home Club', 'Hora', 'Anotador']],
      body: rows,
      startY: y,
      margin: { left: 8, right: 8 },
      styles: { fontSize: 8, cellPadding: 1.8 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 32 }, 1: { cellWidth: 28 }, 2: { cellWidth: 42 },
        3: { cellWidth: 8, halign: 'center' }, 4: { cellWidth: 42 },
        5: { cellWidth: 16, halign: 'center' }, 6: { cellWidth: 35 },
      },
    });

    y = doc.lastAutoTable.finalY + 5;
    if (y > 175) { doc.addPage(); y = await membrete(doc) + 2; }
  }

  doc.save('calendario-' + (categoriaNombre || 'liga').replace(/\s+/g, '_') + '.pdf');
}

// ─────────────────────────────────────────────────────────────────────
// Exportar RESULTADO de un juego a PDF
// ─────────────────────────────────────────────────────────────────────
export async function exportarResultadoPDF({ juego, estadisticas }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  let y = await membrete(doc);

  const ancho = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('HOJA DE RESULTADOS', ancho / 2, y + 4, { align: 'center' });
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(
    'Fecha: ' + (juego.fecha || '—') +
    '  |  Hora: ' + (juego.hora ? juego.hora.slice(0, 5) : '—') +
    '  |  Estadio: ' + (juego.estadio || '—'),
    15, y
  );
  y += 6;
  doc.text(
    'Árbitros: ' + (juego.arbitros || '—') +
    '  |  Anotador: ' + (juego.anotador_oficial || '—'),
    15, y
  );
  y += 8;
  doc.setTextColor(0, 0, 0);

  // Marcador
  const mitad = ancho / 2;
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(juego.equipo_local || '—', mitad - 5, y, { align: 'right' });
  doc.text(
    (juego.carreras_local ?? '—') + '  -  ' + (juego.carreras_visitante ?? '—'),
    mitad, y, { align: 'center' }
  );
  doc.text(juego.equipo_visitante || '—', mitad + 5, y, { align: 'left' });
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'H ' + (juego.hits_local ?? '—') + '/' + (juego.hits_visitante ?? '—') +
    '  ·  E ' + (juego.errores_local ?? '—') + '/' + (juego.errores_visitante ?? '—'),
    mitad, y, { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
  y += 10;

  // Tabla de bateo
  if (estadisticas?.bateo?.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BATEO', 15, y);
    y += 3;

    autoTable(doc, {
      head: [['#', 'Jugador', 'Equipo', 'VB', 'CA', 'HC', 'BB', 'H2', 'H3', 'HR', 'CI', 'BR', 'SO']],
      body: estadisticas.bateo.map((b) => [
        b.numero_camiseta ?? '—',
        (b.nombres || '') + ' ' + (b.apellidos || ''),
        b.equipo || '—',
        b.vb, b.ca, b.hc, b.bb, b.h2, b.h3, b.hr, b.ci, b.br, b.so,
      ]),
      startY: y,
      margin: { left: 8, right: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Tabla de pitcheo
  if (estadisticas?.pitcheo?.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PITCHEO', 15, y);
    y += 3;

    autoTable(doc, {
      head: [['#', 'Pitcher', 'Equipo', 'G', 'P', 'S', 'IL', 'VB', 'HP', 'SO', 'BB', 'CL', 'EFE']],
      body: estadisticas.pitcheo.map((p) => [
        p.numero_camiseta ?? '—',
        (p.nombres || '') + ' ' + (p.apellidos || ''),
        p.equipo || '—',
        p.g, p.p, p.s, formatInnings(p.il, '0'), p.vb, p.hp, p.so, p.bb, p.cl,
        p.il > 0 ? (p.cl * 7 / p.il).toFixed(2) : '0.00',
      ]),
      startY: y,
      margin: { left: 8, right: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  const nombre = (juego.equipo_local + '-vs-' + juego.equipo_visitante + '-' + juego.fecha)
    .replace(/\s+/g, '_');
  doc.save('resultado-' + nombre + '.pdf');
}

// ─────────────────────────────────────────────────────────────────────
// Exportar BRACKET DE TORNEO a PDF
// ─────────────────────────────────────────────────────────────────────
export async function exportarTorneoPDF({ torneo, fases, cruces }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  let y = await membrete(doc);
  const ancho = doc.internal.pageSize.getWidth();

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(torneo.nombre.toUpperCase(), ancho / 2, y + 5, { align: 'center' });
  y += 12;

  const faseOrdenada = [...fases].sort((a, b) => a.orden - b.orden);

  for (const fase of faseOrdenada) {
    const crucesDeEstaFase = cruces
      .filter((c) => c.fase_id === fase.id)
      .sort((a, b) => a.orden - b.orden);

    if (crucesDeEstaFase.length === 0) continue;

    // Cabecera de fase
    doc.setFillColor(30, 58, 138);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.rect(8, y, ancho - 16, 7, 'F');
    doc.text(fase.nombre.toUpperCase(), 14, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 9;

    // Tabla de cruces
    const rows = crucesDeEstaFase.map((c, i) => {
      const local    = c.equipo_local     || 'Por definir';
      const visitante = c.equipo_visitante || 'Por definir';
      const resultado = c.juego_estado === 'jugado'
        ? `${c.carreras_local} - ${c.carreras_visitante}`
        : c.juego_fecha ? `${c.juego_fecha}` : 'Pendiente';
      const ganador = c.equipo_ganador || (c.juego_estado === 'jugado' ? '—' : '');
      return [i + 1, local, 'vs', visitante, resultado, ganador];
    });

    autoTable(doc, {
      head: [['#', 'Local', '', 'Visitante', 'Resultado', 'Ganador']],
      body: rows,
      startY: y,
      margin: { left: 8, right: 8 },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 12, halign: 'center', textColor: [100, 100, 100] },
        3: { cellWidth: 55 },
        4: { cellWidth: 35, halign: 'center' },
        5: { cellWidth: 55, fontStyle: 'bold' },
      },
    });

    y = doc.lastAutoTable.finalY + 8;
    if (y > 175) { doc.addPage(); y = await membrete(doc) + 5; }
  }

  // Campeón si existe
  const cruceFinal = cruces.find((c) => {
    const fase = fases.find((f) => f.id === c.fase_id);
    return fase && fase.nombre === 'Final';
  });
  if (cruceFinal?.equipo_ganador) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('🏆 CAMPEÓN: ' + cruceFinal.equipo_ganador, ancho / 2, y + 6, { align: 'center' });
  }

  doc.save('torneo-' + torneo.nombre.replace(/\s+/g, '_') + '.pdf');
}

// ─────────────────────────────────────────────────────────────────────
// Exportar REPORTE POR EQUIPO a PDF (posiciones + ofensiva + defensiva + lanzadores)
// ─────────────────────────────────────────────────────────────────────

// promedio_bateo/promedio_slugging de la vista vienen en escala x1000
// (ej. 667 = .667) — hay que dividir antes de mostrar.
function fmtProm(v) {
  return (Number(v || 0) / 1000).toFixed(3);
}
// aved (fildeo) y efectividad ya vienen como decimal normal, no escalados.
function fmt3(v) { return Number(v || 0).toFixed(3); }
function fmt2(v) { return Number(v || 0).toFixed(2); }

export async function exportarReporteEquipoPDF({
  equipo, categoria, temporadaNombre, posiciones = [], bateo = [], pitcheo = [], fildeo = [], llevaPitcheo,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  let y = await membrete(doc);
  const ancho = doc.internal.pageSize.getWidth();

  function tituloReporte(numeroSeccion, texto) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('REPORTE DE EQUIPO — ' + (equipo || '').toUpperCase() + (categoria ? ' (' + categoria.toUpperCase() + ')' : ''), ancho / 2, y + 4, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Temporada: ' + (temporadaNombre || '—'), ancho / 2, y + 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(numeroSeccion + '. ' + texto, 15, y + 20);
    return y + 25;
  }

  // ── 1. Tabla de posiciones ──
  let yTabla = tituloReporte('1', 'TABLA DE POSICIONES');
  autoTable(doc, {
    startY: yTabla,
    head: [['Pos', 'Equipo', 'JJ', 'JG', 'JP', 'JE', 'PTS', 'AVE']],
    body: posiciones.map((p, i) => [i + 1, p.equipo, p.jj, p.jg, p.jp, p.je, p.ptos, p.ave ?? '']),
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (data) => {
      if (data.section === 'body' && posiciones[data.row.index]?.equipo === equipo) {
        data.cell.styles.fillColor = [255, 247, 224];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // ── 2. Labor ofensiva (bateo) ──
  doc.addPage();
  y = await membrete(doc);
  yTabla = tituloReporte('2', 'LABOR OFENSIVA (BATEO)');
  const bateoOrdenado = [...bateo].sort((a, b) => (b.hits || 0) - (a.hits || 0));
  autoTable(doc, {
    startY: yTabla,
    head: [['#', 'Jugador', 'JJ', 'VB', 'CA', 'H', '2B', '3B', 'HR', 'CI', 'BB', 'SO', 'BR', 'AVG']],
    body: bateoOrdenado.map((f, i) => [
      i + 1, `${f.nombres} ${f.apellidos}`, f.juegos_jugados, f.vb, f.carreras_anotadas, f.hits,
      f.dobles, f.triples, f.jonrones, f.carreras_impulsadas, f.bases_por_bolas, f.ponches, f.bases_robadas,
      fmtProm(f.promedio_bateo),
    ]),
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 13: { textColor: [180, 30, 30], fontStyle: 'bold' } },
  });

  // ── 3. Labor defensiva (fildeo general) ──
  doc.addPage();
  y = await membrete(doc);
  yTabla = tituloReporte('3', 'LABOR DEFENSIVA (FILDEO GENERAL)');
  const fildeoOrdenado = [...fildeo].sort((a, b) => (b.total || 0) - (a.total || 0));
  autoTable(doc, {
    startY: yTabla,
    head: [['#', 'Jugador', 'I.J', 'Outs', 'Asist', 'Error', 'Total', 'AVED']],
    body: fildeoOrdenado.map((f, i) => [
      i + 1, `${f.nombres} ${f.apellidos}`, formatInnings(f.ij, '0'), f.outs, f.asistencias, f.errores, f.total, fmt3(f.aved),
    ]),
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 7: { textColor: [180, 30, 30], fontStyle: 'bold' } },
  });

  // ── 4. Labor de lanzadores ──
  if (llevaPitcheo) {
    doc.addPage();
    y = await membrete(doc);
    yTabla = tituloReporte('4', 'LABOR DE LANZADORES');
    const pitcheoOrdenado = [...pitcheo].sort((a, b) => (a.efectividad ?? 999) - (b.efectividad ?? 999));
    autoTable(doc, {
      startY: yTabla,
      head: [['#', 'Lanzador', 'IL', 'JG', 'JP', 'SO', 'BB', 'CL', 'ERA']],
      body: pitcheoOrdenado.map((f, i) => [
        i + 1, `${f.nombres} ${f.apellidos}`, formatInnings(f.innings_lanzados, '0'), f.ganados, f.perdidos,
        f.ponches, f.bases_por_bolas, f.carreras_limpias, fmt2(f.efectividad),
      ]),
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 8: { textColor: [180, 30, 30], fontStyle: 'bold' } },
    });
  }

  doc.save('Reporte_Equipo_' + (equipo || 'equipo').replace(/\s+/g, '_') + '.pdf');
}

// ─────────────────────────────────────────────────────────────────────
// Exportar INCIDENCIAS de un juego a PDF
// ─────────────────────────────────────────────────────────────────────
const TIPO_LABEL = { sancion: 'Sanción', novedad: 'Novedad', protesta: 'Protesta', otro: 'Otro' };

export async function exportarIncidenciasPDF({ juego, incidencias = [] }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  let y = await membrete(doc);
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('REPORTE DE INCIDENCIAS', ancho / 2, y + 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(
    `${juego.equipo_local || '—'} vs ${juego.equipo_visitante || '—'}  |  Fecha: ${juego.fecha || '—'}`,
    ancho / 2, y, { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
  y += 8;

  if (incidencias.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No hay incidencias registradas para este juego.', 15, y);
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Tipo', 'Jugador', 'Equipo', 'Descripción', 'Fecha/Hora']],
      body: incidencias.map((i) => [
        TIPO_LABEL[i.tipo] || i.tipo,
        i.roster_id ? `${i.nombres || ''} ${i.apellidos || ''}`.trim() : '—',
        i.roster_id ? (i.equipo || '—') : '—',
        i.descripcion,
        new Date(i.creado_en).toLocaleString('es-VE'),
      ]),
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'top' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 3: { cellWidth: 70 } },
    });
  }

  const nombre = `Incidencias_${(juego.equipo_local || '')}_vs_${(juego.equipo_visitante || '')}_${juego.fecha || ''}`.replace(/\s+/g, '_');
  doc.save(nombre + '.pdf');
}

// ─────────────────────────────────────────────────────────────────────
// Exportar INCIDENCIAS por RANGO DE FECHA (todos los juegos de la
// categoría dentro del periodo) a PDF
// ─────────────────────────────────────────────────────────────────────
export async function exportarIncidenciasRangoPDF({ categoria, fechaInicio, fechaFin, incidencias = [] }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  let y = await membrete(doc);
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('REPORTE DE INCIDENCIAS POR PERIODO', ancho / 2, y + 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(
    `${categoria || ''}  |  Del ${fechaInicio} al ${fechaFin}`,
    ancho / 2, y, { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
  y += 8;

  if (incidencias.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No hay incidencias registradas en este periodo.', 15, y);
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Juego', 'Tipo', 'Jugador', 'Descripción']],
      body: incidencias.map((i) => [
        i.fecha_juego,
        `${i.equipo_local} vs ${i.equipo_visitante}`,
        TIPO_LABEL[i.tipo] || i.tipo,
        i.roster_id ? `${i.nombres || ''} ${i.apellidos || ''}`.trim() + (i.equipo ? ` (${i.equipo})` : '') : '—',
        i.descripcion,
      ]),
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8, cellPadding: 2.2, valign: 'top' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 4: { cellWidth: 65 } },
    });
  }

  doc.save(`Incidencias_${fechaInicio}_a_${fechaFin}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────
// Exportar FICHAS DE EQUIPO (listado de jugadores con número) a PDF
// ─────────────────────────────────────────────────────────────────────
export async function exportarFichasEquipoPDF({ equipo, categoria, temporadaNombre, roster = [] }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  let y = await membrete(doc);
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('FICHA DE EQUIPO — ' + (equipo || '').toUpperCase(), ancho / 2, y + 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`${categoria || ''}  |  Temporada: ${temporadaNombre || '—'}`, ancho / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 8;

  const ordenado = [...roster].sort((a, b) => (a.numero_camiseta ?? 999) - (b.numero_camiseta ?? 999));

  autoTable(doc, {
    startY: y,
    head: [['#', 'Jugador', 'Posición', 'Lado']],
    body: ordenado.map((r) => [
      r.numero_camiseta ?? '—',
      `${r.nombres} ${r.apellidos}`,
      r.posicion_principal || '—',
      r.lado ? r.lado.charAt(0).toUpperCase() + r.lado.slice(1) : '—',
    ]),
    margin: { left: 15, right: 15 },
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } },
  });

  doc.save(`Ficha_Equipo_${(equipo || 'equipo').replace(/\s+/g, '_')}.pdf`);
}