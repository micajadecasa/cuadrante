import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Layers,
  Download,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  ConvenioSettings,
  Employee,
  EmployeeMonthStats,
  ShiftType,
} from '../types/quadrant';
import {
  MONTH_NAMES_ES,
  exportAnnualQuadrantToPDF,
  exportQuadrantToPDF,
} from '../services/exportService';
import {
  calculateAnnualHoursForEmployee,
  calculateDailyCoverage,
  calculateEmployeeStats,
  getDaysInMonth,
} from '../services/calculationService';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number;
  serviceName: string;
  employees: Employee[];
  shifts: ShiftType[];
  yearAssignmentsMap: Record<number, Record<number, Record<string, Record<number, string>>>>;
  convenio: ConvenioSettings;
  customHolidays: Record<string, string>;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  currentYear,
  currentMonth,
  serviceName,
  employees,
  shifts,
  yearAssignmentsMap,
  convenio,
  customHolidays,
}) => {
  const [mode, setMode] = useState<'single_month' | 'all_12_months'>('single_month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sincronizar mes y año con la pantalla principal al abrir
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
  }, [isOpen, currentMonth, currentYear]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      if (mode === 'single_month') {
        // Calcular datos del mes específico elegido
        const days = getDaysInMonth(selectedYear, selectedMonth, customHolidays);
        const yearData = yearAssignmentsMap[selectedYear] || {};
        const monthAssignments = yearData[selectedMonth] || {};

        const statsMap = new Map<string, EmployeeMonthStats>();
        employees.forEach(emp => {
          const empAssigns = monthAssignments[emp.id];
          const annualHours = calculateAnnualHoursForEmployee(
            emp.id,
            selectedYear,
            yearData,
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
          statsMap.set(emp.id, stats);
        });

        const coverage = calculateDailyCoverage(
          days,
          employees,
          monthAssignments,
          shifts
        );

        await exportQuadrantToPDF(
          selectedYear,
          selectedMonth,
          serviceName,
          days,
          employees,
          monthAssignments,
          statsMap,
          coverage,
          shifts,
          convenio
        );
      } else {
        // Generar los 12 meses en un único PDF
        await exportAnnualQuadrantToPDF({
          year: selectedYear,
          serviceName,
          employees,
          yearAssignmentsMap,
          shifts,
          convenio,
          customHolidays,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error al exportar cuadrante a PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedMonthName = MONTH_NAMES_ES[selectedMonth - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Descargar Cuadrante Oficial en PDF
              </h3>
              <p className="text-xs text-slate-500">
                Gasteiz de Vigilancia • Formato horizontal A4 homologado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question & Options */}
        <div className="mt-5 space-y-3.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            ¿Qué período deseas descargar?
          </label>

          {/* Option 1: Single Month */}
          <div
            onClick={() => setMode('single_month')}
            className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-2.5 ${
              mode === 'single_month'
                ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="export_pdf_mode"
                  id="mode_single"
                  checked={mode === 'single_month'}
                  onChange={() => setMode('single_month')}
                  className="w-4 h-4 text-rose-600 cursor-pointer"
                />
                <label
                  htmlFor="mode_single"
                  className="text-sm font-bold text-slate-900 cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-rose-600" />
                  Descargar un mes específico
                </label>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                1 Página A4
              </span>
            </div>

            <p className="text-xs text-slate-500 pl-6">
              Genera el cuadrante oficial del mes que elijas con desglose de turnos, cobertura diaria y horas acumuladas.
            </p>

            {/* Selectors for Month and Year when single_month is selected */}
            {mode === 'single_month' && (
              <div className="grid grid-cols-2 gap-2.5 pl-6 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mes a descargar:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs"
                  >
                    {MONTH_NAMES_ES.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Año:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs"
                  >
                    {[2027, 2028, 2029, 2030].map(yr => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Option 2: All 12 Months */}
          <div
            onClick={() => setMode('all_12_months')}
            className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-2.5 ${
              mode === 'all_12_months'
                ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="export_pdf_mode"
                  id="mode_all_12"
                  checked={mode === 'all_12_months'}
                  onChange={() => setMode('all_12_months')}
                  className="w-4 h-4 text-rose-600 cursor-pointer"
                />
                <label
                  htmlFor="mode_all_12"
                  className="text-sm font-bold text-slate-900 cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Descargar los 12 meses (Año completo)
                </label>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                12 Páginas A4
              </span>
            </div>

            <p className="text-xs text-slate-500 pl-6">
              Genera un único archivo PDF con todo el año completo (de Enero a Diciembre, una página por mes) con cálculo de horas, cómputo anual y casillas de firma.
            </p>

            {mode === 'all_12_months' && (
              <div className="pl-6 pt-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Año del cuadrante anual:
                </label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="w-1/2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs"
                >
                  {[2027, 2028, 2029, 2030].map(yr => (
                    <option key={yr} value={yr}>
                      Año {yr} completo
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Document Info Card */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span>Servicio:</span>
            <span className="font-bold text-slate-900">{serviceName}</span>
          </div>
          <div className="flex items-center justify-between font-medium">
            <span>Vigilantes incluidos:</span>
            <span className="font-bold text-slate-900">{employees.length} vigilantes</span>
          </div>
          <div className="flex items-center justify-between font-medium pt-1 border-t border-slate-200 text-[11px]">
            <span>Documento generado:</span>
            <span className="font-bold text-rose-700">
              {mode === 'single_month'
                ? `Cuadrante_${selectedMonthName}_${selectedYear}.pdf (1 pág.)`
                : `Cuadrante_Completo_${selectedYear}_12_Meses.pdf (12 págs.)`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {mode === 'single_month'
                    ? `Descargar ${selectedMonthName}`
                    : `Descargar los 12 Meses`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
