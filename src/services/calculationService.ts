import {
  ConvenioSettings,
  DayInfo,
  Employee,
  EmployeeMonthStats,
  ShiftType,
} from '../types/quadrant';
import { SPANISH_HOLIDAYS_2026 } from '../constants/defaultData';

const DAY_NAMES = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // JavaScript getDay(): 0 is Sunday

export function getDaysInMonth(
  year: number,
  month: number,
  customHolidays?: Record<string, string>
): DayInfo[] {
  const days: DayInfo[] = [];
  const daysCount = new Date(year, month, 0).getDate(); // month is 1-12
  const holidays = customHolidays || SPANISH_HOLIDAYS_2026;

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
        if (shift && !shift.isOffDay && shift.totalHours > 0) {
          totalAnnual += shift.totalHours;
        }
      });
    }
  }

  return totalAnnual;
}

export function calculateEmployeeStats(
  employee: Employee,
  assignments: Record<number, string> | undefined,
  days: DayInfo[],
  shifts: ShiftType[],
  convenio: ConvenioSettings,
  annualTotalHoursCalculated?: number
): EmployeeMonthStats {
  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  let workedDays = 0;
  let totalHours = 0;
  let nightHours = 0;
  let holidayHours = 0;

  if (assignments) {
    days.forEach(day => {
      const code = assignments[day.dayOfMonth];
      if (!code) return;

      const shift = shiftMap.get(code);
      if (!shift || shift.isOffDay || shift.totalHours <= 0) return;

      workedDays++;
      totalHours += shift.totalHours;
      nightHours += shift.nightHours;

      // Festivo si es Domingo, Festivo nacional/local o Sábado (convenio)
      if (isFestiveDay(day, convenio)) {
        holidayHours += shift.totalHours;
      }
    });
  }

  const overtimeHours = Math.max(0, totalHours - convenio.monthlyStandardHours);
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
          if (shift && !shift.isOffDay) {
            dayTotal += shift.totalHours;
          }
        }
      }
    });
    coverage[day.dayOfMonth] = dayTotal;
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
