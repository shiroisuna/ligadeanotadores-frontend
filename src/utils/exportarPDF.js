import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TITULO   = 'LIGA DE ANOTADORES DE BÉISBOL Y SOFTBOL';
const SUBTITULO = 'Municipio Independencia — Santa Teresa del Tuy';
const FUNDADA   = 'Liga de Anotadores — Fundada: 18/01/1983';

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
  doc.text(SUBTITULO, ancho / 2, 18, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(FUNDADA, ancho / 2, 23, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  const hoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(7);
  doc.text('Generado: ' + hoy, ancho - 8, 26, { align: 'right' });

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
        p.g, p.p, p.s, p.il, p.vb, p.hp, p.so, p.bb, p.cl,
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
    head: [['Pos', 'Equipo', 'JJ', 'JG', 'JP', 'JE', 'PTS']],
    body: posiciones.map((p, i) => [i + 1, p.equipo, p.jj, p.jg, p.jp, p.je, p.ptos]),
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
      i + 1, `${f.nombres} ${f.apellidos}`, f.ij, f.outs, f.asistencias, f.errores, f.total, fmt3(f.aved),
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
        i + 1, `${f.nombres} ${f.apellidos}`, f.innings_lanzados, f.ganados, f.perdidos,
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


// ─────────────────────────────────────────────────────────────────────
// BOX SCORE completo + INCIDENCIAS del juego, en un solo PDF
// (formato del box score impreso de la liga)
// ─────────────────────────────────────────────────────────────────────
const AZUL  = [30, 58, 138];
const ROJO  = [200, 30, 30];

function fechaLarga(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y) return String(iso);
  return new Date(y, m - 1, d).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function hhmm(h) { return h ? String(h).slice(0, 5) : '—'; }

function ilFraccion(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return '0';
  const ent = Math.floor(n);
  const frac = n - ent;
  const F = [{ v: 0, t: '' }, { v: 1 / 3, t: '1/3' }, { v: 1 / 2, t: '1/2' }, { v: 2 / 3, t: '2/3' }];
  let mejor = F[0], dif = frac;
  for (const f of F) { const d = Math.abs(frac - f.v); if (d < dif) { mejor = f; dif = d; } }
  if (!mejor.t) return String(ent);
  return ent > 0 ? `${ent} ${mejor.t}` : mejor.t;
}

const N = (v) => Number(v) || 0;

const COLS_BS_BATEO = [
  ['vb', 'VB'], ['ca', 'CA'], ['hc', 'HC'], ['bb', 'BB'], ['sh', 'SH'], ['sf', 'SF'], ['gp', 'GP'],
  ['in_', 'IN'], ['al', 'AL'], ['h2', 'H2'], ['h3', 'H3'], ['hr', 'HR'], ['ba', 'BA'], ['ci', 'CI'],
  ['br', 'BR'], ['or_', 'OR'], ['so', 'SO'], ['ij', 'IJ'], ['o', 'O'], ['a', 'A'], ['e', 'E'],
  ['tl', 'TL'], ['dp', 'DP'], ['di', 'DI'],
];

const COLS_BS_PITCHEO = [
  ['i', 'I'], ['r', 'R'], ['c', 'C'], ['g', 'G'], ['p', 'P'], ['s', 'S'], ['e', 'E'], ['tl', 'T.L'],
  ['vb_enfrentados', 'VB'], ['hp', 'HP'], ['h2', 'H2'], ['h3', 'H3'], ['hr', 'HR'], ['il', 'IL'],
  ['cp', 'CP'], ['cl', 'CL'], ['so', 'SO'], ['bb', 'BB'], ['bi', 'BI'], ['sf', 'SF'], ['gp', 'GP'],
  ['wp', 'WP'], ['bk', 'BK'],
];

function tablaBateoPDF(doc, y, titulo, filas) {
  const totales = {};
  COLS_BS_BATEO.forEach(([k]) => {
    totales[k] = k === 'tl'
      ? filas.reduce((a, f) => a + N(f.o) + N(f.a) + N(f.e), 0)
      : filas.reduce((a, f) => a + N(f[k]), 0);
  });
  autoTable(doc, {
    startY: y,
    head: [['Nº', titulo, 'POS', ...COLS_BS_BATEO.map(([, l]) => l)]],
    body: filas.map((f) => [
      f.numero_camiseta ?? '',
      `${f.nombres || ''} ${f.apellidos || ''}`.trim(),
      f.posicion || '',
      ...COLS_BS_BATEO.map(([k]) => (k === 'tl' ? N(f.o) + N(f.a) + N(f.e) : N(f[k]))),
    ]),
    foot: [['', 'TOTALES', '', ...COLS_BS_BATEO.map(([k]) => totales[k])]],
    margin: { left: 6, right: 6 },
    styles: { fontSize: 6, cellPadding: 0.7, halign: 'center', lineWidth: 0 },
    headStyles: { fillColor: [235, 238, 245], textColor: AZUL, fontStyle: 'bold', lineWidth: 0.1, lineColor: [120, 120, 120] },
    footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 6 }, 1: { halign: 'left', cellWidth: 30 }, 2: { cellWidth: 9 } },
    showFoot: 'lastPage',
  });
  return doc.lastAutoTable.finalY + 3;
}

