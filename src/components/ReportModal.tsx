import React, { useState } from 'react';
import {
  ConvenioSettings,
  DayInfo,
  Employee,
  EmployeeMonthStats,
  ShiftType,
} from '../types/quadrant';
import {
  Printer,
  Copy,
  Check,
  Shield,
  Download,
  Calendar,
  Euro,
  FileSpreadsheet,
} from 'lucide-react';
import { exportQuadrantToPDF } from '../services/exportService';
import { GasteizLogo } from '../constants/logo';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  serviceName: string;
  employees: Employee[];
  days: DayInfo[];
  shifts: ShiftType[];
  assignments: Record<string, Record<number, string>>;
  statsMap: Map<string, EmployeeMonthStats>;
  coverage: Record<number, number>;
  convenio: ConvenioSettings;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  year,
  month,
  serviceName,
  employees,
  days,
  shifts,
  assignments,
  statsMap,
  coverage,
  convenio,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_ES[month - 1];

  // Totals for all employees
  let grandTotalHours = 0;
  let grandNightHours = 0;
  let grandHolidayHours = 0;
  let grandOvertimeHours = 0;
  let grandGrossPayroll = 0;

  statsMap.forEach(stats => {
    grandTotalHours += stats.totalHours;
    grandNightHours += stats.nightHours;
    grandHolidayHours += stats.holidayHours;
    grandOvertimeHours += stats.overtimeHours;
    grandGrossPayroll += stats.estimatedSalary.totalGross;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    exportQuadrantToPDF(
      year,
      month,
      serviceName,
      days,
      employees,
      assignments,
      statsMap,
      coverage,
      shifts,
      convenio
    );
  };

  const handleCopySummary = () => {
    let text = `GASTEIZ DE VIGILANCIA - INFORME MENSUAL Y NÓMINA\n`;
    text += `Servicio: ${serviceName} | Período: ${monthName} ${year}\n\n`;
    text += `Vigilante\tDías\tHoras\tFestivos\tNoches\tExtras\tAnual(1Ene-31Dic)\tBruto Est.\n`;

    employees.forEach(emp => {
      const s = statsMap.get(emp.id);
      if (s) {
        text += `${emp.name}\t${s.workedDays}\t${s.totalHours}h\t${s.holidayHours}h\t${s.nightHours}h\t${s.overtimeHours}h\t${s.annualTotalHours}h\t${s.estimatedSalary.totalGross.toFixed(2)}€\n`;
      }
    });

    text += `\nTOTALES: ${grandTotalHours}h totales | ${grandNightHours}h nocturnas | ${grandHolidayHours}h festivas | Total Nómina: ${grandGrossPayroll.toFixed(2)}€\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach(s => shiftMap.set(s.code, s));

  const currentEmp = employees.find(e => e.id === selectedEmpId);
  const currentEmpAssigns = currentEmp ? assignments[currentEmp.id] || {} : {};
  const currentEmpStats = currentEmp ? statsMap.get(currentEmp.id) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-2">
        {/* Header with Gasteiz de Vigilancia Logo */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b-2 border-slate-900 gap-3">
          <div className="flex items-center gap-3">
            {/* Official Logo Shield */}
            <GasteizLogo className="w-14 h-14" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  GASTEIZ DE VIGILANCIA
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Seguridad Privada
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                INFORME MENSUAL DE SERVICIO Y GESTIÓN DE NÓMINA • {serviceName.toUpperCase()}
              </p>
              <p className="text-[11px] text-slate-500">
                Período: <strong className="text-slate-800">{monthName} {year}</strong> | Cómputo Anual: <strong className="text-slate-800">1 de Enero al 31 de Diciembre</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
              title="Copiar texto resumen"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
              title="Descargar Cuadrante PDF Oficial"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Oficial</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
              title="Imprimir informe"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* View mode selector */}
        <div className="mt-3 flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
          <button
            onClick={() => setSelectedEmpId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedEmpId === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Parte General del Servicio (Todo el Equipo)
          </button>
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmpId(emp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedEmpId === emp.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Vigilante: {emp.name}
            </button>
          ))}
        </div>

        {selectedEmpId === 'ALL' ? (
          /* General Summary Table */
          <div className="mt-4 space-y-4">
            {/* Global Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Horas Totales Mes</span>
                <span className="text-xl font-black text-slate-900">{grandTotalHours} h</span>
                <span className="text-[10px] text-slate-500 block">Plantilla: {employees.length} vigilantes</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                <span className="text-[11px] font-semibold text-purple-700 block">Horas Nocturnas (22-06h)</span>
                <span className="text-xl font-black text-purple-900">{grandNightHours} h</span>
                <span className="text-[10px] text-purple-600 block">Tarifa: {convenio.nightBonusHourly} €/h</span>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                <span className="text-[11px] font-semibold text-orange-700 block">Horas Festivas (Sáb/Dom/Fest)</span>
                <span className="text-xl font-black text-orange-900">{grandHolidayHours} h</span>
                <span className="text-[10px] text-orange-600 block">Tarifa: {convenio.holidayBonusHourly} €/h</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-700 block">Nómina Bruta Estimada</span>
                <span className="text-xl font-black text-emerald-900">{grandGrossPayroll.toFixed(2)} €</span>
                <span className="text-[10px] text-emerald-600 block">Total retribución equipo</span>
              </div>
            </div>

            {/* Detailed Table matching official document */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-2.5">Vigilante</th>
                    <th className="p-2.5">TIP / DNI</th>
                    <th className="p-2.5 text-center">Días</th>
                    <th className="p-2.5 text-center">Horas Mes</th>
                    <th className="p-2.5 text-center bg-orange-800">Festivas*</th>
                    <th className="p-2.5 text-center bg-purple-800">Noches</th>
                    <th className="p-2.5 text-center">Extras</th>
                    <th className="p-2.5 text-center bg-blue-900">Anual (1Ene-31Dic)</th>
                    <th className="p-2.5 text-right">Base</th>
                    <th className="p-2.5 text-right">Pluses</th>
                    <th className="p-2.5 text-right font-black bg-emerald-900">Total Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {employees.map((emp, idx) => {
                    const st = statsMap.get(emp.id);
                    const pluses =
                      (st?.estimatedSalary.nightBonus || 0) +
                      (st?.estimatedSalary.holidayBonus || 0) +
                      (st?.estimatedSalary.overtimePay || 0) +
                      (st?.estimatedSalary.customRatesTotal || 0);

                    return (
                      <tr
                        key={emp.id}
                        className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
                      >
                        <td className="p-2.5 font-bold text-slate-900">{emp.name}</td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                          {emp.tip ? `TIP ${emp.tip}` : emp.dni || '-'}
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-800">{st?.workedDays ?? 0}</td>
                        <td className="p-2.5 text-center font-black text-blue-900">{st?.totalHours ?? 0}h</td>
                        <td className="p-2.5 text-center font-bold text-orange-700 bg-orange-50/50">{st?.holidayHours ?? 0}h</td>
                        <td className="p-2.5 text-center font-bold text-purple-700 bg-purple-50/50">{st?.nightHours ?? 0}h</td>
                        <td className="p-2.5 text-center font-semibold text-amber-700">
                          {st?.overtimeHours ? `+${st.overtimeHours}h` : '0h'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-900 bg-blue-50/50">
                          {st?.annualTotalHours ?? 0}h / {convenio.annualStandardHours}h
                        </td>
                        <td className="p-2.5 text-right text-slate-700">
                          {(st?.estimatedSalary.baseSalary ?? 0).toFixed(2)} €
                        </td>
                        <td className="p-2.5 text-right text-slate-700 font-medium">
                          +{pluses.toFixed(2)} €
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-800 bg-emerald-50/80">
                          {(st?.estimatedSalary.totalGross ?? 0).toFixed(2)} €
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5" colSpan={2}>TOTALES SERVICIO</td>
                    <td className="p-2.5 text-center">
                      {Array.from(statsMap.values()).reduce((a, b) => a + b.workedDays, 0)}
                    </td>
                    <td className="p-2.5 text-center text-blue-900">{grandTotalHours}h</td>
                    <td className="p-2.5 text-center text-orange-700">{grandHolidayHours}h</td>
                    <td className="p-2.5 text-center text-purple-700">{grandNightHours}h</td>
                    <td className="p-2.5 text-center text-amber-700">+{grandOvertimeHours}h</td>
                    <td className="p-2.5 text-center text-blue-900">
                      {Array.from(statsMap.values()).reduce((a, b) => a + b.annualTotalHours, 0)}h
                    </td>
                    <td className="p-2.5 text-right" colSpan={2}>TOTAL ESTIMADO:</td>
                    <td className="p-2.5 text-right text-emerald-800 bg-emerald-100">
                      {grandGrossPayroll.toFixed(2)} €
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * Nota: Según convenio y configuración actual, los sábados, domingos y días festivos computan con plus de festividad.
            </p>

            {/* Official Signatures Section */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                <span className="font-bold text-slate-800 block mb-8">
                  Por Gasteiz de Vigilancia (Firma y Sello)
                </span>
                <span className="text-[10px] text-slate-400">Dirección de Operaciones / Recursos Humanos</span>
              </div>

              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                <span className="font-bold text-slate-800 block mb-8">
                  Conformidad Representación de los Trabajadores
                </span>
                <span className="text-[10px] text-slate-400">Delegados de Prevención y Personal</span>
              </div>
            </div>
          </div>
        ) : (
          /* Individual Guard Parte Mensual */
          currentEmp && currentEmpStats && (
            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-slate-900">{currentEmp.name}</h4>
                  <p className="text-xs text-slate-600">
                    DNI: {currentEmp.dni || 'N/A'} • TIP: {currentEmp.tip || 'N/A'} • Puesto: {currentEmp.assignedPost || serviceName}
                  </p>
                  <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                    Horas anuales acumuladas (1 Ene - 31 Dic): {currentEmpStats.annualTotalHours}h / {convenio.annualStandardHours}h
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Total Nómina Bruta Estimada:</span>
                  <span className="text-xl font-black text-emerald-700">
                    {currentEmpStats.estimatedSalary.totalGross.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Economic Breakdown detail */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="font-bold text-slate-800 pb-1 border-b border-slate-100">
                  Desglose Retributivo del Mes:
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Salario Base ({currentEmpStats.totalHours - currentEmpStats.overtimeHours}h x {convenio.baseHourlyRate}€):</span>
                  <span className="font-semibold">{currentEmpStats.estimatedSalary.baseSalary.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-0.5 text-purple-700">
                  <span>Plus Nocturnidad ({currentEmpStats.nightHours}h x {convenio.nightBonusHourly}€):</span>
                  <span className="font-semibold">+{currentEmpStats.estimatedSalary.nightBonus.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-0.5 text-orange-700">
                  <span>Plus Festividad ({currentEmpStats.holidayHours}h x {convenio.holidayBonusHourly}€):</span>
                  <span className="font-semibold">+{currentEmpStats.estimatedSalary.holidayBonus.toFixed(2)} €</span>
                </div>
                {currentEmpStats.overtimeHours > 0 && (
                  <div className="flex justify-between py-0.5 text-amber-700">
                    <span>Horas Extras ({currentEmpStats.overtimeHours}h x {convenio.overtimeHourlyRate}€):</span>
                    <span className="font-semibold">+{currentEmpStats.estimatedSalary.overtimePay.toFixed(2)} €</span>
                  </div>
                )}
                {currentEmpStats.estimatedSalary.customRatesBreakdown.map((cr, i) => (
                  <div key={i} className="flex justify-between py-0.5 text-slate-700">
                    <span>{cr.name}:</span>
                    <span className="font-semibold">+{cr.amount.toFixed(2)} €</span>
                  </div>
                ))}
              </div>

              {/* Day-by-day table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Día</th>
                      <th className="p-2">Turno</th>
                      <th className="p-2">Horario</th>
                      <th className="p-2 text-center">Horas</th>
                      <th className="p-2 text-center">Noches</th>
                      <th className="p-2 text-center">Festivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {days.map(d => {
                      const code = currentEmpAssigns[d.dayOfMonth];
                      const shift = code ? shiftMap.get(code) : null;
                      if (!shift || shift.isOffDay) return null;

                      const isFest = d.isHoliday || d.isSunday || (convenio.saturdaysCountAsHoliday && d.isSaturday);

                      return (
                        <tr key={d.dayOfMonth} className="hover:bg-slate-50">
                          <td className="p-2 font-mono">{d.dateString}</td>
                          <td className="p-2 font-bold">{d.dayOfWeekName}</td>
                          <td className="p-2">
                            <span
                              style={{ backgroundColor: shift.color }}
                              className="px-2 py-0.5 rounded text-white font-bold text-[10px]"
                            >
                              Turno {shift.code}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600">{shift.startTime} - {shift.endTime}</td>
                          <td className="p-2 text-center font-bold text-slate-900">{shift.totalHours}h</td>
                          <td className="p-2 text-center font-bold text-purple-700">{shift.nightHours}h</td>
                          <td className="p-2 text-center">
                            {isFest ? (
                              <span className="text-orange-600 font-bold">Sí</span>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
