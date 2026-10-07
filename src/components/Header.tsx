import React from 'react';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  Sliders,
  Smartphone,
  Bell,
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cloud,
  Upload,
  CalendarX,
} from 'lucide-react';
import { GasteizLogo } from '../constants/logo';

interface HeaderProps {
  year: number;
  month: number;
  serviceName: string;
  isMobileView: boolean;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onServiceNameChange: (name: string) => void;
  onToggleMobileView: () => void;
  onOpenConvenio: () => void;
  onOpenReport: () => void;
  onOpenGoogleSync: () => void;
  onOpenSaveDrive: () => void;
  onOpenUploadBackup: () => void;
  onResetCurrentMonth: () => void;
  onOpenNotifications: () => void;
  onOpenAddEmployee: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onResetToDemo: () => void;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Header: React.FC<HeaderProps> = ({
  year,
  month,
  serviceName,
  isMobileView,
  onYearChange,
  onMonthChange,
  onServiceNameChange,
  onToggleMobileView,
  onOpenConvenio,
  onOpenReport,
  onOpenGoogleSync,
  onOpenSaveDrive,
  onOpenUploadBackup,
  onResetCurrentMonth,
  onOpenNotifications,
  onOpenAddEmployee,
  onExportPDF,
  onExportCSV,
  onResetToDemo,
}) => {
  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Service Name with Official Shield Emblem */}
        <div className="flex items-center gap-3">
          <GasteizLogo className="w-11 h-11" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                GASTEIZ DE VIGILANCIA
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Cuadrante Oficial
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Servicio:</span>
              <input
                type="text"
                value={serviceName}
                onChange={e => onServiceNameChange(e.target.value)}
                className="bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold transition"
                placeholder="Nombre del Puesto o Servicio"
              />
            </div>
          </div>
        </div>

        {/* Date Selector with Current Month Reset Icon */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2 py-1 rounded-xl shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <select
              value={month}
              onChange={e => onMonthChange(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES_ES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                  {name}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={e => onYearChange(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-blue-400 focus:outline-none cursor-pointer"
            >
              {[2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Button (Icon) to reset/clear only the current month's quadrant */}
          <div className="pl-1 border-l border-slate-700">
            <button
              type="button"
              onClick={onResetCurrentMonth}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title={`Restablecer/limpiar los turnos de ${MONTH_NAMES_ES[month - 1]} ${year}`}
            >
              <CalendarX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons in PC View */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile / Worker View toggle */}
          <button
            onClick={onToggleMobileView}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer ${
              isMobileView
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold ring-2 ring-amber-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isMobileView ? 'Volver a PC' : 'Vista Móvil'}</span>
          </button>

          {/* 1. Button to SAVE EVERYTHING to Google Drive */}
          <button
            onClick={onOpenSaveDrive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm cursor-pointer"
            title="Guardar todos los datos y cuadrantes en Google Drive"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Guardar en Drive</span>
          </button>

          {/* 2. Button to UPLOAD / RESTORE saved file or from Drive */}
          <button
            onClick={onOpenUploadBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm cursor-pointer"
            title="Subir archivo .json guardado o restaurar desde Google Drive"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Cuadrante</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm cursor-pointer"
            title="Exportar Cuadrante Oficial a PDF de Gasteiz de Vigilancia"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* Export CSV / Excel */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition shadow-sm cursor-pointer"
            title="Descargar para Microsoft Excel (CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          {/* Google Calendar sync */}
          <button
            onClick={onOpenGoogleSync}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
            title="Sincronizar turnos con Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Calendar</span>
            <span className="sm:hidden">Gmail</span>
          </button>

          {/* Reports */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Informe de Nómina de Gasteiz de Vigilancia"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Informe Nómina</span>
          </button>

          {/* Convenio config */}
          <button
            onClick={onOpenConvenio}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Configurar Convenio, Festivos y Tarifas"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Convenio</span>
          </button>

          {/* Push notification settings */}
          <button
            onClick={onOpenNotifications}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Alertas Push de Turnos"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Add Employee */}
          <button
            onClick={onOpenAddEmployee}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
            title="Añadir Vigilante de Seguridad"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">+ Vigilante</span>
          </button>

          {/* Demo restore */}
          <button
            onClick={onResetToDemo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Restaurar datos originales de Enero 2026"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
