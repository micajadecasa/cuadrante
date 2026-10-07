import { jsPDF } from 'jspdf';
import {
  ConvenioSettings,
  DayInfo,
  Employee,
  EmployeeMonthStats,
  ShiftType,
} from '../types/quadrant';
import { GASTEIZ_LOGO_DATA_URL } from '../constants/logo';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Convierte el SVG corporativo en imagen PNG para incrustar en el PDF con máxima fidelidad
 */
async function getLogoPng(): Promise<string> {
  return new Promise(resolve => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 400, 400);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = GASTEIZ_LOGO_DATA_URL;
    } catch {
      resolve('');
    }
  });
}

export function exportQuadrantToCSV(
  year: number,
  month: number,
  serviceName: string,
  days: DayInfo[],
  employees: Employee[],
  assignments: Record<string, Record<number, string>>,
  statsMap: Map<string, EmployeeMonthStats>,
  coverage: Record<number, number>,
  shifts: ShiftType[]
) {
  const monthName = MONTH_NAMES_ES[month - 1];
  const rows: string[][] = [];

  // Header rows with official corporate header
  rows.push([`GASTEIZ DE VIGILANCIA - CUADRANTE OFICIAL DE SERVICIO`]);
  rows.push([`Puesto / Servicio: ${serviceName.toUpperCase()}`]);
  rows.push([`Mes: ${monthName} ${year}`]);
  rows.push([`Cómputo Anual: 1 de Enero al 31 de Diciembre incluidos`]);
  rows.push([]);

  // Legend
  const legendParts = shifts
    .filter(s => !s.isOffDay)
    .map(s => `${s.code}= ${s.startTime} - ${s.endTime} (${s.totalHours}h)`);
  rows.push([`LEYENDA DE TURNOS: ${legendParts.join(' | ')}`]);
  rows.push([]);

  // Table header 1: Día del mes
  const headerDays: string[] = ['Empleado', 'Puesto / TIP'];
  days.forEach(d => headerDays.push(String(d.dayOfMonth)));
  headerDays.push('Días Trab.', 'Horas Totales', 'Horas Festivas*', 'Horas Nocturnas', 'Horas Extras', 'Acum. Anual (1 Ene - 31 Dic)');
  rows.push(headerDays);

  // Table header 2: Día semana
  const headerWeekdays: string[] = ['', ''];
  days.forEach(d => {
    let tag = d.dayOfWeekName;
    if (d.isHoliday || d.isSunday || d.isSaturday) tag += '*';
    headerWeekdays.push(tag);
  });
  headerWeekdays.push('', '', '', '', '', '');
  rows.push(headerWeekdays);

  // Employee rows
  employees.forEach(emp => {
    const empAssigns = assignments[emp.id] || {};
    const empStats = statsMap.get(emp.id);

    const empRow: string[] = [
      emp.name,
      emp.tip ? `TIP: ${emp.tip}` : emp.assignedPost || '',
    ];

    days.forEach(d => {
      empRow.push(empAssigns[d.dayOfMonth] || '');
    });

    empRow.push(
      String(empStats?.workedDays ?? 0),
      String(empStats?.totalHours ?? 0),
      String(empStats?.holidayHours ?? 0),
      String(empStats?.nightHours ?? 0),
      String(empStats?.overtimeHours ?? 0),
      String(empStats?.annualTotalHours ?? 0)
    );

    rows.push(empRow);
  });

  // Daily coverage row
  const coverageRow: string[] = ['COBERTURA HORAS / DÍA', ''];
  let totalCoverageMonth = 0;
  days.forEach(d => {
    const cov = coverage[d.dayOfMonth] || 0;
    totalCoverageMonth += cov;
    coverageRow.push(String(cov));
  });
  coverageRow.push('', String(totalCoverageMonth), '', '', '', '');
  rows.push(coverageRow);

  // Format to CSV string with semicolons and UTF-8 BOM
  const csvContent =
    '\uFEFF' +
    rows
      .map(row =>
        row
          .map(cell => {
            const str = String(cell ?? '');
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(';')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Cuadrante_Gasteiz_Vigilancia_${monthName}_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportQuadrantToPDF(
  year: number,
  month: number,
  serviceName: string,
  days: DayInfo[],
  employees: Employee[],
  assignments: Record<string, Record<number, string>>,
  statsMap: Map<string, EmployeeMonthStats>,
  coverage: Record<number, number>,
  shifts: ShiftType[],
  convenio: ConvenioSettings
) {
  const monthName = MONTH_NAMES_ES[month - 1];
  // Landscape A4: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const marginX = 8;
  const startY = 8;

  // Header Banner with Gasteiz de Vigilancia branding
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(marginX, startY, pageWidth - marginX * 2, 17, 'F');

  // GV Shield Logo from image.png
  const logoX = marginX + 3;
  const logoY = startY + 2;
  const logoSize = 13;

  try {
    const logoPng = await getLogoPng();
    if (logoPng) {
      doc.addImage(logoPng, 'PNG', logoX, logoY, logoSize, logoSize);
    } else {
      // Vector fallback
      drawFallbackLogo(doc, logoX, logoY, logoSize);
    }
  } catch {
    drawFallbackLogo(doc, logoX, logoY, logoSize);
  }

  // Main Title: CUADRANTE DE GASTEIZ DE VIGILANCIA
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CUADRANTE DE GASTEIZ DE VIGILANCIA', logoX + 16, startY + 7);

  // Subtitle with Service Name and Month/Year
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Servicio: ${serviceName.toUpperCase()}  |  Mes: ${monthName.toUpperCase()} ${year}  |  Cómputo Anual: 1 Ene - 31 Dic`, logoX + 16, startY + 12.5);

  const datePrinted = new Date().toLocaleDateString('es-ES');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Emisión: ${datePrinted}`, pageWidth - marginX - 35, startY + 10);

  // Legend row
  let currentY = startY + 20;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('LEYENDA DE TURNOS:', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  const legendText = shifts
    .filter(s => !s.isOffDay)
    .map(s => `[${s.code}]: ${s.startTime}-${s.endTime} (${s.totalHours}h | ${s.nightHours}h noche)`)
    .join('    ');
  doc.text(legendText, marginX + 36, currentY);

  currentY += 4.5;

  // Table calculations
  const numDays = days.length;
  const nameColWidth = 32;
  const statsColWidth = 9;
  const numStatsCols = 5; // Días, Total Horas, Festivos (incl. sáb/dom), Noches, Anual (1 Ene - 31 Dic)
  const availableWidthForDays = pageWidth - marginX * 2 - nameColWidth - statsColWidth * numStatsCols;
  const dayColWidth = availableWidthForDays / numDays;
  const cellHeight = 7;

  // Reset colors explicitly
  doc.setDrawColor(203, 213, 225); // Slate-300 lines
  doc.setLineWidth(0.2);

  // Header 1: Left Top corner for "Vigilante / Día"
  let curX = marginX;
  doc.setFillColor(241, 245, 249);
  doc.rect(curX, currentY, nameColWidth, cellHeight * 2, 'F');
  doc.rect(curX, currentY, nameColWidth, cellHeight * 2, 'S');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Vigilante / Día', curX + 2, currentY + 7);

  curX += nameColWidth;

  // Day columns (Row 1: Day Number, Row 2: Day Weekday Name)
  days.forEach(d => {
    const isFestive = d.isHoliday || d.isSunday || (convenio.saturdaysCountAsHoliday && d.isSaturday);

    // Row 1: Day number cell
    if (isFestive) {
      doc.setFillColor(220, 38, 38); // Red-600 for festives/weekends
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.setTextColor(15, 23, 42);
    }
    doc.rect(curX, currentY, dayColWidth, cellHeight, 'F');
    doc.rect(curX, currentY, dayColWidth, cellHeight, 'S');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(String(d.dayOfMonth), curX + dayColWidth / 2, currentY + 4.8, { align: 'center' });

    // Row 2: Weekday name cell (Explicitly set fill & text colors to guarantee no black box!)
    if (isFestive) {
      doc.setFillColor(254, 226, 226); // Red-100
      doc.setTextColor(185, 28, 28); // Dark Red
    } else {
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setTextColor(71, 85, 105); // Slate-600
    }
    doc.rect(curX, currentY + cellHeight, dayColWidth, cellHeight, 'F');
    doc.rect(curX, currentY + cellHeight, dayColWidth, cellHeight, 'S');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', isFestive ? 'bold' : 'normal');
    doc.text(d.dayOfWeekName, curX + dayColWidth / 2, currentY + cellHeight + 4.8, { align: 'center' });

    curX += dayColWidth;
  });

  // Stats columns headers
  const statHeaders = ['Días', 'Horas', 'Fest.*', 'Noche', 'Anual'];
  statHeaders.forEach(sh => {
    doc.setFillColor(226, 232, 240);
    doc.rect(curX, currentY, statsColWidth, cellHeight * 2, 'F');
    doc.rect(curX, currentY, statsColWidth, cellHeight * 2, 'S');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(sh, curX + statsColWidth / 2, currentY + 7.5, { align: 'center' });
    curX += statsColWidth;
  });

  currentY += cellHeight * 2;

  // Employee rows
  employees.forEach((emp, empIdx) => {
    let rowX = marginX;
    const isAlt = empIdx % 2 === 1;

    // Name cell
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(rowX, currentY, nameColWidth, cellHeight, 'F');
    doc.rect(rowX, currentY, nameColWidth, cellHeight, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(emp.name, rowX + 2, currentY + 4.8);

    rowX += nameColWidth;

    const empAssigns = assignments[emp.id] || {};
    const empStats = statsMap.get(emp.id);

    // Day cells
    days.forEach(d => {
      const code = empAssigns[d.dayOfMonth] || '';
      const isFestive = d.isHoliday || d.isSunday || (convenio.saturdaysCountAsHoliday && d.isSaturday);

      if (isFestive) {
        doc.setFillColor(254, 242, 242); // Subtle red tint
      } else if (isAlt) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }

      doc.rect(rowX, currentY, dayColWidth, cellHeight, 'F');
      doc.rect(rowX, currentY, dayColWidth, cellHeight, 'S');

      if (code) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        if (code === 'A') doc.setTextColor(37, 99, 235);
        else if (code === 'B') doc.setTextColor(5, 150, 105);
        else if (code === 'C') doc.setTextColor(124, 58, 237);
        else doc.setTextColor(30, 41, 59);

        doc.text(code, rowX + dayColWidth / 2, currentY + 5, { align: 'center' });
      }

      rowX += dayColWidth;
    });

    // Employee Totals cells
    const statValues = [
      empStats?.workedDays ?? 0,
      empStats?.totalHours ?? 0,
      empStats?.holidayHours ?? 0,
      empStats?.nightHours ?? 0,
      empStats?.annualTotalHours ?? 0,
    ];

    statValues.forEach(val => {
      if (isAlt) {
        doc.setFillColor(241, 245, 249);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(rowX, currentY, statsColWidth, cellHeight, 'F');
      doc.rect(rowX, currentY, statsColWidth, cellHeight, 'S');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(val), rowX + statsColWidth / 2, currentY + 4.8, { align: 'center' });
      rowX += statsColWidth;
    });

    currentY += cellHeight;
  });

  // Daily Coverage Row
  let covX = marginX;
  doc.setFillColor(254, 226, 226); // Light red
  doc.rect(covX, currentY, nameColWidth, cellHeight, 'F');
  doc.rect(covX, currentY, nameColWidth, cellHeight, 'S');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('COBERTURA (H)', covX + 2, currentY + 4.8);

  covX += nameColWidth;

  let totalCov = 0;
  days.forEach(d => {
    const hours = coverage[d.dayOfMonth] || 0;
    totalCov += hours;
    if (hours >= 24) {
      doc.setFillColor(220, 252, 231);
    } else if (hours > 0) {
      doc.setFillColor(254, 243, 199);
    } else {
      doc.setFillColor(254, 226, 226);
    }
    doc.rect(covX, currentY, dayColWidth, cellHeight, 'F');
    doc.rect(covX, currentY, dayColWidth, cellHeight, 'S');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(hours), covX + dayColWidth / 2, currentY + 4.8, { align: 'center' });
    covX += dayColWidth;
  });

  // Total coverage stat
  doc.setFillColor(226, 232, 240);
  doc.rect(covX, currentY, statsColWidth * numStatsCols, cellHeight, 'F');
  doc.rect(covX, currentY, statsColWidth * numStatsCols, cellHeight, 'S');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total: ${totalCov} h`, covX + (statsColWidth * numStatsCols) / 2, currentY + 4.8, { align: 'center' });

  currentY += cellHeight + 6;

  // Signatures Section: Gasteiz de Vigilancia
  const signBoxWidth = 75;
  const signBoxHeight = 22;

  doc.rect(marginX + 15, currentY, signBoxWidth, signBoxHeight);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Firma y Sello de Gasteiz de Vigilancia', marginX + 18, currentY + 5);

  doc.rect(pageWidth - marginX - signBoxWidth - 15, currentY, signBoxWidth, signBoxHeight);
  doc.text('Firma y Conformidad de los Vigilantes de Seguridad', pageWidth - marginX - signBoxWidth - 12, currentY + 5);

  doc.save(`Cuadrante_Gasteiz_Vigilancia_${monthName}_${year}.pdf`);
}

function drawFallbackLogo(doc: jsPDF, x: number, y: number, size: number) {
  // Outer green shield border
  doc.setFillColor(0, 168, 89); // Green
  doc.roundedRect(x, y, size, size, 2, 2, 'F');

  // Inner black background
  doc.setFillColor(18, 18, 18);
  doc.roundedRect(x + 0.8, y + 0.8, size - 1.6, size - 1.6, 1.5, 1.5, 'F');

  // Red inner shield
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(x + 2, y + 2.5, size - 4, size - 5, 1, 1, 'F');

  // GV text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('GV', x + size / 2, y + size / 2 + 1.5, { align: 'center' });
}
