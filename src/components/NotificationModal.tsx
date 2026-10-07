import React, { useState, useEffect } from 'react';
import { Bell, Check, Volume2, ShieldAlert } from 'lucide-react';
import {
  getPushConfig,
  savePushConfig,
  requestNotificationPermission,
  sendLocalPushNotification,
  PushNotificationConfig,
} from '../services/notificationService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<PushNotificationConfig>(getPushConfig());
  const [permission, setPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      const updated = { ...config, enabled: true };
      setConfig(updated);
      savePushConfig(updated);
    }
  };

  const handleTestNotification = () => {
    sendLocalPushNotification('🛡️ Recordatorio de Servicio - CuadrantePro', {
      body: 'Atención: Tu turno de vigilancia comienza en 2 horas. Puesto: Control Principal.',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePushConfig(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Servicio de Notificaciones Push
              </h3>
              <p className="text-xs text-slate-500">
                Avisos automáticos al vigilante antes de entrar al turno
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

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Permission Status */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Permiso de Notificaciones en el Navegador
              </span>
              <span className="text-[11px] text-slate-500">
                Estado:{' '}
                <strong
                  className={
                    permission === 'granted'
                      ? 'text-emerald-600'
                      : permission === 'denied'
                      ? 'text-rose-600'
                      : 'text-amber-600'
                  }
                >
                  {permission === 'granted'
                    ? 'Concedido'
                    : permission === 'denied'
                    ? 'Bloqueado'
                    : 'Pendiente'}
                </strong>
              </span>
            </div>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                Activar Permiso
              </button>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-800">
                Activar avisos de entrada de turno
              </span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Antelación del aviso previo al turno:
              </label>
              <select
                value={config.notifyHoursBefore}
                onChange={e =>
                  setConfig({ ...config, notifyHoursBefore: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value={1}>1 hora antes</option>
                <option value={2}>2 horas antes (Recomendado)</option>
                <option value={3}>3 horas antes</option>
                <option value={4}>4 horas antes</option>
              </select>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={config.soundEnabled}
                  onChange={e => setConfig({ ...config, soundEnabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span>Sonido de alerta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={config.vibrateEnabled}
                  onChange={e => setConfig({ ...config, vibrateEnabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span>Vibración en móvil</span>
              </label>
            </div>
          </div>

          {/* Test Push Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
              <span>{testSent ? '¡Aviso enviado!' : 'Probar Notificación Ahora'}</span>
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Guardar Preferencias
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
