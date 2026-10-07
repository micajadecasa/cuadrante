import React, { useState } from 'react';
import {
  ConvenioSettings,
  DayInfo,
  Employee,
  EmployeeMonthStats,
  ShiftType,
} from '../types/quadrant';
import {
  AlertTriangle,
  Trash2,
  Edit2,
  HelpCircle,
} from 'lucide-react';
import { validateConvenioRules } from '../services/calculationService';
import { ConfirmModal } from './ConfirmModal';

interface QuadrantGridProps {
  days: DayInfo[];
  employees: Employee[];
  shifts: ShiftType[];
  assignments: Record<string, Record<number, string>>;
  statsMap: Map<string, EmployeeMonthStats>;
  coverage: Record<number, number>;
  convenio: ConvenioSettings;
  selectedShiftCode: string | null;
  onAssignShift: (employeeId: string, dayOfMonth: number, shiftCode: string | null) => void;
  onMoveShift: (
    sourceEmpId: string,
    sourceDay: number,
    targetEmpId: string,
    targetDay: number,
    shiftCode: string
  ) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

export const QuadrantGrid: React.FC<QuadrantGridProps> = ({
  days,
  employees,
  shifts,
  assignments,
  statsMap,
  coverage,
  convenio,
  selectedShiftCode,
  onAssignShift,
  onMoveShift,
  onEditEmployee,
  onDeleteEmployee,
}) => {
  const [activeCellMenu, setActiveCellMenu] = useState<{
    employeeId: string;
    dayOfMonth: number;
    x: number;
    y: number;
  } | null>(null);

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  // Cell Drag Start
  const handleCellDragStart = (
    e: React.DragEvent,
    employeeId: string,
    dayOfMonth: number,
    shiftCode: string
  ) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', shiftCode);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ employeeId, dayOfMonth, shiftCode })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  // Cell Drop Handler
  const handleCellDrop = (
    e: React.DragEvent,
    targetEmpId: string,
    targetDay: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const cellDataRaw = e.dataTransfer.getData('application/json');
    if (cellDataRaw) {
      try {
        const sourceData = JSON.parse(cellDataRaw);
        if (
          sourceData.employeeId === targetEmpId &&
          sourceData.dayOfMonth === targetDay
        ) {
          return;
        }

        onMoveShift(
          sourceData.employeeId,
          sourceData.dayOfMonth,
          targetEmpId,
          targetDay,
          sourceData.shiftCode
        );
        return;
      } catch (err) {
        // Fallback to text/plain
      }
    }

    // Drag from palette
    const paletteShiftCode = e.dataTransfer.getData('text/plain');
    if (paletteShiftCode) {
      onAssignShift(targetEmpId, targetDay, paletteShiftCode);
    }
  };

  const handleCellDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCellClick = (
    e: React.MouseEvent,
    employeeId: string,
    dayOfMonth: number
  ) => {
    if (selectedShiftCode) {
      if (selectedShiftCode === 'EMPTY') {
        onAssignShift(employeeId, dayOfMonth, null);
      } else {
        onAssignShift(employeeId, dayOfMonth, selectedShiftCode);
      }
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setActiveCellMenu({
        employeeId,
        dayOfMonth,
        x: Math.min(rect.left, window.innerWidth - 220),
        y: Math.min(rect.bottom + 4, window.innerHeight - 260),
      });
    }
  };

  const handleConfirmDeleteEmployee = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="relative bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Scrollable Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)]">
        <table className="w-full border-collapse border border-slate-300 text-xs select-none">
          {/* Header Row 1: Day Numbers (1..31) */}
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
              <th className="sticky left-0 z-30 bg-slate-200/95 backdrop-blur-xs px-3 py-2 text-left font-bold text-slate-900 border-r border-b border-slate-300 min-w-[170px] shadow-xs">
                Día del mes
              </th>
              {days.map(day => {
                const isHoliday = day.isHoliday;
                const isSun = day.isSunday;
                const isSat = day.isSaturday;
                const isFestive = isHoliday || isSun || (convenio.saturdaysCountAsHoliday && isSat);

                return (
                  <th
                    key={day.dayOfMonth}
                    className={`px-1.5 py-1.5 text-center font-bold border-r border-b border-slate-300 min-w-[34px] w-[34px] ${
                      isFestive
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                    title={
                      day.holidayName
                        ? `Festivo: ${day.holidayName}`
                        : isSat
                        ? 'Sábado (Festivo)'
                        : isSun
                        ? 'Domingo (Festivo)'
                        : undefined
                    }
                  >
                    {day.dayOfMonth}
                  </th>
                );
              })}

              {/* Stats column headers */}
              <th className="px-2 py-2 text-center font-bold bg-slate-200 text-slate-800 border-r border-b border-slate-300 min-w-[50px]">
                Días
              </th>
              <th className="px-2 py-2 text-center font-bold bg-blue-100 text-blue-900 border-r border-b border-slate-300 min-w-[62px]">
                Horas
              </th>
              <th className="px-2 py-2 text-center font-bold bg-orange-100 text-orange-900 border-r border-b border-slate-300 min-w-[62px]">
                Festivos*
              </th>
              <th className="px-2 py-2 text-center font-bold bg-purple-100 text-purple-900 border-r border-b border-slate-300 min-w-[62px]">
                Noches
              </th>
              <th
                className="px-2 py-2 text-center font-bold bg-blue-100 text-blue-900 border-r border-b border-slate-300 min-w-[75px]"
                title="Horas acumuladas del 1 de enero al 31 de diciembre incluidos"
              >
                Anual (1Ene-31Dic)
              </th>
              <th className="px-2 py-2 text-center font-bold bg-emerald-100 text-emerald-900 border-b border-slate-300 min-w-[75px]">
                Nómina Est.
              </th>
            </tr>

            {/* Header Row 2: Weekday Names (L, M, X, J, V, S, D) */}
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-300">
              <th className="sticky left-0 z-30 bg-slate-100/95 backdrop-blur-xs px-3 py-1.5 text-left font-semibold text-slate-700 border-r border-b border-slate-300 shadow-xs">
                Día semana
              </th>
              {days.map(day => {
                const isHoliday = day.isHoliday;
                const isSun = day.isSunday;
                const isSat = day.isSaturday;
                const isFestive = isHoliday || isSun || (convenio.saturdaysCountAsHoliday && isSat);

                return (
                  <th
                    key={day.dayOfMonth}
                    className={`px-1 py-1 text-center font-semibold text-[11px] border-r border-b border-slate-300 ${
                      isFestive
                        ? 'bg-red-100 text-red-900 font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    {day.dayOfWeekName}
                  </th>
                );
              })}

              <th className="border-r border-b border-slate-300 bg-slate-50"></th>
              <th className="border-r border-b border-slate-300 bg-blue-50/50"></th>
              <th className="border-r border-b border-slate-300 bg-orange-50/50"></th>
              <th className="border-r border-b border-slate-300 bg-purple-50/50"></th>
              <th className="border-r border-b border-slate-300 bg-blue-50/50"></th>
              <th className="border-b border-slate-300 bg-emerald-50/50"></th>
            </tr>
          </thead>

          {/* Employee Rows */}
          <tbody>
            {employees.map(employee => {
              const empAssigns = assignments[employee.id] || {};
              const empStats = statsMap.get(employee.id);
              const warnings = validateConvenioRules(
                employee,
                empAssigns,
                days,
                shifts,
                convenio
              );

              return (
                <tr
                  key={employee.id}
                  className="hover:bg-blue-50/30 transition-colors border-b border-slate-200"
                >
                  {/* Sticky Employee Name Column */}
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50/40 px-3 py-2 border-r border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {employee.name}
                          </span>
                          {warnings.length > 0 && (
                            <span
                              className="text-amber-500 cursor-help"
                              title={warnings.map(w => w.message).join('\n')}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 inline text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          {employee.tip ? `TIP: ${employee.tip}` : employee.assignedPost || 'Seguridad'}
                        </div>
                      </div>

                      {/* Edit / Delete actions with clear clickable buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditEmployee(employee);
                          }}
                          className="p-1 hover:bg-blue-100 text-slate-500 hover:text-blue-700 rounded transition cursor-pointer"
                          title="Editar vigilante"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {employees.length > 1 && (
                          <button
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEmployeeToDelete(employee);
                            }}
                            className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Eliminar del cuadrante"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Day Cells (1..31) */}
                  {days.map(day => {
                    const shiftCode = empAssigns[day.dayOfMonth];
                    const shift = shiftCode ? shiftMap.get(shiftCode) : undefined;
                    const isFestive =
                      day.isHoliday ||
                      day.isSunday ||
                      (convenio.saturdaysCountAsHoliday && day.isSaturday);

                    let colBg = 'bg-white';
                    if (isFestive) colBg = 'bg-red-50/40';

                    return (
                      <td
                        key={day.dayOfMonth}
                        onDragOver={handleCellDragOver}
                        onDrop={e => handleCellDrop(e, employee.id, day.dayOfMonth)}
                        onClick={e => handleCellClick(e, employee.id, day.dayOfMonth)}
                        className={`p-0 text-center border-r border-slate-200 relative cursor-pointer select-none transition ${colBg} hover:ring-2 hover:ring-blue-400 hover:z-10`}
                      >
                        {shift ? (
                          <div
                            draggable
                            onDragStart={e =>
                              handleCellDragStart(e, employee.id, day.dayOfMonth, shiftCode!)
                            }
                            style={{
                              backgroundColor: shift.color,
                              color: shift.textColor,
                            }}
                            className="w-full h-8 flex items-center justify-center font-bold text-xs cursor-grab active:cursor-grabbing transition shadow-xs hover:brightness-95"
                            title={`${employee.name} - Día ${day.dayOfMonth}\nTurno: ${shift.name}\nHorario: ${shift.startTime} - ${shift.endTime}\nHoras: ${shift.totalHours}h (Noche: ${shift.nightHours}h)\n${
                              isFestive ? 'DÍA FESTIVO' : ''
                            }\n(Arrastra para mover a otro día o vigilante)`}
                          >
                            <span>{shift.code}</span>
                          </div>
                        ) : (
                          <div className="w-full h-8 flex items-center justify-center text-slate-300 hover:bg-blue-100/50">
                            {/* Empty slot */}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Employee Totals */}
                  <td className="px-2 py-1.5 text-center font-bold text-slate-700 border-r border-slate-300 bg-slate-50">
                    {empStats?.workedDays ?? 0}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-center font-black border-r border-slate-300 ${
                      (empStats?.totalHours ?? 0) > convenio.monthlyStandardHours
                        ? 'bg-amber-100 text-amber-900'
                        : (empStats?.totalHours ?? 0) >= convenio.monthlyStandardHours - 5
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                    title={`Horas ordinarias + extras del mes.\nJornada base de convenio: ${convenio.monthlyStandardHours}h`}
                  >
                    {empStats?.totalHours ?? 0}
                  </td>
                  <td
                    className="px-2 py-1.5 text-center font-bold text-orange-800 border-r border-slate-300 bg-orange-50/50"
                    title="Horas en Sábados, Domingos y Festivos oficiales"
                  >
                    {empStats?.holidayHours ?? 0}
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold text-purple-800 border-r border-slate-300 bg-purple-50/50">
                    {empStats?.nightHours ?? 0}
                  </td>
                  <td
                    className="px-2 py-1.5 text-center font-bold text-blue-900 border-r border-slate-300 bg-blue-50/50"
                    title={`Cómputo anual del 1 de enero al 31 de diciembre incluidos.\nJornada anual convenio: ${convenio.annualStandardHours}h\nRestante anual: ${empStats?.annualRemainingHours ?? 0}h`}
                  >
                    {(empStats?.annualTotalHours ?? 0).toFixed(0)}h
                  </td>
                  <td className="px-2 py-1.5 text-center font-black text-emerald-800 bg-emerald-50/60">
                    {(empStats?.estimatedSalary.totalGross ?? 0).toFixed(2)} €
                  </td>
                </tr>
              );
            })}

            {/* Bottom Row: Cobertura Diaria */}
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <td className="sticky left-0 z-20 bg-slate-200 px-3 py-2 text-left font-black text-slate-900 border-r border-slate-300 shadow-xs flex items-center justify-between">
                <span>COBERTURA (H/DÍA)</span>
                <span title="Suma total de horas de vigilancia asignadas cada día. Verde = 24h cubiertas, Naranja = 12h/13h, Rojo = 0h sin cubrir">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                </span>
              </td>

              {days.map(day => {
                const hours = coverage[day.dayOfMonth] || 0;
                let covBg = 'bg-red-500 text-white font-black';
                if (hours >= 24) {
                  covBg = 'bg-emerald-600 text-white font-black';
                } else if (hours > 0) {
                  covBg = 'bg-amber-400 text-slate-900 font-bold';
                }

                return (
                  <td
                    key={day.dayOfMonth}
                    className={`p-1 text-center border-r border-slate-300 text-xs ${covBg}`}
                    title={`Día ${day.dayOfMonth}: ${hours} horas cubiertas`}
                  >
                    {hours}
                  </td>
                );
              })}

              {/* Total month coverage */}
              <td className="border-r border-slate-300 bg-slate-200"></td>
              <td className="px-2 py-2 text-center font-black text-blue-900 bg-blue-100 border-r border-slate-300">
                {Object.values(coverage).reduce((acc, curr) => acc + curr, 0)}
              </td>
              <td className="border-r border-slate-300 bg-slate-200"></td>
              <td className="border-r border-slate-300 bg-slate-200"></td>
              <td className="border-r border-slate-300 bg-slate-200"></td>
              <td className="border-slate-300 bg-slate-200"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal to Delete Employee */}
      <ConfirmModal
        isOpen={Boolean(employeeToDelete)}
        title={`Eliminar Vigilante: ${employeeToDelete?.name}`}
        message={`¿Estás seguro de que deseas eliminar a "${employeeToDelete?.name}" del cuadrante? Se eliminarán todas sus asignaciones de turnos de este mes.`}
        confirmLabel="Sí, eliminar vigilante"
        cancelLabel="Cancelar"
        onCancel={() => setEmployeeToDelete(null)}
        onConfirm={handleConfirmDeleteEmployee}
      />

      {/* Quick Cell Pop-up Menu */}
      {activeCellMenu && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-2.5 w-52 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: activeCellMenu.y, left: activeCellMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
            <span className="text-[11px] font-bold text-slate-700">
              Día {activeCellMenu.dayOfMonth} - Asignar Turno
            </span>
            <button
              onClick={() => setActiveCellMenu(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {shifts.map(shift => (
              <button
                key={shift.id}
                onClick={() => {
                  onAssignShift(
                    activeCellMenu.employeeId,
                    activeCellMenu.dayOfMonth,
                    shift.code
                  );
                  setActiveCellMenu(null);
                }}
                style={{
                  borderColor: shift.color,
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left text-xs hover:shadow-xs transition"
              >
                <span
                  style={{ backgroundColor: shift.color }}
                  className="w-4 h-4 rounded text-white flex items-center justify-center font-bold text-[10px]"
                >
                  {shift.code}
                </span>
                <span className="truncate text-[11px] font-medium text-slate-800">
                  {shift.startTime ? `${shift.totalHours}h` : shift.code}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onAssignShift(
                activeCellMenu.employeeId,
                activeCellMenu.dayOfMonth,
                null
              );
              setActiveCellMenu(null);
            }}
            className="w-full text-center text-xs py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold transition"
          >
            Quitar Turno (Vaciar)
          </button>
        </div>
      )}

      {/* Global dismiss for popup menu */}
      {activeCellMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveCellMenu(null)}
        />
      )}
    </div>
  );
};
