export interface ShiftType {
  id: string;
  code: string; // e.g. "A", "B", "C", "M", "T", "N", "L", "V"
  name: string; // e.g. "Turno Noche / Tarde", "Diurno 12h", "Noche 12h"
  startTime: string; // "19:00"
  endTime: string; // "08:00"
  totalHours: number; // 13
  nightHours: number; // Hours between 22:00 and 06:00
  color: string; // Hex color
  textColor: string;
  isOffDay?: boolean; // Libre / Descanso / Vacaciones
  description?: string;
}

export interface Employee {
  id: string;
  name: string;
  dni?: string;
  tip?: string; // Número TIP (Tarjeta de Identidad Profesional)
  email?: string;
  phone?: string;
  assignedPost?: string; // e.g. "Control de Accesos", "Puesto Principal 24h"
  annualAccumulatedHours?: number; // Horas base acumuladas si aplica
}

export interface DayInfo {
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  dayOfWeekName: string; // "L", "M", "X", "J", "V", "S", "D"
  dateString: string; // "2027-01-01"
  isSunday: boolean;
  isSaturday: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

export interface EconomicRateConcept {
  id: string;
  name: string; // e.g. "Plus Peligrosidad", "Plus Transporte", "Plus Vestuario"
  amount: number; // Valor en euros
  type: 'monthly_fixed' | 'hourly_worked' | 'per_worked_day' | 'hourly_night' | 'hourly_holiday';
  description?: string;
}

export interface ConvenioSettings {
  name: string;
  monthlyStandardHours: number; // 162
  annualStandardHours: number; // 1782 (1 Enero - 31 Diciembre)
  nightStartHour: number; // 22 (22:00)
  nightEndHour: number; // 6 (06:00)
  saturdaysCountAsHoliday: boolean; // TRUE (Los sábados también se consideran festivos)
  minRestBetweenShiftsHours: number; // 13
  maxConsecutiveWorkingDays: number; // 6
  // Fixed standard rates
  baseHourlyRate: number; // e.g. 8.85 €/h
  nightBonusHourly: number; // Plus nocturnidad e.g. 1.34 €/h
  holidayBonusHourly: number; // Plus festividad e.g. 1.42 €/h
  overtimeHourlyRate: number; // Hora extra e.g. 11.50 €/h
  // Custom additional rates
  customEconomicRates: EconomicRateConcept[];
}

export interface EmployeeMonthStats {
  employeeId: string;
  workedDays: number;
  totalHours: number;
  nightHours: number;
  holidayHours: number; // Domingos, Sábados y Festivos
  overtimeHours: number;
  annualTotalHours: number; // Calculado de 1 Ene a 31 Dic
  annualRemainingHours: number; // Horas restantes para alcanzar jornada anual (1.782h)
  estimatedSalary: {
    baseSalary: number;
    nightBonus: number;
    holidayBonus: number;
    overtimePay: number;
    customRatesTotal: number;
    customRatesBreakdown: { name: string; amount: number }[];
    totalGross: number;
  };
}

export interface QuadrantYearData {
  [year: number]: {
    [month: number]: Record<string, Record<number, string>>; // month (1-12) -> employeeId -> dayOfMonth -> shiftCode
  };
}
