import {
  ConvenioSettings,
  DayInfo,
  Employee,
  EmployeeMonthStats,
  ShiftType,
} from '../types/quadrant';
import { ALAVA_HOLIDAYS_2027 } from '../constants/defaultData';

const DAY_NAMES = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // JavaScript getDay(): 0 is Sunday

export function getDaysInMonth(
  year: number,
  month: number,
  customHolidays?: Record<string, string>
): DayInfo[] {
  const days: DayInfo[] = [];
  const daysCount = new Date(year, month, 0).getDate(); // month is 1-12
  const holidays = customHolidays || ALAVA_HOLIDAYS_2027;

  for (let d = 1; d <= daysCount; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = date.getDay();
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateString = `${year}-${mm}-${dd}`;
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const holidayName = holidays[dateString];
    const isHoliday = Boolean(holidayName);

    days.push({
      dayOfMonth: d,
      dayOfWeek,
      dayOfWeekName: DAY_NAMES[dayOfWeek],
      dateString,
      isSunday,
      isSaturday,
      isHoliday,
      holidayName,
    });
  }

  return days;
}

export function isFestiveDay(day: DayInfo, convenio: ConvenioSettings): boolean {
  if (day.isSunday || day.isHoliday) {
    return true;
  }
  // Los sábados también se consideran festivos según solicitud
  if (convenio.saturdaysCountAsHoliday && day.isSaturday) {
    return true;
  }
  return false;
}

/**
 * Convierte un formato de hora "HH:MM" o "H:MM" a minutos transcurridos desde las 00:00.
 */
export function parseTimeToMinutes(timeStr: string | undefined): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Determina si una fecha concreta es festiva (Domingo, festivo oficial o Sábado según convenio).
 */
export function isFestiveDate(
  date: Date,
  convenio: ConvenioSettings,
  customHolidays?: Record<string, string>
): boolean {
  const dayOfWeek = date.getDay(); // 0 es Domingo, 6 es Sábado
  if (dayOfWeek === 0) return true;
  if (convenio.saturdaysCountAsHoliday && dayOfWeek === 6) return true;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateString = `${y}-${m}-${d}`;

  const holidays = customHolidays || ALAVA_HOLIDAYS_2027;
  return Boolean(holidays[dateString]);
}

/**
 * Calcula las horas festivas de un turno específico asignado a un día del cuadrante,
 * aplicando las reglas laborales del sector:
 * 
 * 1. Las horas festivas son SOLO las que caen dentro del día festivo (00:00–24:00).
 * 2. Turno empieza antes del festivo → solo festivas las horas después de 00:00.
 * 3. Turno empieza en el festivo → festivas hasta las 24:00.
 * 4. Turno cruza el festivo → dividir en dos partes (normal + festivo).
 * 5. Turno dentro del festivo → todas festivas.
 * 6. Turno fuera del festivo → ninguna festiva.
 */
export function calculateShiftHolidayHours(
  shift: ShiftType,
  dayIndex: number,
  days: DayInfo[],
  convenio: ConvenioSettings,
  customHolidays?: Record<string, string>
): number {
  if (shift.isOffDay || shift.code === 'V' || shift.code === 'BAJA' || shift.totalHours <= 0) {
    return 0;
  }

  const currentDay = days[dayIndex];
  if (!currentDay) {
    return 0;
  }

  const isCurrentDayFestive = isFestiveDay(currentDay, convenio);

  const startMin = parseTimeToMinutes(shift.startTime);
  const endMin = parseTimeToMinutes(shift.endTime);

  // Si no hay horarios definidos o están vacíos, se asume que todo el turno transcurre en el día asignado
  if (startMin === null || endMin === null) {
    return isCurrentDayFestive ? shift.totalHours : 0;
  }

  // Comprobar si el turno cruza la medianoche (termina al día siguiente)
  const crossesMidnight =
    endMin <= startMin && shift.totalHours > 0 && !(startMin === endMin && shift.totalHours === 0);

  if (!crossesMidnight) {
    // El turno no cruza medianoche: transcurre 100% dentro del día actual (00:00 - 24:00)
    // - Turno dentro del festivo → todas festivas
    // - Turno fuera del festivo → ninguna festiva
    return isCurrentDayFestive ? shift.totalHours : 0;
  }

  // El turno cruza la medianoche:
  // Parte 1 (en el día de inicio): Desde startTime hasta las 24:00 (1440 min)
  const minutesPart1 = 1440 - startMin; // e.g. 19:00 -> 1440 - 1140 = 300 min (5h)
  // Parte 2 (en el día siguiente): Desde las 00:00 hasta endTime
  const minutesPart2 = endMin;          // e.g. 08:00 -> 480 min (8h)

  const totalScheduledMinutes = minutesPart1 + minutesPart2;

  let hoursPart1: number;
  let hoursPart2: number;

  if (
    totalScheduledMinutes > 0 &&
    Math.abs(totalScheduledMinutes / 60 - shift.totalHours) > 0.01
  ) {
    // Si shift.totalHours difiere ligeramente por descansos no retribuidos, repartir proporcionalmente
    hoursPart1 = (minutesPart1 / totalScheduledMinutes) * shift.totalHours;
    hoursPart2 = (minutesPart2 / totalScheduledMinutes) * shift.totalHours;
  } else {
    hoursPart1 = minutesPart1 / 60;
    hoursPart2 = minutesPart2 / 60;
  }

  // Determinar si el día siguiente es festivo
  let isNextDayFestive = false;
  if (dayIndex + 1 < days.length) {
    isNextDayFestive = isFestiveDay(days[dayIndex + 1], convenio);
  } else {
    // Fin de mes: calcular si el día 1 del siguiente mes es festivo
    const [y, m, d] = currentDay.dateString.split('-').map(Number);
    const nextDate = new Date(y, m - 1, d + 1);
    isNextDayFestive = isFestiveDate(nextDate, convenio, customHolidays);
  }

  // Aplicación de reglas:
  // - Turno empieza antes del festivo -> solo festivas las horas después de 00:00 (hoursPart2)
  // - Turno empieza en el festivo -> festivas hasta las 24:00 (hoursPart1)
  // - Turno cruza el festivo -> dividir en dos partes (normal + festivo)
  // - Turno dentro del festivo (ambos festivos) -> todas festivas (hoursPart1 + hoursPart2 = totalHours)
  // - Turno fuera del festivo (ninguno festivo) -> ninguna festiva (0)
  let festiveHours = 0;
  if (isCurrentDayFestive) {
    festiveHours += hoursPart1;
  }
  if (isNextDayFestive) {
    festiveHours += hoursPart2;
  }

  return Math.round(festiveHours * 100) / 100;
}

