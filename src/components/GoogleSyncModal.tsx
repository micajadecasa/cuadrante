import React, { useState, useEffect } from 'react';
import { DayInfo, Employee, ShiftType } from '../types/quadrant';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Info,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import {
  googleSignIn,
  logout,
  initAuth,
  getAccessToken,
  buildEventsForWorker,
  syncEventsToGoogleCalendar,
  generateICSContent,
  downloadICSFile,
  ShiftCalendarEvent,
} from '../services/calendarService';
import { User } from 'firebase/auth';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  days: DayInfo[];
  shifts: ShiftType[];
  assignments: Record<string, Record<number, string>>;
  serviceName: string;
  month: number;
  year: number;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  employees,
  days,
  shifts,
  assignments,
  serviceName,
  month,
  year,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    employees[0]?.id || ''
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = initAuth(
      (authSuccessUser, authToken) => {
        setUser(authSuccessUser);
        setToken(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEmployee =
    employees.find(e => e.id === selectedEmpId) || employees[0];
  const empAssigns = currentEmployee ? assignments[currentEmployee.id] || {} : {};

  // Build events for selected employee
  const eventsToSync: ShiftCalendarEvent[] = currentEmployee
    ? buildEventsForWorker(currentEmployee, empAssigns, days, shifts, serviceName)
    : [];

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Error logging into Google:', err);
      alert(`No se pudo iniciar sesión con Google: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  const handleStartSync = () => {
    if (eventsToSync.length === 0) {
      alert('Este vigilante no tiene turnos asignados en este mes.');
      return;
    }
    // Show explicit confirmation dialog as required by Workspace integration guidelines
    setShowConfirmDialog(true);
  };

  const handleExecuteSync = async () => {
    setShowConfirmDialog(false);
    setIsSyncing(true);
    setProgress({ current: 0, total: eventsToSync.length });
    setSyncResult(null);

    try {
      const result = await syncEventsToGoogleCalendar(eventsToSync, (cur, tot) => {
        setProgress({ current: cur, total: tot });
      });
      setSyncResult(result);
    } catch (err: any) {
      alert(`Error al sincronizar con Google Calendar: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadICS = () => {
    if (!currentEmployee) return;
    const ics = generateICSContent(
      eventsToSync,
      `Turnos_${currentEmployee.name}_${MONTH_NAMES_ES[month - 1]}`
    );
    downloadICSFile(
      `Turnos_${currentEmployee.name}_${MONTH_NAMES_ES[month - 1]}_${year}.ics`,
      ics
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sincronización con Google Calendar
              </h3>
              <p className="text-xs text-slate-500">
                Turnos de {MONTH_NAMES_ES[month - 1]} {year} • {serviceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Worker Selector */}
        <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Vigilante a sincronizar:
          </label>
          <select
            value={selectedEmpId}
            onChange={e => {
              setSelectedEmpId(e.target.value);
              setSyncResult(null);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-800"
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.tip ? `(TIP: ${emp.tip})` : ''} - {emp.email || 'Sin email'}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Se sincronizarán {eventsToSync.length} turnos programados en el mes.
          </p>
        </div>

        {/* Google Authentication Section */}
        <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Cuenta de Google / Gmail:
            </span>
            {user && (
              <button
                onClick={handleSignOut}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3 h-3" />
                Cerrar sesión
              </button>
            )}
          </div>

          {user ? (
            <div className="mt-2 flex items-center gap-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                {user.displayName?.[0] || user.email?.[0] || 'G'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user.displayName || 'Usuario de Google'}
                </div>
                <div className="text-[11px] text-slate-600 truncate">{user.email}</div>
              </div>
              <span className="ml-auto text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                Conectado
              </span>
            </div>
          ) : (
            <div className="mt-2.5">
              <p className="text-xs text-slate-600 mb-3">
                Inicia sesión con la cuenta de Google (Gmail) para crear automáticamente los eventos de los turnos en el calendario del vigilante con recordatorios a 2h y 30m.
              </p>
              {/* Official Google Sign-In Styled Button */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>
                  {isLoggingIn ? 'Iniciando sesión...' : 'Conectar con Google'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Progress bar during sync */}
        {isSyncing && progress && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sincronizando con Google Calendar...
              </span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-200"
                style={{
                  width: `${(progress.current / Math.max(1, progress.total)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Sync Success Result */}
        {syncResult && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900">
              <span className="font-bold">¡Sincronización completada! </span>
              Se han añadido {syncResult.success} turnos a Google Calendar.
              {syncResult.failed > 0 && ` (${syncResult.failed} con error).`}
            </div>
          </div>
        )}

        {/* Alternative: Export .ICS file */}
        <div className="mt-4 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-800">
              Descargar archivo .ICS
            </div>
            <div className="text-[11px] text-slate-500">
              Compatible con iPhone, Android y cualquier app de calendario.
            </div>
          </div>
          <button
            onClick={handleDownloadICS}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Descargar
          </button>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={!user || isSyncing || eventsToSync.length === 0}
            onClick={handleStartSync}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Sincronizar a Google Calendar ({eventsToSync.length} turnos)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog (Mandatory per Google Workspace API integration rules) */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-2">
              <AlertCircle className="w-5 h-5" />
              <span>Confirmar sincronización en Google Calendar</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Se crearán <span className="font-bold text-slate-900">{eventsToSync.length} eventos</span> en el calendario de Google de <span className="font-bold text-slate-900">{user?.email}</span> para el vigilante <span className="font-bold text-slate-900">{currentEmployee?.name}</span> con los horarios de cada servicio y recordatorios.
            </p>
            <p className="text-[11px] text-slate-500 mb-4 bg-slate-100 p-2 rounded-lg">
              Esta acción modificará los eventos en tu Google Calendar con el permiso otorgado.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteSync}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
              >
                Confirmar y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
