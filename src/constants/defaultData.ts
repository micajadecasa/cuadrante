import { ConvenioSettings, Employee, ShiftType } from '../types/quadrant';

export const DEFAULT_SHIFTS: ShiftType[] = [
  {
    id: 'shift_a',
    code: 'A',
    name: 'Turno A (19:00 - 08:00)',
    startTime: '19:00',
    endTime: '08:00',
    totalHours: 13,
    nightHours: 8, // 22:00 to 06:00
    color: '#3B82F6', // Blue
    textColor: '#FFFFFF',
    description: 'Turno nocturno/tarde largo de 13 horas',
  },
  {
    id: 'shift_b',
    code: 'B',
    name: 'Turno B (08:00 - 20:00)',
    startTime: '08:00',
    endTime: '20:00',
    totalHours: 12,
    nightHours: 0,
    color: '#10B981', // Emerald green
    textColor: '#FFFFFF',
    description: 'Turno diurno continuo de 12 horas',
  },
  {
    id: 'shift_c',
    code: 'C',
    name: 'Turno C (20:00 - 08:00)',
    startTime: '20:00',
    endTime: '08:00',
    totalHours: 12,
    nightHours: 8, // 22:00 to 06:00
    color: '#8B5CF6', // Purple
    textColor: '#FFFFFF',
    description: 'Turno nocturno continuo de 12 horas',
  },
  {
    id: 'shift_m',
    code: 'M',
    name: 'Turno Mañana (07:00 - 15:00)',
    startTime: '07:00',
    endTime: '15:00',
    totalHours: 8,
    nightHours: 0,
    color: '#F59E0B', // Amber
    textColor: '#FFFFFF',
    description: 'Jornada ordinaria mañana 8 horas',
  },
  {
    id: 'shift_t',
    code: 'T',
    name: 'Turno Tarde (15:00 - 23:00)',
    startTime: '15:00',
    endTime: '23:00',
    totalHours: 8,
    nightHours: 1, // 22:00 to 23:00
    color: '#EC4899', // Pink
    textColor: '#FFFFFF',
    description: 'Jornada ordinaria tarde 8 horas',
  },
  {
    id: 'shift_n',
    code: 'N',
    name: 'Turno Noche (23:00 - 07:00)',
    startTime: '23:00',
    endTime: '07:00',
    totalHours: 8,
    nightHours: 7, // 23:00 to 06:00
    color: '#6366F1', // Indigo
    textColor: '#FFFFFF',
    description: 'Jornada ordinaria noche 8 horas',
  },
  {
    id: 'shift_l',
    code: 'L',
    name: 'Descanso / Libre',
    startTime: '00:00',
    endTime: '00:00',
    totalHours: 0,
    nightHours: 0,
    color: '#E2E8F0',
    textColor: '#475569',
    isOffDay: true,
    description: 'Día libre reglamentario',
  },
  {
    id: 'shift_v',
    code: 'V',
    name: 'Vacaciones',
    startTime: '00:00',
    endTime: '00:00',
    totalHours: 0,
    nightHours: 0,
    color: '#FEF08A',
    textColor: '#854D0E',
    isOffDay: true,
    description: 'Vacaciones retribuidas',
  },
  {
    id: 'shift_baja',
    code: 'BAJA',
    name: 'Baja Médica / IT',
    startTime: '00:00',
    endTime: '00:00',
    totalHours: 0,
    nightHours: 0,
    color: '#FEE2E2',
    textColor: '#991B1B',
    isOffDay: true,
    description: 'Incapacidad Temporal',
  },
];

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp_1',
    name: 'Amador',
    dni: '45892147K',
    tip: '184920',
    phone: '+34 612 345 678',
    email: 'amador.vigilante@gmail.com',
    assignedPost: 'Puesto Principal 24h',
    annualAccumulatedHours: 161,
  },
  {
    id: 'emp_2',
    name: 'Roberto',
    dni: '38192044F',
    tip: '192841',
    phone: '+34 623 456 789',
    email: 'roberto.seguridad@gmail.com',
    assignedPost: 'Puesto Principal 24h',
    annualAccumulatedHours: 164,
  },
  {
    id: 'emp_3',
    name: 'Gabriel',
    dni: '51928371M',
    tip: '175294',
    phone: '+34 634 567 890',
    email: 'gabriel.vigilante@gmail.com',
    assignedPost: 'Puesto Principal 24h',
    annualAccumulatedHours: 161,
  },
  {
    id: 'emp_4',
    name: 'VS4',
    dni: '29384712R',
    tip: '204918',
    phone: '+34 645 678 901',
    email: 'vs4.apoyo@gmail.com',
    assignedPost: 'Refuerzo y Descansos',
    annualAccumulatedHours: 48,
  },
];

