import React, { useState } from 'react';
import {
  ConvenioSettings,
  DayInfo,
  Employee,
  EmployeeMonthStats,
  ShiftType,
} from '../types/quadrant';
import {
  Calendar,
  Clock,
  Moon,
  Shield,
  Download,
  Bell,
  TrendingUp,
  User,
} from 'lucide-react';
import { GasteizLogo } from '../constants/logo';
import {
  buildEventsForWorker,
  downloadICSFile,
  generateICSContent,
} from '../services/calendarService';
import { sendLocalPushNotification } from '../services/notificationService';
import { calculateShiftHolidayHours } from '../services/calculationService';

interface WorkerMobileViewProps {
  days: DayInfo[];
  employees: Employee[];
  shifts: ShiftType[];
  assignments: Record<string, Record<number, string>>;
  statsMap: Map<string, EmployeeMonthStats>;
  serviceName: string;
  year: number;
  month: number;
  convenio: ConvenioSettings;
  onOpenGoogleSync: () => void;
  onBackToDesktop: () => void;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const WorkerMobileView: React.FC<WorkerMobileViewProps> = ({
  days,
  employees,
  shifts,
  assignments,
  statsMap,
  serviceName,
  year,
  month,
  convenio,
  onOpenGoogleSync,
  onBackToDesktop,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    employees[0]?.id || ''
  );

  const currentEmployee =
    employees.find(e => e.id === selectedEmpId) || employees[0];
  const empAssigns = currentEmployee ? assignments[currentEmployee.id] || {} : {};
  const empStats = currentEmployee ? statsMap.get(currentEmployee.id) : undefined;

  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  // Find next upcoming shift
  const today = new Date();
  const currentDayNum = today.getDate();
  const nextShiftDay = days.find(
    d => d.dayOfMonth >= currentDayNum && empAssigns[d.dayOfMonth]
  );
  const nextShiftCode = nextShiftDay ? empAssigns[nextShiftDay.dayOfMonth] : null;
  const nextShift = nextShiftCode ? shiftMap.get(nextShiftCode) : null;

  const handleDownloadICS = () => {
    if (!currentEmployee) return;
    const events = buildEventsForWorker(
      currentEmployee,
      empAssigns,
      days,
      shifts,
      serviceName
    );
    const icsContent = generateICSContent(
      events,
      `Turnos_${currentEmployee.name}_${MONTH_NAMES_ES[month - 1]}`
    );
    downloadICSFile(
      `Turnos_${currentEmployee.name}_${MONTH_NAMES_ES[month - 1]}_${year}.ics`,
      icsContent
    );
  };

  const handleTestPushNotification = () => {
    if (!currentEmployee) return;
    if (nextShift && nextShiftDay) {
      sendLocalPushNotification('🛡️ Gasteiz de Vigilancia - Turno', {
        body: `Hola ${currentEmployee.name}, tu próximo turno es el día ${nextShiftDay.dayOfMonth} a las ${nextShift.startTime} (${nextShift.name}).`,
      });
    } else {
      sendLocalPushNotification('🛡️ Gasteiz de Vigilancia', {
        body: `Hola ${currentEmployee.name}, tus turnos de ${MONTH_NAMES_ES[month - 1]} están asignados correctamente.`,
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-12 shadow-xl border-x border-slate-200">
      {/* Top Mobile App Header */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <GasteizLogo className="w-9 h-9" />
            <div>
              <h2 className="text-sm font-black tracking-tight leading-tight uppercase">
                GASTEIZ DE VIGILANCIA
              </h2>
              <p className="text-[11px] text-slate-400">{serviceName}</p>
            </div>
          </div>

          <button
            onClick={onBackToDesktop}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-2.5 py-1 rounded-lg border border-slate-700 font-medium"
          >
            Ver Cuadrante PC
          </button>
        </div>

        {/* Worker Selector Dropdown */}
        <div className="bg-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-slate-700/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wide">
                Mi Perfil
              </span>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer w-full"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                    {emp.name} {emp.tip ? `(TIP: ${emp.tip})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 shrink-0">
            {MONTH_NAMES_ES[month - 1]} {year}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Next Shift Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-4 shadow-lg relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Próximo Turno de Servicio
            </span>
            {nextShift && (
              <span
                style={{ backgroundColor: nextShift.color }}
                className="px-2 py-0.5 rounded-md text-xs font-black text-white shadow-xs"
              >
                Turno {nextShift.code}
              </span>
            )}
          </div>

          {nextShift && nextShiftDay ? (
            <div>
              <div className="text-xl font-black mb-1">
                Día {nextShiftDay.dayOfMonth} de {MONTH_NAMES_ES[month - 1]}
              </div>
              <div className="text-sm font-medium text-slate-200 mb-2">
                Horario: <span className="font-bold text-white">{nextShift.startTime} a {nextShift.endTime}</span> ({nextShift.totalHours} horas)
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-200">
                {nextShift.nightHours > 0 && (
                  <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                    <Moon className="w-3 h-3 text-indigo-300" />
                    {nextShift.nightHours}h noche
                  </span>
                )}
                {(nextShiftDay.isHoliday || nextShiftDay.isSunday || (convenio.saturdaysCountAsHoliday && nextShiftDay.isSaturday)) && (
                  <span className="flex items-center gap-1 bg-red-500/30 text-red-200 px-2 py-0.5 rounded-md font-bold">
                    Festivo
                  </span>
                )}
                <span className="truncate">{currentEmployee?.assignedPost || serviceName}</span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-slate-300 text-xs">
              No tienes más turnos asignados en este mes.
            </div>
          )}
        </div>

        {/* Sync & Action Buttons (Shift swap button removed as requested) */}
        <div className="grid grid-cols-3 gap-2">
          {/* Sync Google Calendar */}
          <button
            onClick={onOpenGoogleSync}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition text-slate-800 text-center group"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Google Calendar</span>
            <span className="text-[10px] text-slate-500">Sincronizar</span>
          </button>

          {/* Download ICS */}
          <button
            onClick={handleDownloadICS}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition text-slate-800 text-center group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Descargar .ICS</span>
            <span className="text-[10px] text-slate-500">Móvil</span>
          </button>

          {/* Push notification reminder */}
          <button
            onClick={handleTestPushNotification}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-md transition text-slate-800 text-center group"
          >
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Aviso Push</span>
            <span className="text-[10px] text-slate-500">Probar</span>
          </button>
        </div>

        {/* Monthly & Annual Summary */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Nómina Estimada ({MONTH_NAMES_ES[month - 1]})
            </h3>
            <span className="text-xs font-black text-emerald-600">
              {empStats?.estimatedSalary.totalGross.toFixed(2)} € est.
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Días</span>
              <span className="text-sm font-bold text-slate-900">
                {empStats?.workedDays ?? 0}
              </span>
            </div>
            <div className="bg-blue-50/70 rounded-xl p-2 border border-blue-100">
              <span className="text-[10px] text-blue-700 block">Horas Mes</span>
              <span className="text-sm font-black text-blue-900">
                {empStats?.totalHours ?? 0}h
              </span>
            </div>
            <div className="bg-purple-50/70 rounded-xl p-2 border border-purple-100">
              <span className="text-[10px] text-purple-700 block">Noches</span>
              <span className="text-sm font-black text-purple-900">
                {empStats?.nightHours ?? 0}h
              </span>
            </div>
            <div className="bg-orange-50/70 rounded-xl p-2 border border-orange-100">
              <span className="text-[10px] text-orange-700 block">Festivos*</span>
              <span className="text-sm font-black text-orange-900">
                {empStats?.holidayHours ?? 0}h
              </span>
            </div>
          </div>

          {/* Annual Hours (1 Ene - 31 Dic) */}
          <div className="mt-3 p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-blue-950 block">
                Cómputo Anual (1 Ene - 31 Dic):
              </span>
              <span className="text-[11px] text-blue-800">
                Jornada anual de convenio: {convenio.annualStandardHours}h
              </span>
            </div>
            <span className="text-sm font-black text-blue-900">
              {empStats?.annualTotalHours} h
            </span>
          </div>
        </div>

        {/* Daily Schedule List */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Mis Turnos en {MONTH_NAMES_ES[month - 1]}
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {days.map((day, idx) => {
              const code = empAssigns[day.dayOfMonth];
              const shift = code ? shiftMap.get(code) : undefined;
              const isWorking = shift && !shift.isOffDay;
              const isFestive =
                day.isHoliday ||
                day.isSunday ||
                (convenio.saturdaysCountAsHoliday && day.isSaturday);
              const shiftHolidayHours =
                shift && isWorking
                  ? calculateShiftHolidayHours(shift, idx, days, convenio)
                  : 0;

              return (
                <div
                  key={day.dayOfMonth}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                    isWorking
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-100 text-slate-400 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-bold leading-tight ${
                        isFestive
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      <span className="text-[11px]">{day.dayOfMonth}</span>
                      <span className="text-[9px] font-normal">{day.dayOfWeekName}</span>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {isWorking ? (
                          <>
                            <span>{shift?.name}</span>
                            {isFestive && (
                              <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold">
                                Festivo
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500 font-normal">
                            {code === 'V' ? 'Vacaciones' : code === 'BAJA' ? 'Baja Médica' : 'Libre'}
                          </span>
                        )}
                      </div>
                      {isWorking && (
                        <div className="text-[10px] text-slate-500">
                          {shift?.startTime} - {shift?.endTime} ({shift?.totalHours}h)
                          {shift?.nightHours ? ` • ${shift.nightHours}h noche` : ''}
                          {shiftHolidayHours > 0 ? ` • ${shiftHolidayHours}h festiva` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {isWorking ? (
                      <span
                        style={{ backgroundColor: shift?.color }}
                        className="px-2.5 py-1 rounded-lg text-white font-black text-xs shadow-xs"
                      >
                        {shift?.code}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Libre</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
