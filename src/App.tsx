import React, { useState, useEffect, useMemo } from 'react';
import {
  ConvenioSettings,
  Employee,
  ShiftType,
} from './types/quadrant';
import {
  DEFAULT_ASSIGNMENTS_ENERO_2027,
  DEFAULT_CONVENIO,
  DEFAULT_EMPLOYEES,
  DEFAULT_SHIFTS,
  ALAVA_HOLIDAYS_2027,
} from './constants/defaultData';
import {
  calculateAnnualHoursForEmployee,
  calculateDailyCoverage,
  calculateEmployeeStats,
  getDaysInMonth,
} from './services/calculationService';
import { exportQuadrantToPDF } from './services/exportService';
import { Header } from './components/Header';
import { ShiftPalette } from './components/ShiftPalette';
import { QuadrantGrid } from './components/QuadrantGrid';
import { WorkerMobileView } from './components/WorkerMobileView';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { ConvenioModal } from './components/ConvenioModal';
import { ReportModal } from './components/ReportModal';
import { EmployeeModal } from './components/EmployeeModal';
import { NotificationModal } from './components/NotificationModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DriveBackupModal } from './components/DriveBackupModal';
import { QuadrantBackupData } from './services/driveService';
import { Calendar as CalendarIcon } from 'lucide-react';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const STORAGE_KEYS = {
  YEAR: 'cuadrante_year',
  MONTH: 'cuadrante_month',
  SERVICE_NAME: 'cuadrante_service_name',
  EMPLOYEES: 'cuadrante_employees',
  SHIFTS: 'cuadrante_shifts',
  ALL_YEAR_ASSIGNMENTS: 'cuadrante_year_assignments_map',
  CONVENIO: 'cuadrante_convenio',
  HOLIDAYS: 'cuadrante_custom_holidays_2027',
  NOTES: 'cuadrante_notes',
};

