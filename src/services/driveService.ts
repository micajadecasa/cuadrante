import { getAccessToken } from './calendarService';
import {
  ConvenioSettings,
  Employee,
  ShiftType,
} from '../types/quadrant';

export interface QuadrantBackupData {
  app?: string;
  version: string;
  backupDate: string;
  serviceName: string;
  year: number;
  month: number;
  employees: Employee[];
  shifts: ShiftType[];
  yearAssignmentsMap: Record<number, Record<number, Record<string, Record<number, string>>>>;
  allMonths?: Record<number, Record<string, Record<number, string>>>;
  convenio: ConvenioSettings;
  customHolidays: Record<string, string>;
  notes: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

/**
 * Descarga local del archivo de respaldo en formato JSON con toda la configuración y los 12 meses
 */
export function downloadLocalBackup(data: QuadrantBackupData, filename?: string) {
  const dateStr = new Date().toISOString().split('T')[0];
  const defaultName =
    filename ||
    `Cuadrante_Gasteiz_${data.serviceName.replace(/\s+/g, '_')}_Configuracion_Completa_${data.year}_${dateStr}.json`;
  const jsonContent = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Lee y valida un archivo JSON subido por el usuario con la configuración completa
 */
export async function readBackupFile(file: File): Promise<QuadrantBackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validación básica de campos requeridos
        if (!parsed.employees || !Array.isArray(parsed.employees)) {
          throw new Error('El archivo no contiene un listado válido de vigilantes.');
        }
        if (!parsed.shifts || !Array.isArray(parsed.shifts)) {
          throw new Error('El archivo no contiene un catálogo válido de turnos.');
        }
        if (!parsed.yearAssignmentsMap && !parsed.allMonths && !parsed.assignments) {
          throw new Error('El archivo no contiene asignaciones de cuadrante.');
        }

        // Si viene allMonths pero no yearAssignmentsMap
        if (!parsed.yearAssignmentsMap && parsed.allMonths) {
          parsed.yearAssignmentsMap = {
            [parsed.year || 2027]: parsed.allMonths,
          };
        }

        // Compatibilidad con versiones que guardaban assignments en vez de yearAssignmentsMap
        if (!parsed.yearAssignmentsMap && parsed.assignments) {
          parsed.yearAssignmentsMap = {
            [parsed.year || 2027]: {
              [parsed.month || 1]: parsed.assignments,
            },
          };
        }

        resolve(parsed as QuadrantBackupData);
      } catch (err: any) {
        reject(new Error(`Error al leer el archivo de copia: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Error al acceder al archivo.'));
    reader.readAsText(file);
  });
}

/**
 * Sube el archivo de copia directamente a Google Drive usando la API oficial v3
 */
export async function uploadBackupToGoogleDrive(
  data: QuadrantBackupData,
  filename?: string
): Promise<{ fileId: string; name: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google con permisos de Google Drive.');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const name =
    filename ||
    `Cuadrante_Gasteiz_${data.serviceName.replace(/\s+/g, '_')}_Configuracion_Completa_${data.year}_${dateStr}.json`;

  const metadata = {
    name,
    mimeType: 'application/json',
    description: `Copia de seguridad completa anual de CuadrantePro - Gasteiz de Vigilancia creada el ${new Date().toLocaleString('es-ES')}`,
  };

  const fileContent = JSON.stringify(data, null, 2);

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fallo al guardar en Google Drive: ${errorText}`);
  }

  const result = await response.json();
  return { fileId: result.id, name: result.name };
}

/**
 * Lista los archivos de respaldo guardados en Google Drive
 */
export async function listDriveBackups(): Promise<DriveFileInfo[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google.');
  }

  const query = encodeURIComponent("name contains 'Cuadrante_Gasteiz' and trashed = false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Fallo al listar archivos de Google Drive: ${err}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveFileInfo[];
}

/**
 * Descarga y parsea el archivo de respaldo desde Google Drive
 */
export async function downloadBackupFromDrive(fileId: string): Promise<QuadrantBackupData> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo descargar el archivo de copia desde Google Drive.');
  }

  const json = await response.json();
  return json as QuadrantBackupData;
}