function tablaPitcheoPDF(doc, y, nombreEquipo, filas) {
  if (!filas.length) return y;
  autoTable(doc, {
    startY: y,
    head: [['Nº', `Labor lanzadores — ${nombreEquipo}`, ...COLS_BS_PITCHEO.map(([, l]) => l)]],
    body: filas.map((f) => [
      f.numero_camiseta ?? '',
      `${f.nombres || ''} ${f.apellidos || ''}`.trim(),
      ...COLS_BS_PITCHEO.map(([k]) => (k === 'il' ? ilFraccion(f.il) : N(f[k]))),
    ]),
    margin: { left: 6, right: 6 },
    styles: { fontSize: 6, cellPadding: 0.7, halign: 'center' },
    headStyles: { fillColor: [235, 238, 245], textColor: AZUL, fontStyle: 'bold', lineWidth: 0.1, lineColor: [120, 120, 120] },
    columnStyles: { 0: { cellWidth: 6 }, 1: { halign: 'left', cellWidth: 44 } },
  });
  return doc.lastAutoTable.finalY + 3;
}

export async function exportarBoxScorePDF({ juego, entradas = [], bateo = [], pitcheo = [], arbitros = [], incidencias = [] }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();

  const idLocal = Number(juego.local_equipo_inscrito_id ?? juego.equipo_local_id);
  const idVisit = Number(juego.visitante_equipo_inscrito_id ?? juego.equipo_visitante_id);
  const delEquipo = (arr, id) => arr.filter((f) => Number(f.equipo_inscrito_id) === id);
  const bateoV = delEquipo(bateo, idVisit), bateoL = delEquipo(bateo, idLocal);
  const pitV = delEquipo(pitcheo, idVisit), pitL = delEquipo(pitcheo, idLocal);

  // ── Cabecera (logo + datos de la liga) ──
  const logoB64 = await cargarImagenBase64('/logo-labsmi.jpg');
  if (logoB64) { try { doc.addImage(logoB64, 'JPEG', 7, 6, 24, 24); } catch (_) {} }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const cx = 52;
  doc.text('LIGA ANOTADORES DE BEISBOL Y SOFTBOL', cx, 8, { align: 'center' });
  doc.text('MUNICIPIO INDEPENDENCIA', cx, 12, { align: 'center' });
  doc.text('ESTADO BOLIVARIANO DE MIRANDA', cx, 16, { align: 'center' });
  doc.text('SANTA TERESA DEL TUY', cx, 20, { align: 'center' });
  doc.text('FUNDADA: 18/01/1983', cx, 24, { align: 'center' });
  doc.setTextColor(...ROJO);
  doc.text((juego.categoria_nombre || '').toUpperCase(), cx, 28, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.text('BOX SCORE', 150, 8, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(...ROJO);
  const fechaTxt = `SANTA TERESA DEL TUY, ${fechaLarga(juego.fecha)}${juego.fecha_fin && String(juego.fecha_fin).slice(0, 10) !== String(juego.fecha).slice(0, 10) ? ` a ${fechaLarga(juego.fecha_fin)}` : ''}.`;
  doc.text(fechaTxt, 150, 12, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // ── Línea de anotación ──
  const nEnt = Math.max(7, ...entradas.map((e) => N(e.numero_entrada)));
  const porEntrada = (idEq, n) => {
    const f = entradas.find((e) => Number(e.equipo_inscrito_id) === idEq && Number(e.numero_entrada) === n);
    return f ? N(f.carreras) : '';
  };
  const sumHits = (arr) => arr.reduce((a, f) => a + N(f.hc), 0);
  const hV = juego.hits_visitante ?? sumHits(bateoV);
  const hL = juego.hits_local ?? sumHits(bateoL);
  autoTable(doc, {
    startY: 14,
    margin: { left: 78, right: 6 },
    head: [['', 'ENTRADAS', ...Array.from({ length: nEnt }, (_, i) => String(i + 1)), 'C', 'H', 'E']],
    body: [
      ['VS', juego.equipo_visitante, ...Array.from({ length: nEnt }, (_, i) => porEntrada(idVisit, i + 1)), N(juego.carreras_visitante), hV, N(juego.errores_visitante)],
      ['HC', juego.equipo_local,     ...Array.from({ length: nEnt }, (_, i) => porEntrada(idLocal, i + 1)), N(juego.carreras_local),     hL, N(juego.errores_local)],
    ],
    styles: { fontSize: 7, cellPadding: 0.9, halign: 'center', fontStyle: 'bold' },
    headStyles: { fillColor: [255, 255, 255], textColor: ROJO, lineWidth: 0 },
    columnStyles: { 0: { cellWidth: 7, halign: 'left' }, 1: { cellWidth: 24, halign: 'left' } },
    theme: 'plain',
  });
  let y = Math.max(doc.lastAutoTable.finalY + 2, 33);

  // Ganador
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('COPA :', 8, y + 2);
  let lineaGanador = '';
  const cl = N(juego.carreras_local), cv = N(juego.carreras_visitante);
  if (juego.equipo_ganador_id || (juego.estado === 'jugado' && cl !== cv)) {
    const gana = juego.equipo_ganador_id
      ? (Number(juego.equipo_ganador_id) === idLocal ? juego.equipo_local : juego.equipo_visitante)
      : (cl > cv ? juego.equipo_local : juego.equipo_visitante);
    lineaGanador = `EL JUEGO LO GANÓ   ${String(gana).toUpperCase()}   ${Math.max(cl, cv)} a ${Math.min(cl, cv)}`;
  }
  doc.text(lineaGanador, 110, y + 2, { align: 'center' });
  y += 5;

  // ── Tablas: visitante primero, luego local ──
  y = tablaBateoPDF(doc, y, `${juego.equipo_visitante} (V)`, bateoV);
  y = tablaBateoPDF(doc, y, `${juego.equipo_local} (HC)`, bateoL);
  y = tablaPitcheoPDF(doc, y, juego.equipo_visitante, pitV);
  y = tablaPitcheoPDF(doc, y, juego.equipo_local, pitL);

  // ── Datos técnicos ──
  if (y > 225) { doc.addPage(); y = 12; }
  const nombresArb = arbitros.map((a) => `${a.nombres} ${a.apellidos}`).join(' - ');
  const filasTec = [
    ['TIEMPO DE JUEGO', `(INICIO: ${hhmm(juego.hora_inicio || juego.hora)}) (TÉRMINO: ${hhmm(juego.hora_final)})${juego.duracion_minutos ? `  ${Math.floor(juego.duracion_minutos / 60)} HORA(S) Y ${juego.duracion_minutos % 60} MINUTOS` : ''}`],
    ['ÁRBITROS', `${nombresArb || '—'}${juego.entidad_arbitros ? `     ENTIDAD= ${juego.entidad_arbitros}` : ''}`],
    ['ANOTADOR', `${juego.anotador_oficial || '—'}${juego.entidad_anotador ? `     ENTIDAD= ${juego.entidad_anotador}` : ''}`],
    ['FECHA', fechaTxt.toUpperCase()],
    ['ESTADIO', `${juego.estadio || '—'}${juego.estadio_direccion ? `. ${juego.estadio_direccion}` : ''}`.toUpperCase()],
  ];
  if (juego.ronda) filasTec.push(['RONDA', String(juego.ronda).toUpperCase()]);
  autoTable(doc, {
    startY: y,
    head: [[{ content: 'DATOS TÉCNICOS', colSpan: 2, styles: { halign: 'left' } }]],
    body: filasTec,
    margin: { left: 6, right: 6 },
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 34 } },
    theme: 'plain',
  });
  y = doc.lastAutoTable.finalY + 4;

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8);
  doc.setTextColor(...ROJO);
  const mvpEq = juego.mvp_equipo_inscrito_id
    ? (Number(juego.mvp_equipo_inscrito_id) === idLocal ? juego.equipo_local : juego.equipo_visitante) : '';
  doc.text('Jugador más valioso del juego:', 36, y);
  doc.text(juego.mvp_nombre ? `${juego.mvp_nombre}   ( ${mvpEq} )` : '—', 120, y);
  doc.setTextColor(0, 0, 0);

  // ── INCIDENCIAS en página aparte (mismo PDF) ──
  doc.addPage();
  let yi = await membrete(doc);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...AZUL);
  doc.text('REPORTE DE INCIDENCIAS', ancho / 2, yi + 4, { align: 'center' });
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${juego.equipo_visitante || '—'} (V) vs ${juego.equipo_local || '—'} (HC)  |  Fecha: ${String(juego.fecha || '—').slice(0, 10)}`, ancho / 2, yi + 11, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yi += 18;
  if (!incidencias.length) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('No hay incidencias registradas para este juego.', 15, yi);
  } else {
    autoTable(doc, {
      startY: yi,
      head: [['Tipo', 'Jugador', 'Equipo', 'Descripción', 'Fecha/Hora']],
      body: incidencias.map((i) => [
        TIPO_LABEL[i.tipo] || i.tipo,
        i.roster_id ? `${i.nombres || ''} ${i.apellidos || ''}`.trim() : '—',
        i.roster_id ? (i.equipo || '—') : '—',
        i.descripcion,
        i.creado_en ? new Date(i.creado_en).toLocaleString('es-VE') : '—',
      ]),
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'top' },
      headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 3: { cellWidth: 70 } },
    });
  }

  const nombre = `BoxScore_${juego.equipo_visitante}_vs_${juego.equipo_local}_${String(juego.fecha || '').slice(0, 10)}`.replace(/\s+/g, '_');
  doc.save(nombre + '.pdf');
}