// Prepopulated assignments for enero 2027
export const DEFAULT_ASSIGNMENTS_ENERO_2027: Record<string, Record<number, string>> = {
  emp_1: {
    3: 'B',
    4: 'B',
    5: 'C',
    6: 'C',
    7: 'A',
    16: 'A',
    17: 'A',
    18: 'C',
    19: 'C',
    25: 'B',
    26: 'B',
    27: 'A',
    28: 'A',
  },
  emp_2: {
    8: 'A',
    9: 'A',
    10: 'C',
    11: 'C',
    18: 'B',
    19: 'B',
    20: 'A',
    21: 'A',
    22: 'A',
    29: 'A',
    30: 'A',
    31: 'C',
  },
  emp_3: {
    1: 'B',
    3: 'C',
    4: 'C',
    10: 'B',
    11: 'B',
    12: 'A',
    13: 'A',
    14: 'A',
    22: 'A',
    23: 'A',
    24: 'C',
    25: 'C',
    31: 'B',
  },
  emp_4: {
    1: 'C',
    2: 'C',
    5: 'B',
    6: 'B',
  },
};
export const DEFAULT_ASSIGNMENTS_ENERO_2026 = DEFAULT_ASSIGNMENTS_ENERO_2027;

export const DEFAULT_CONVENIO: ConvenioSettings = {
  name: 'Convenio de Seguridad Privada - Gasteiz de Vigilancia',
  monthlyStandardHours: 162,
  annualStandardHours: 1782, // Del 1 de enero al 31 de diciembre incluidos
  nightStartHour: 22,
  nightEndHour: 6,
  saturdaysCountAsHoliday: true, // Los sábados también se consideran festivos
  minRestBetweenShiftsHours: 13,
  maxConsecutiveWorkingDays: 6,
  baseHourlyRate: 8.85,
  nightBonusHourly: 1.34,
  holidayBonusHourly: 1.42,
  overtimeHourlyRate: 11.50,
  customEconomicRates: [
    {
      id: 'rate_peligrosidad',
      name: 'Plus de Peligrosidad',
      amount: 145.20,
      type: 'monthly_fixed',
      description: 'Plus mensual de peligrosidad convenio',
    },
    {
      id: 'rate_transporte',
      name: 'Plus de Transporte',
      amount: 112.50,
      type: 'monthly_fixed',
      description: 'Compensación de gastos de desplazamiento',
    },
    {
      id: 'rate_vestuario',
      name: 'Plus de Vestuario',
      amount: 98.40,
      type: 'monthly_fixed',
      description: 'Mantenimiento de uniforme reglamentario',
    },
  ],
};

// Días Festivos Oficiales de Álava / Vitoria-Gasteiz para 2027
export const ALAVA_HOLIDAYS_2027: Record<string, string> = {
  '2027-01-01': 'Año Nuevo',
  '2027-01-06': 'Reyes Magos',
  '2027-03-25': 'Jueves Santo',
  '2027-03-26': 'Viernes Santo',
  '2027-03-29': 'Lunes de Pascua',
  '2027-04-28': 'San Prudencio (Fiesta de Álava)',
  '2027-05-01': 'Fiesta del Trabajo',
  '2027-07-25': 'Santiago Apóstol',
  '2027-08-05': 'La Virgen Blanca (Fiesta Vitoria-Gasteiz/Álava)',
  '2027-08-15': 'Asunción de la Virgen',
  '2027-10-12': 'Fiesta Nacional de España',
  '2027-10-25': 'Día del País Vasco (Euskadi Eguna)',
  '2027-11-01': 'Todos los Santos',
  '2027-12-06': 'Día de la Constitución',
  '2027-12-08': 'Inmaculada Concepción',
  '2027-12-25': 'Natividad del Señor',
};

// Retrocompatibilidad con referencias anteriores
export const ALAVA_HOLIDAYS_2026: Record<string, string> = ALAVA_HOLIDAYS_2027;
export const SPANISH_HOLIDAYS_2026: Record<string, string> = ALAVA_HOLIDAYS_2027;
