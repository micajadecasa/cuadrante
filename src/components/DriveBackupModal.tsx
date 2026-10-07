import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileJson,
  ShieldCheck,
  LogOut,
  RefreshCw,
  HardDrive,
  FolderOpen,
  Save,
} from 'lucide-react';
import {
  QuadrantBackupData,
  DriveFileInfo,
  downloadLocalBackup,
  readBackupFile,
  uploadBackupToGoogleDrive,
  listDriveBackups,
  downloadBackupFromDrive,
} from '../services/driveService';
import { googleSignIn, logout, initAuth } from '../services/calendarService';
import { User } from 'firebase/auth';

interface DriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackupData: QuadrantBackupData;
  onRestoreBackupData: (data: QuadrantBackupData) => void;
  initialMode?: 'save' | 'load';
}

export const DriveBackupModal: React.FC<DriveBackupModalProps> = ({
  isOpen,
  onClose,
  currentBackupData,
  onRestoreBackupData,
  initialMode = 'save',
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setStatusMessage(null);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = initAuth(
      authSuccessUser => {
        setUser(authSuccessUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  // Load drive files when user is logged in
  useEffect(() => {
    if (isOpen && user) {
      fetchDriveFiles();
    }
  }, [isOpen, user]);

  const fetchDriveFiles = async () => {
    setIsLoadingDriveFiles(true);
    try {
      const files = await listDriveBackups();
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Could not list drive files:', err);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setStatusMessage({
          type: 'success',
          text: `Sesión iniciada como ${res.user.email}.`,
        });
        fetchDriveFiles();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al iniciar sesión: ${err.message}`,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setDriveFiles([]);
  };

  const handleSaveToDrive = async () => {
    setIsSavingDrive(true);
    setStatusMessage(null);
    try {
      const res = await uploadBackupToGoogleDrive(currentBackupData);
      setStatusMessage({
        type: 'success',
        text: `¡Copia guardada con éxito en Google Drive! Archivo: ${res.name}`,
      });
      fetchDriveFiles();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message,
      });
    } finally {
      setIsSavingDrive(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    setIsLoadingDriveFiles(true);
    setStatusMessage(null);
    try {
      const backupData = await downloadBackupFromDrive(fileId);
      onRestoreBackupData(backupData);
      setStatusMessage({
        type: 'success',
        text: `¡Cuadrante restaurado con éxito desde "${fileName}"!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message,
      });
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleDownloadLocal = () => {
    downloadLocalBackup(currentBackupData);
    setStatusMessage({
      type: 'success',
      text: 'Archivo JSON descargado en tu equipo con la configuración completa.',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backupData = await readBackupFile(file);
      onRestoreBackupData(backupData);
      setStatusMessage({
        type: 'success',
        text: `¡Archivo "${file.name}" cargado y restaurado correctamente!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message,
      });
    } finally {
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Google Drive & Respaldo de Cuadrantes
              </h3>
              <p className="text-xs text-slate-500">
                Guarda tus cuadrantes en la nube o sube un archivo para restaurar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('save');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'save'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>1. Guardar en Drive / Local</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('load');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'load'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>2. Subir Archivo / Restaurar</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: GUARDAR */}
        {activeTab === 'save' && (
          <div className="mt-4 space-y-4">
            {/* Google Drive Status & Save */}
            <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-950 block flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    Guardar en Google Drive (Nube)
                  </span>
                  <span className="text-[11px] text-sky-800">
                    {user ? (
                      <span className="text-emerald-700 font-semibold">
                        Conectado: {user.email}
                      </span>
                    ) : (
                      'Inicia sesión con tu cuenta de Google para guardar directamente en tu Drive.'
                    )}
                  </span>
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Cerrar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isLoggingIn}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 shadow-xs cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isLoggingIn ? 'Conectando...' : 'Conectar Google'}</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-600">
                  Guarda vigilantes, todos los meses del año, turnos, tarifas y notas.
                </span>
                <button
                  type="button"
                  disabled={!user || isSavingDrive}
                  onClick={handleSaveToDrive}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isSavingDrive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>{isSavingDrive ? 'Guardando...' : 'Guardar en Drive'}</span>
                </button>
              </div>
            </div>

            {/* Local JSON Download */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-slate-600" />
                  Descargar Copia Local (.JSON)
                </span>
                <span className="text-[11px] text-slate-500">
                  Descarga un archivo JSON en tu PC para tener una copia física de seguridad o traspasarla a otro dispositivo.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadLocal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar (.json)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SUBIR / RESTAURAR */}
        {activeTab === 'load' && (
          <div className="mt-4 space-y-4">
            {/* Upload Local File */}
            <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-950 block flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  Subir Archivo Guardado (.JSON) desde el Ordenador
                </span>
                <span className="text-[11px] text-indigo-800">
                  Selecciona el archivo `.json` guardado para restaurar inmediatamente todo el cuadrante.
                </span>
              </div>
              <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 shrink-0 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Subir Archivo</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Restore from Google Drive */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    Restaurar desde tu Google Drive
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {user
                      ? `Conectado como ${user.email}. Elige una copia para restaurar:`
                      : 'Conecta tu cuenta para ver y restaurar las copias guardadas en Drive.'}
                  </span>
                </div>

                {!user && (
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isLoggingIn}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 shadow-xs cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isLoggingIn ? 'Conectando...' : 'Conectar'}</span>
                  </button>
                )}
              </div>

              {user && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Archivos encontrados en Google Drive:
                    </span>
                    <button
                      type="button"
                      onClick={fetchDriveFiles}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title="Actualizar listado de archivos"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDriveFiles ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-white">
                    {driveFiles.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        {isLoadingDriveFiles
                          ? 'Consultando Google Drive...'
                          : 'No se encontraron copias de CuadrantePro en tu Drive.'}
                      </div>
                    ) : (
                      driveFiles.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs transition"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-900 block truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Modificado: {new Date(file.modifiedTime).toLocaleString('es-ES')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreFromDrive(file.id, file.name)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs transition"
                          >
                            Restaurar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Format Explanation (Viable format for project) */}
        <div className="mt-4 p-3 bg-slate-100/90 rounded-xl text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 border border-slate-200">
          <div className="flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Formato JSON v2.0</strong>: Guarda cuadrante anual completo, {currentBackupData.employees.length} vigilantes, {currentBackupData.shifts.length} turnos, festivos y tarifas.
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">100% Compatible</span>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