export default function App() {
  const [year, setYear] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.YEAR);
    const parsed = saved ? Number(saved) : 2027;
    // Si estaba guardado 2025 o 2026, forzar 2027
    return parsed === 2025 || parsed === 2026 ? 2027 : parsed;
  });

  const [month, setMonth] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MONTH);
    return saved ? Number(saved) : 1; // Enero
  });

  const [serviceName, setServiceName] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICE_NAME);
    return saved || 'Servicio de Seguridad 24 Horas';
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });

  const [shifts, setShifts] = useState<ShiftType[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return saved ? JSON.parse(saved) : DEFAULT_SHIFTS;
  });

  // Multimonth assignments map: [year][month][employeeId][day] = shiftCode
  const [yearAssignmentsMap, setYearAssignmentsMap] = useState<
    Record<number, Record<number, Record<string, Record<number, string>>>>
  >(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_YEAR_ASSIGNMENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[2027]) return parsed;
        // Si venía de 2026, migrar asignaciones iniciales a 2027
        return {
          ...parsed,
          2027: parsed[2026] || { 1: DEFAULT_ASSIGNMENTS_ENERO_2027 },
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      2027: {
        1: DEFAULT_ASSIGNMENTS_ENERO_2027,
      },
    };
  });

  const [convenio, setConvenio] = useState<ConvenioSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONVENIO);
    return saved ? JSON.parse(saved) : DEFAULT_CONVENIO;
  });

  const [customHolidays, setCustomHolidays] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...ALAVA_HOLIDAYS_2027, ...parsed };
      } catch {
        return ALAVA_HOLIDAYS_2027;
      }
    }
    return ALAVA_HOLIDAYS_2027;
  });

  const [notes, setNotes] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
    return (
      saved ||
      'GASTEIZ DE VIGILANCIA - NOTAS Y COMENTARIOS:\nA= 19.00 – 08.00 (13h)   B= 08.00 – 20.00 (12h)   C= 20.00 – 08.00 (12h)\nServicio ininterrumpido 24h. Los sábados, domingos y festivos devengan plus de festividad.'
    );
  });

  // Current month's assignments
  const currentMonthAssignments = useMemo(() => {
    return yearAssignmentsMap[year]?.[month] || {};
  }, [yearAssignmentsMap, year, month]);

  // UI state
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedShiftCode, setSelectedShiftCode] = useState<string | null>(null);

  // Modals state
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [isConvenioOpen, setIsConvenioOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetMonthConfirmOpen, setIsResetMonthConfirmOpen] = useState(false);
  const [isDriveBackupOpen, setIsDriveBackupOpen] = useState(false);
  const [driveBackupInitialMode, setDriveBackupInitialMode] = useState<'save' | 'load'>('save');

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.YEAR, String(year));
    localStorage.setItem(STORAGE_KEYS.MONTH, String(month));
    localStorage.setItem(STORAGE_KEYS.SERVICE_NAME, serviceName);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
    localStorage.setItem(
      STORAGE_KEYS.ALL_YEAR_ASSIGNMENTS,
      JSON.stringify(yearAssignmentsMap)
    );
    localStorage.setItem(STORAGE_KEYS.CONVENIO, JSON.stringify(convenio));
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(customHolidays));
    localStorage.setItem(STORAGE_KEYS.NOTES, notes);
  }, [
    year,
    month,
    serviceName,
    employees,
    shifts,
    yearAssignmentsMap,
    convenio,
    customHolidays,
    notes,
  ]);

  // Days in selected month
  const days = useMemo(
    () => getDaysInMonth(year, month, customHolidays),
    [year, month, customHolidays]
  );

  // Calculated Stats per employee (Counting annual hours from 1 Ene to 31 Dic inclusively!)
  const statsMap = useMemo(() => {
    const map = new Map();
    const currentYearData = yearAssignmentsMap[year];

    employees.forEach(emp => {
      const empAssigns = currentMonthAssignments[emp.id];
      // Annual hours computed across all months (1..12) of the selected year
      const annualHours = calculateAnnualHoursForEmployee(
        emp.id,
        year,
        currentYearData,
        shifts
      );

      const stats = calculateEmployeeStats(
        emp,
        empAssigns,
        days,
        shifts,
        convenio,
        annualHours,
        customHolidays
      );
      map.set(emp.id, stats);
    });
    return map;
  }, [employees, currentMonthAssignments, days, shifts, convenio, year, yearAssignmentsMap, customHolidays]);

  // Daily coverage sum
  const coverage = useMemo(
    () => calculateDailyCoverage(days, employees, currentMonthAssignments, shifts),
    [days, employees, currentMonthAssignments, shifts]
  );

  // Assign shift
  const handleAssignShift = (
    employeeId: string,
    dayOfMonth: number,
    shiftCode: string | null
  ) => {
    setYearAssignmentsMap(prev => {
      const yearCopy = { ...(prev[year] || {}) };
      const monthCopy = { ...(yearCopy[month] || {}) };
      const empCopy = { ...(monthCopy[employeeId] || {}) };

      if (!shiftCode) {
        delete empCopy[dayOfMonth];
      } else {
        empCopy[dayOfMonth] = shiftCode;
      }

      monthCopy[employeeId] = empCopy;
      yearCopy[month] = monthCopy;
      return {
        ...prev,
        [year]: yearCopy,
      };
    });
  };

  // Move shift from cell to cell
  const handleMoveShift = (
    sourceEmpId: string,
    sourceDay: number,
    targetEmpId: string,
    targetDay: number,
    shiftCode: string
  ) => {
    setYearAssignmentsMap(prev => {
      const yearCopy = { ...(prev[year] || {}) };
      const monthCopy = { ...(yearCopy[month] || {}) };
      const sourceEmpCopy = { ...(monthCopy[sourceEmpId] || {}) };
      const targetEmpCopy = { ...(monthCopy[targetEmpId] || {}) };

      delete sourceEmpCopy[sourceDay];
      targetEmpCopy[targetDay] = shiftCode;

      monthCopy[sourceEmpId] = sourceEmpCopy;
      monthCopy[targetEmpId] = targetEmpCopy;
      yearCopy[month] = monthCopy;

      return {
        ...prev,
        [year]: yearCopy,
      };
    });
  };

  // Shift Management (Add, Update, Delete, Reset)
  const handleAddShift = (newShift: ShiftType) => {
    setShifts(prev => [...prev, newShift]);
  };

  const handleUpdateShift = (updatedShift: ShiftType) => {
    setShifts(prev =>
      prev.map(s => (s.id === updatedShift.id ? updatedShift : s))
    );
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
  };

  const handleResetShifts = () => {
    setShifts(DEFAULT_SHIFTS);
  };

  // Employee Management
  const handleSaveEmployee = (emp: Employee) => {
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = emp;
        return copy;
      } else {
        return [...prev, emp];
      }
    });
  };

  const handleDeleteEmployee = (empId: string) => {
    setEmployees(prev => prev.filter(e => e.id !== empId));
    setYearAssignmentsMap(prev => {
      const yearCopy = { ...(prev[year] || {}) };
      const monthCopy = { ...(yearCopy[month] || {}) };
      delete monthCopy[empId];
      yearCopy[month] = monthCopy;
      return { ...prev, [year]: yearCopy };
    });
  };

  const handleExecuteResetToDemo = () => {
    setYear(2027);
    setMonth(1);
    setEmployees(DEFAULT_EMPLOYEES);
    setShifts(DEFAULT_SHIFTS);
    setYearAssignmentsMap({
      2027: {
        1: DEFAULT_ASSIGNMENTS_ENERO_2027,
      },
    });
    setConvenio(DEFAULT_CONVENIO);
    setCustomHolidays(ALAVA_HOLIDAYS_2027);
    setNotes(
      'GASTEIZ DE VIGILANCIA - NOTAS Y COMENTARIOS:\nA= 19.00 – 08.00 (13h)   B= 08.00 – 20.00 (12h)   C= 20.00 – 08.00 (12h)\nServicio ininterrumpido 24h. Los sábados, domingos y festivos devengan plus de festividad.'
    );
    setIsResetConfirmOpen(false);
  };

  const handleExecuteResetCurrentMonth = () => {
    setYearAssignmentsMap(prev => {
      const yearCopy = { ...(prev[year] || {}) };
      yearCopy[month] = {};
      return {
        ...prev,
        [year]: yearCopy,
      };
    });
    setIsResetMonthConfirmOpen(false);
  };

  const currentBackupData: QuadrantBackupData = useMemo(() => {
    // Garantizar que todos los 12 meses (1 a 12) del año estén formalmente estructurados
    const completeYearAssignments: Record<number, Record<number, Record<string, Record<number, string>>>> = {
      ...yearAssignmentsMap,
    };

    const currentYearMonths = { ...(completeYearAssignments[year] || {}) };
    for (let m = 1; m <= 12; m++) {
      if (!currentYearMonths[m]) {
        currentYearMonths[m] = {};
      }
    }
    completeYearAssignments[year] = currentYearMonths;

    // Mapa explícito con los 12 meses del año actual para acceso directo
    const allMonths: Record<number, Record<string, Record<number, string>>> = {};
    for (let m = 1; m <= 12; m++) {
      allMonths[m] = currentYearMonths[m] || {};
    }

    return {
      app: 'CuadrantePro - Gasteiz de Vigilancia',
      version: '2.0.0',
      backupDate: new Date().toISOString(),
      serviceName,
      year,
      month,
      employees,
      shifts,
      convenio,
      customHolidays,
      notes,
      yearAssignmentsMap: completeYearAssignments,
      allMonths,
    };
  }, [
    serviceName,
    year,
    month,
    employees,
    shifts,
    yearAssignmentsMap,
    convenio,
    customHolidays,
    notes,
  ]);

  const handleRestoreBackupData = (data: QuadrantBackupData) => {
    if (data.serviceName) setServiceName(data.serviceName);
    if (data.year) setYear(data.year);
    if (data.month) setMonth(data.month);
    if (data.employees && Array.isArray(data.employees)) setEmployees(data.employees);
    if (data.shifts && Array.isArray(data.shifts)) setShifts(data.shifts);

    // Restaurar los 12 meses completos del cuadrante
    if (data.yearAssignmentsMap && typeof data.yearAssignmentsMap === 'object') {
      setYearAssignmentsMap(data.yearAssignmentsMap);
    } else if (data.allMonths && typeof data.allMonths === 'object') {
      const yr = data.year || year;
      setYearAssignmentsMap(prev => ({
        ...prev,
        [yr]: data.allMonths!,
      }));
    } else if ((data as any).assignments) {
      const yr = data.year || year;
      const mo = data.month || month;
      setYearAssignmentsMap(prev => ({
        ...prev,
        [yr]: {
          ...(prev[yr] || {}),
          [mo]: (data as any).assignments,
        },
      }));
    }

    if (data.convenio) setConvenio(data.convenio);
    if (data.customHolidays) setCustomHolidays(data.customHolidays);
    if (typeof data.notes === 'string') setNotes(data.notes);
  };

  const handleExportPDF = () => {
    exportQuadrantToPDF(
      year,
      month,
      serviceName,
      days,
      employees,
      currentMonthAssignments,
      statsMap,
      coverage,
      shifts,
      convenio
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        year={year}
        month={month}
        serviceName={serviceName}
        isMobileView={isMobileView}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onServiceNameChange={setServiceName}
        onToggleMobileView={() => setIsMobileView(prev => !prev)}
        onOpenConvenio={() => setIsConvenioOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        onOpenSaveDrive={() => {
          setDriveBackupInitialMode('save');
          setIsDriveBackupOpen(true);
        }}
        onOpenUploadBackup={() => {
          setDriveBackupInitialMode('load');
          setIsDriveBackupOpen(true);
        }}
        onResetCurrentMonth={() => setIsResetMonthConfirmOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAddEmployee={() => {
          setEmployeeToEdit(null);
          setIsEmployeeModalOpen(true);
        }}
        onExportPDF={handleExportPDF}
      />

      {isMobileView ? (
        /* Mobile / Worker View */
        <WorkerMobileView
          days={days}
          employees={employees}
          shifts={shifts}
          assignments={currentMonthAssignments}
          statsMap={statsMap}
          serviceName={serviceName}
          year={year}
          month={month}
          convenio={convenio}
          onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
          onBackToDesktop={() => setIsMobileView(false)}
        />
      ) : (
        /* Desktop Cuadrante View */
        <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 gap-4">
          {/* Shift Palette with Add/Remove/Edit capability */}
          <ShiftPalette
            shifts={shifts}
            selectedShiftCode={selectedShiftCode}
            onSelectShiftCode={setSelectedShiftCode}
            onAddShift={handleAddShift}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
            onResetShifts={handleResetShifts}
          />

          {/* Main Grid */}
          <QuadrantGrid
            days={days}
            employees={employees}
            shifts={shifts}
            assignments={currentMonthAssignments}
            statsMap={statsMap}
            coverage={coverage}
            convenio={convenio}
            selectedShiftCode={selectedShiftCode}
            onAssignShift={handleAssignShift}
            onMoveShift={handleMoveShift}
            onEditEmployee={emp => {
              setEmployeeToEdit(emp);
              setIsEmployeeModalOpen(true);
            }}
            onDeleteEmployee={handleDeleteEmployee}
          />

          {/* Bottom Row: Notes & Mini Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
            {/* Notes and Comments */}
            <div className="md:col-span-2 bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  NOTAS Y COMENTARIOS DEL SERVICIO (GASTEIZ DE VIGILANCIA):
                </h3>
                <span className="text-[11px] text-slate-400">
                  Se incluirán en el informe mensual y exportaciones
                </span>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                placeholder="Añade instrucciones del servicio, sustituciones, turnos especiales..."
              />
            </div>

            {/* Quick Summary Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    Resumen del Mes ({days.length} días)
                  </h3>
                  <span className="text-[11px] font-black text-amber-600">
                    GV
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Vigilantes en plantilla:</span>
                    <span className="font-bold text-slate-900">{employees.length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Jornada mensual base:</span>
                    <span className="font-bold text-slate-900">
                      {convenio.monthlyStandardHours} horas
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Cómputo anual (1 Ene - 31 Dic):</span>
                    <span className="font-bold text-blue-700">
                      {convenio.annualStandardHours} horas
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tramo nocturno (22-06h):</span>
                    <span className="font-bold text-purple-700">
                      {convenio.nightBonusHourly} €/h
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Festivos (incl. Sábados):</span>
                    <span className="font-bold text-red-600">
                      {days.filter(d => d.isHoliday || d.isSunday || d.isSaturday).length} días
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="w-1/2 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center transition shadow-xs"
                >
                  Ver Nómina
                </button>
                <button
                  onClick={() => setIsGoogleSyncOpen(true)}
                  className="w-1/2 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold text-center transition shadow-xs"
                >
                  Sincronizar Gmail
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Modals */}
      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
        employees={employees}
        days={days}
        shifts={shifts}
        assignments={currentMonthAssignments}
        serviceName={serviceName}
        month={month}
        year={year}
      />

      <ConvenioModal
        isOpen={isConvenioOpen}
        onClose={() => setIsConvenioOpen(false)}
        convenio={convenio}
        onSaveConvenio={setConvenio}
        customHolidays={customHolidays}
        onUpdateHolidays={setCustomHolidays}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        year={year}
        month={month}
        serviceName={serviceName}
        employees={employees}
        days={days}
        shifts={shifts}
        assignments={currentMonthAssignments}
        statsMap={statsMap}
        coverage={coverage}
        convenio={convenio}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEmployeeToEdit(null);
        }}
        employeeToEdit={employeeToEdit}
        onSaveEmployee={handleSaveEmployee}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Restaurar Cuadrante Original"
        message="¿Estás seguro de que deseas restablecer los datos de ejemplo del Excel de Enero 2027 (Amador, Roberto, Gabriel, VS4)? Se sobreescribirán los cambios de este mes."
        confirmLabel="Sí, restaurar plantilla"
        cancelLabel="Cancelar"
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={handleExecuteResetToDemo}
      />

      <ConfirmModal
        isOpen={isResetMonthConfirmOpen}
        title={`Restablecer Parte de ${MONTH_NAMES_ES[month - 1]} ${year}`}
        message={`¿Estás seguro de que deseas vaciar y restablecer todas las asignaciones de turnos de ${MONTH_NAMES_ES[month - 1]} de ${year}? Los vigilantes dados de alta, el catálogo de turnos y el resto de meses del año no se modificarán.`}
        confirmLabel="Sí, vaciar turnos del mes"
        cancelLabel="Cancelar"
        onCancel={() => setIsResetMonthConfirmOpen(false)}
        onConfirm={handleExecuteResetCurrentMonth}
      />

      <DriveBackupModal
        isOpen={isDriveBackupOpen}
        onClose={() => setIsDriveBackupOpen(false)}
        currentBackupData={currentBackupData}
        onRestoreBackupData={handleRestoreBackupData}
        initialMode={driveBackupInitialMode}
      />
    </div>
  );
}
