export interface PushNotificationConfig {
  enabled: boolean;
  notifyHoursBefore: number; // e.g. 2 hours before shift
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

const STORAGE_KEY = 'cuadrante_push_config';

export function getPushConfig(): PushNotificationConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading push config:', e);
  }
  return {
    enabled: false,
    notifyHoursBefore: 2,
    soundEnabled: true,
    vibrateEnabled: true,
  };
}

export function savePushConfig(config: PushNotificationConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving push config:', e);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    alert('Las notificaciones web no están soportadas en este navegador.');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export function sendLocalPushNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'shift-reminder',
      });
    } catch (e) {
      console.error('Error enviando notificación:', e);
    }
  }
}