/**
 * Calcula las horas totales anuales de un empleado sumando los turnos
 * realizados del 1 de enero al 31 de diciembre incluidos para el año seleccionado.
 */
export function calculateAnnualHoursForEmployee(
  employeeId: string,
  year: number,
  yearAssignments: Record<number, Record<string, Record<number, string>>> | undefined,
  shifts: ShiftType[]
): number {
  if (!yearAssignments) return 0;
  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  let totalAnnual = 0;
  // Recorrer los 12 meses (1 a 12) del año
  for (let m = 1; m <= 12; m++) {
    const monthAssigns = yearAssignments[m]?.[employeeId];
    if (monthAssigns) {
      Object.values(monthAssigns).forEach(code => {
        if (!code) return;
        const shift = shiftMap.get(code);
        if (shift && shift.totalHours > 0) {
          // Suma turnos de trabajo y vacaciones retribuidas (ej. 5.22h)
          if (!shift.isOffDay || shift.code === 'V') {
            totalAnnual += shift.totalHours;
          }
        }
      });
    }
  }

  return Math.round(totalAnnual * 100) / 100;
}

export function calculateEmployeeStats(
  employee: Employee,
  assignments: Record<number, string> | undefined,
  days: DayInfo[],
  shifts: ShiftType[],
  convenio: ConvenioSettings,
  annualTotalHoursCalculated?: number,
  customHolidays?: Record<string, string>
): EmployeeMonthStats {
  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  let workedDays = 0;
  let totalHours = 0;
  let nightHours = 0;
  let holidayHours = 0;

  if (assignments) {
    days.forEach((day, index) => {
      const code = assignments[day.dayOfMonth];
      if (!code) return;

      const shift = shiftMap.get(code);
      if (!shift || shift.totalHours <= 0) return;
      // Días libres estándar (L) sin horas remuneradas se descartan
      if (shift.isOffDay && shift.code !== 'V') return;

      workedDays++;
      totalHours += shift.totalHours;
      nightHours += shift.nightHours;

      // Horas festivas según las reglas estrictas (las vacaciones no devengan plus festivo)
      if (shift.code !== 'V' && shift.code !== 'BAJA' && !shift.isOffDay) {
        const shiftHoliday = calculateShiftHolidayHours(
          shift,
          index,
          days,
          convenio,
          customHolidays
        );
        holidayHours += shiftHoliday;
      }
    });
  }

  totalHours = Math.round(totalHours * 100) / 100;
  nightHours = Math.round(nightHours * 100) / 100;
  holidayHours = Math.round(holidayHours * 100) / 100;

  const overtimeHours = Math.max(0, Math.round((totalHours - convenio.monthlyStandardHours) * 100) / 100);
  const regularHours = Math.min(totalHours, convenio.monthlyStandardHours);

  // Standard rates
  const baseSalary = regularHours * convenio.baseHourlyRate;
  const nightBonus = nightHours * convenio.nightBonusHourly;
  const holidayBonus = holidayHours * convenio.holidayBonusHourly;
  const overtimePay = overtimeHours * convenio.overtimeHourlyRate;

  // Custom additional economic rates configured in Convenio
  let customRatesTotal = 0;
  const customRatesBreakdown: { name: string; amount: number }[] = [];

  if (convenio.customEconomicRates && Array.isArray(convenio.customEconomicRates)) {
    convenio.customEconomicRates.forEach(rate => {
      let conceptAmount = 0;
      switch (rate.type) {
        case 'monthly_fixed':
          conceptAmount = workedDays > 0 ? rate.amount : 0;
          break;
        case 'hourly_worked':
          conceptAmount = totalHours * rate.amount;
          break;
        case 'per_worked_day':
          conceptAmount = workedDays * rate.amount;
          break;
        case 'hourly_night':
          conceptAmount = nightHours * rate.amount;
          break;
        case 'hourly_holiday':
          conceptAmount = holidayHours * rate.amount;
          break;
        default:
          conceptAmount = rate.amount;
      }

      conceptAmount = Math.round(conceptAmount * 100) / 100;
      if (conceptAmount > 0) {
        customRatesTotal += conceptAmount;
        customRatesBreakdown.push({
          name: rate.name,
          amount: conceptAmount,
        });
      }
    });
  }

  const totalGross =
    baseSalary + nightBonus + holidayBonus + overtimePay + customRatesTotal;

  // Anual: del 1 de enero al 31 de diciembre
  const annualTotal =
    annualTotalHoursCalculated !== undefined
      ? annualTotalHoursCalculated
      : (employee.annualAccumulatedHours || 0) + totalHours;

  const annualRemaining = Math.max(0, convenio.annualStandardHours - annualTotal);

  return {
    employeeId: employee.id,
    workedDays,
    totalHours,
    nightHours,
    holidayHours,
    overtimeHours,
    annualTotalHours: annualTotal,
    annualRemainingHours: annualRemaining,
    estimatedSalary: {
      baseSalary: Math.round(baseSalary * 100) / 100,
      nightBonus: Math.round(nightBonus * 100) / 100,
      holidayBonus: Math.round(holidayBonus * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      customRatesTotal: Math.round(customRatesTotal * 100) / 100,
      customRatesBreakdown,
      totalGross: Math.round(totalGross * 100) / 100,
    },
  };
}

/**
 * Determina si un turno está excluido del cómputo de cobertura presencial del puesto.
 * Vacaciones (V), bajas médicas (BAJA) y descansos (L) computan en las horas del vigilante
 * pero NO deben sumar a la fila COBERTURA (H/DÍA), ya que no cubren presencialmente el puesto.
 */
export function isShiftExcludedFromCoverage(shift: ShiftType): boolean {
  if (shift.isOffDay) return true;
  const upperCode = (shift.code || '').trim().toUpperCase();
  if (upperCode === 'V' || upperCode === 'BAJA' || upperCode === 'L') {
    return true;
  }
  const lowerName = (shift.name || '').toLowerCase();
  if (
    lowerName.includes('vacaci') ||
    lowerName.includes('baja') ||
    lowerName.includes('descanso') ||
    lowerName.includes('libre')
  ) {
    return true;
  }
  return false;
}

export function calculateDailyCoverage(
  days: DayInfo[],
  employees: Employee[],
  assignments: Record<string, Record<number, string>>,
  shifts: ShiftType[]
): Record<number, number> {
  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  const coverage: Record<number, number> = {};

  days.forEach(day => {
    let dayTotal = 0;
    employees.forEach(emp => {
      const empAssigns = assignments[emp.id];
      if (empAssigns) {
        const code = empAssigns[day.dayOfMonth];
        if (code) {
          const shift = shiftMap.get(code);
          if (shift && !isShiftExcludedFromCoverage(shift)) {
            dayTotal += shift.totalHours;
          }
        }
      }
    });
    // Redondear a 2 decimales para evitar artefactos numéricos
    coverage[day.dayOfMonth] = Math.round(dayTotal * 100) / 100;
  });

  return coverage;
}

export interface RestWarning {
  employeeId: string;
  dayOfMonth: number;
  type: 'max_consecutive_days' | 'insufficient_rest';
  message: string;
}

export function validateConvenioRules(
  employee: Employee,
  assignments: Record<number, string> | undefined,
  days: DayInfo[],
  shifts: ShiftType[],
  convenio: ConvenioSettings
): RestWarning[] {
  const warnings: RestWarning[] = [];
  if (!assignments) return warnings;

  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  let consecutiveDays = 0;

  for (let d = 1; d <= days.length; d++) {
    const code = assignments[d];
    const shift = code ? shiftMap.get(code) : undefined;
    const isWorking = shift && !shift.isOffDay && shift.totalHours > 0;

    if (isWorking) {
      consecutiveDays++;
      if (consecutiveDays > convenio.maxConsecutiveWorkingDays) {
        warnings.push({
          employeeId: employee.id,
          dayOfMonth: d,
          type: 'max_consecutive_days',
          message: `${consecutiveDays} días consecutivos de trabajo (máximo ${convenio.maxConsecutiveWorkingDays})`,
        });
      }
    } else {
      consecutiveDays = 0;
    }
  }

  return warnings;
}
