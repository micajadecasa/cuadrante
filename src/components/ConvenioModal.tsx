import React, { useState } from 'react';
import { ConvenioSettings, EconomicRateConcept } from '../types/quadrant';
import { ALAVA_HOLIDAYS_2027 } from '../constants/defaultData';
import {
  Sliders,
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  Calendar,
  Euro,
  HelpCircle,
} from 'lucide-react';

interface ConvenioModalProps {
  isOpen: boolean;
  onClose: () => void;
  convenio: ConvenioSettings;
  onSaveConvenio: (newConvenio: ConvenioSettings) => void;
  customHolidays: Record<string, string>;
  onUpdateHolidays: (holidays: Record<string, string>) => void;
}

export const ConvenioModal: React.FC<ConvenioModalProps> = ({
  isOpen,
  onClose,
  convenio,
  onSaveConvenio,
  customHolidays,
  onUpdateHolidays,
}) => {
  const [formData, setFormData] = useState<ConvenioSettings>({ ...convenio });
  const [holidays, setHolidays] = useState<Record<string, string>>({
    ...customHolidays,
  });
  const [newHolidayDate, setNewHolidayDate] = useState('2027-05-15');
  const [newHolidayName, setNewHolidayName] = useState('Fiesta Local / Patrón');

  // New Custom Rate form
  const [newRateName, setNewRateName] = useState('');
  const [newRateAmount, setNewRateAmount] = useState<number>(50);
  const [newRateType, setNewRateType] = useState<EconomicRateConcept['type']>('monthly_fixed');

  if (!isOpen) return null;

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;

    setHolidays(prev => ({
      ...prev,
      [newHolidayDate]: newHolidayName.trim(),
    }));
    setNewHolidayName('');
  };

  const handleDeleteHoliday = (dateKey: string) => {
    setHolidays(prev => {
      const copy = { ...prev };
      delete copy[dateKey];
      return copy;
    });
  };

  const handleAddCustomRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateName.trim()) return;

    const newConcept: EconomicRateConcept = {
      id: `rate_${Date.now()}`,
      name: newRateName.trim(),
      amount: Number(newRateAmount),
      type: newRateType,
    };

    setFormData(prev => ({
      ...prev,
      customEconomicRates: [...(prev.customEconomicRates || []), newConcept],
    }));

    setNewRateName('');
    setNewRateAmount(50);
  };

  const handleDeleteCustomRate = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customEconomicRates: (prev.customEconomicRates || []).filter(r => r.id !== id),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConvenio(formData);
    onUpdateHolidays(holidays);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configuración del Convenio y Tarifas de Nómina
              </h3>
              <p className="text-xs text-slate-500">
                Parámetros de jornada anual (1 Ene - 31 Dic), festivos y conceptos retributivos
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

        <form onSubmit={handleSave} className="mt-4 space-y-5">
          {/* Section 1: Parameters */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Parámetros de Jornada y Cómputo Anual
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Denominación del Convenio / Sector
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Horas Mes Base
                </label>
                <input
                  type="number"
                  step={1}
                  value={formData.monthlyStandardHours}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      monthlyStandardHours: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
                <span className="text-[10px] text-slate-500">Base: 162h/mes</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Horas Anuales (1 Ene - 31 Dic)
                </label>
                <input
                  type="number"
                  step={1}
                  value={formData.annualStandardHours}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      annualStandardHours: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-700"
                />
                <span className="text-[10px] text-slate-500">1.782h anuales</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Inicio Noche (h)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={formData.nightStartHour}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      nightStartHour: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
                <span className="text-[10px] text-slate-500">22:00</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Fin Noche (h)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={formData.nightEndHour}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      nightEndHour: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
                <span className="text-[10px] text-slate-500">06:00</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={formData.saturdaysCountAsHoliday}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      saturdaysCountAsHoliday: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-800 font-bold">
                  Los Sábados se consideran Festivos (junto a Domingos y Festivos oficiales)
                </span>
              </label>

              <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">Cómputo estricto de horas festivas (00:00 a 24:00):</span> Son festivas únicamente las horas que caen dentro del día festivo. Si un turno cruza la medianoche (antes o después de festivo), se divide automáticamente en horas normales y festivas.
              </div>
            </div>
          </div>

          {/* Section 2: Fixed Standard Rates */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Euro className="w-4 h-4 text-emerald-600" />
              Tarifas Económicas Base
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hora Ordinaria (€/h)
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={formData.baseHourlyRate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      baseHourlyRate: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Plus Nocturnidad (€/h)
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={formData.nightBonusHourly}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      nightBonusHourly: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-purple-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Plus Festividad (€/h)
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={formData.holidayBonusHourly}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      holidayBonusHourly: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-orange-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hora Extra (€/h)
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={formData.overtimeHourlyRate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      overtimeHourlyRate: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Custom Additional Economic Rates (Requested Feature!) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                Tarifas y Pluses Económicos Adicionales de Convenio
              </h4>
              <span className="text-[11px] text-slate-500">
                Añade pluses específicos (Peligrosidad, Transporte, Vestuario, etc.)
              </span>
            </div>

            {/* Form to add custom rate */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Nombre del Plus / Concepto
                </label>
                <input
                  type="text"
                  placeholder="ej. Plus Peligrosidad, Plus Transporte"
                  value={newRateName}
                  onChange={e => setNewRateName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Importe (€)
                </label>
                <input
                  type="number"
                  step={0.01}
                  placeholder="0.00"
                  value={newRateAmount}
                  onChange={e => setNewRateAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Modalidad de Cálculo
                </label>
                <select
                  value={newRateType}
                  onChange={e => setNewRateType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
                >
                  <option value="monthly_fixed">Fijo Mensual (€/mes)</option>
                  <option value="hourly_worked">Por Hora Trabajada (€/h)</option>
                  <option value="per_worked_day">Por Día Trabajado (€/día)</option>
                  <option value="hourly_night">Por Hora Nocturna (€/h)</option>
                  <option value="hourly_holiday">Por Hora Festiva (€/h)</option>
                </select>
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddCustomRate}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Tarifa a la Nómina</span>
                </button>
              </div>
            </div>

            {/* List of custom rates */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {(formData.customEconomicRates || []).length === 0 ? (
                <div className="text-center py-2 text-xs text-slate-400">
                  No hay pluses adicionales creados. Puedes añadir los que necesites.
                </div>
              ) : (
                (formData.customEconomicRates || []).map(rate => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rate.name}</span>
                      <span className="text-slate-500">
                        {rate.type === 'monthly_fixed'
                          ? '(Fijo mensual)'
                          : rate.type === 'hourly_worked'
                          ? '(Por hora trabajada)'
                          : rate.type === 'per_worked_day'
                          ? '(Por día trabajado)'
                          : rate.type === 'hourly_night'
                          ? '(Por hora nocturna)'
                          : '(Por hora festiva)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-emerald-700">
                        {rate.amount.toFixed(2)} €
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomRate(rate.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Eliminar este plus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 4: Festivos Oficiales y Locales */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-600" />
                Calendario de Días Festivos (Álava / Vitoria-Gasteiz)
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-500 font-normal">
                  {Object.keys(holidays).length} festivos
                </span>
                <button
                  type="button"
                  onClick={() => setHolidays(ALAVA_HOLIDAYS_2027)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold text-blue-700 bg-blue-100/70 hover:bg-blue-200 transition cursor-pointer"
                  title="Cargar los 16 días festivos oficiales de Álava para 2027"
                >
                  Restablecer Festivos Álava (2027)
                </button>
              </div>
            </h4>

            {/* Add Holiday Form */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
              <input
                type="date"
                value={newHolidayDate}
                onChange={e => setNewHolidayDate(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="Nombre del festivo (ej. San Prudencio, Virgen Blanca)"
                value={newHolidayName}
                onChange={e => setNewHolidayName(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-xs grow"
              />
              <button
                type="button"
                onClick={handleAddHoliday}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir
              </button>
            </div>

            {/* List of holidays */}
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {Object.entries(holidays)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, name]) => (
                  <div
                    key={dateKey}
                    className="flex items-center justify-between p-1.5 px-2.5 bg-white rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-600">
                        {dateKey}
                      </span>
                      <span className="text-slate-800 font-medium">{name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(dateKey)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                      title="Eliminar festivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Footer Save Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
