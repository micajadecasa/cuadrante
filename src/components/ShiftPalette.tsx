import React, { useState } from 'react';
import { ShiftType } from '../types/quadrant';
import {
  Eraser,
  Plus,
  Paintbrush,
  Moon,
  Clock,
  Info,
  Trash2,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_SHIFTS } from '../constants/defaultData';
import { ConfirmModal } from './ConfirmModal';

interface ShiftPaletteProps {
  shifts: ShiftType[];
  selectedShiftCode: string | null;
  onSelectShiftCode: (code: string | null) => void;
  onAddShift: (newShift: ShiftType) => void;
  onUpdateShift: (updatedShift: ShiftType) => void;
  onDeleteShift: (shiftId: string) => void;
  onResetShifts: () => void;
}

export const ShiftPalette: React.FC<ShiftPaletteProps> = ({
  shifts,
  selectedShiftCode,
  onSelectShiftCode,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onResetShifts,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<ShiftType | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState('06:00');
  const [formEnd, setFormEnd] = useState('18:00');
  const [formTotalHours, setFormTotalHours] = useState<number | string>(12);
  const [formNightHours, setFormNightHours] = useState<number | string>(0);
  const [formColor, setFormColor] = useState('#0284c7');
  const [formIsOffDay, setFormIsOffDay] = useState(false);

  const openCreateModal = () => {
    setEditingShift(null);
    setFormCode('');
    setFormName('');
    setFormStart('07:00');
    setFormEnd('15:00');
    setFormTotalHours(8);
    setFormNightHours(0);
    setFormColor('#2563eb');
    setFormIsOffDay(false);
    setShowAddModal(true);
  };

  const openEditModal = (shift: ShiftType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingShift(shift);
    setFormCode(shift.code);
    setFormName(shift.name);
    setFormStart(shift.startTime);
    setFormEnd(shift.endTime);
    setFormTotalHours(shift.totalHours);
    setFormNightHours(shift.nightHours);
    setFormColor(shift.color);
    setFormIsOffDay(Boolean(shift.isOffDay));
    setShowAddModal(true);
  };

  const handleDeleteClick = (shift: ShiftType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShiftToDelete(shift);
  };

  const handleConfirmDelete = () => {
    if (shiftToDelete) {
      if (selectedShiftCode === shiftToDelete.code) {
        onSelectShiftCode(null);
      }
      onDeleteShift(shiftToDelete.id);
      setShiftToDelete(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, shiftCode: string) => {
    e.dataTransfer.setData('text/plain', shiftCode);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    const parsedTotal = typeof formTotalHours === 'string'
      ? parseFloat(formTotalHours.replace(',', '.'))
      : Number(formTotalHours);
    const parsedNight = typeof formNightHours === 'string'
      ? parseFloat(formNightHours.replace(',', '.'))
      : Number(formNightHours);

    const validTotalHours = isNaN(parsedTotal) ? 0 : Math.round(parsedTotal * 100) / 100;
    const validNightHours = isNaN(parsedNight) ? 0 : Math.round(parsedNight * 100) / 100;

    const isVacation = formCode.trim().toUpperCase() === 'V';
    // Si es día libre pero no vacaciones y el usuario puso 0, es 0; si puso 5.22, se preserva
    const resolvedTotal = formIsOffDay && !isVacation && validTotalHours === 0 ? 0 : validTotalHours;

    if (editingShift) {
      const updated: ShiftType = {
        ...editingShift,
        code: formCode.trim().toUpperCase(),
        name: formName.trim() || `Turno ${formCode.toUpperCase()}`,
        startTime: formIsOffDay ? '00:00' : formStart,
        endTime: formIsOffDay ? '00:00' : formEnd,
        totalHours: resolvedTotal,
        nightHours: formIsOffDay ? 0 : validNightHours,
        color: formColor,
        isOffDay: formIsOffDay,
      };
      onUpdateShift(updated);
    } else {
      const created: ShiftType = {
        id: `shift_${Date.now()}`,
        code: formCode.trim().toUpperCase(),
        name: formName.trim() || `Turno ${formCode.toUpperCase()}`,
        startTime: formIsOffDay ? '00:00' : formStart,
        endTime: formIsOffDay ? '00:00' : formEnd,
        totalHours: resolvedTotal,
        nightHours: formIsOffDay ? 0 : validNightHours,
        color: formColor,
        textColor: '#FFFFFF',
        isOffDay: formIsOffDay,
      };
      onAddShift(created);
    }

    setShowAddModal(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Shifts List */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1 uppercase tracking-wider">
            <Paintbrush className="w-3.5 h-3.5 text-blue-600" />
            <span>Turnos:</span>
          </div>

          {/* Shift badges */}
          {shifts.map(shift => {
            const isSelected = selectedShiftCode === shift.code;
            return (
              <div
                key={shift.id}
                draggable
                onDragStart={e => handleDragStart(e, shift.code)}
                onClick={() => onSelectShiftCode(isSelected ? null : shift.code)}
                style={{
                  backgroundColor: isSelected ? shift.color : undefined,
                  borderColor: shift.color,
                  color: isSelected ? shift.textColor : '#1e293b',
                }}
                className={`group relative flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-lg border text-xs font-semibold cursor-grab active:cursor-grabbing transition shadow-xs hover:shadow-md select-none ${
                  isSelected
                    ? 'ring-2 ring-offset-1 ring-blue-500 scale-105'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
                title={`Arrastra sobre el cuadrante o haz clic para pintar.\n${shift.name}\nHorario: ${shift.startTime} - ${shift.endTime}\nHoras: ${shift.totalHours}h (Noche: ${shift.nightHours}h)`}
              >
                {/* Code badge */}
                <span
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : shift.color,
                    color: '#ffffff',
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center font-black text-xs shrink-0"
                >
                  {shift.code}
                </span>

                {/* Details */}
                <span className="font-medium text-xs">
                  {shift.isOffDay && (!shift.totalHours || shift.totalHours <= 0) ? (
                    shift.name
                  ) : (
                    <>
                      {shift.startTime && shift.startTime !== '00:00' ? (
                        <span className="font-mono text-[11px] text-slate-600 group-hover:text-slate-900">
                          {shift.startTime}-{shift.endTime}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-700 font-semibold">{shift.name}</span>
                      )}
                      <span className="ml-1 text-[10px] font-bold text-slate-500">
                        ({shift.totalHours}h)
                      </span>
                    </>
                  )}
                </span>

                {/* Night hours icon */}
                {!shift.isOffDay && shift.nightHours > 0 && (
                  <span
                    className="inline-flex items-center text-[10px] text-indigo-600 font-bold ml-0.5"
                    title={`${shift.nightHours}h nocturnas`}
                  >
                    <Moon className="w-3 h-3 inline text-indigo-500 fill-indigo-200" />
                  </span>
                )}

                {/* Action buttons on shift badge: Edit & Delete (With clear touch area and no propagation) */}
                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-300/80">
                  <button
                    type="button"
                    onClick={e => openEditModal(shift, e)}
                    className="p-1 rounded hover:bg-blue-100 text-slate-500 hover:text-blue-700 transition cursor-pointer"
                    title={`Editar horario de ${shift.code}`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={e => handleDeleteClick(shift, e)}
                    className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title={`Eliminar turno ${shift.code} de la paleta`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Eraser Tool */}
          <button
            onClick={() => onSelectShiftCode(selectedShiftCode === 'EMPTY' ? null : 'EMPTY')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition select-none cursor-pointer ${
              selectedShiftCode === 'EMPTY'
                ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-400'
                : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-rose-50 hover:text-rose-700'
            }`}
            title="Borrar turno: haz clic en cualquier día para vaciarlo"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Borrador</span>
          </button>

          {/* Add custom shift */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-blue-400 text-blue-700 bg-blue-50/50 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
            title="Crear un nuevo tipo de turno"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Poner Turno</span>
          </button>

          {/* Reset standard shifts if user deleted too many */}
          {shifts.length < DEFAULT_SHIFTS.length && (
            <button
              onClick={onResetShifts}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 text-xs transition cursor-pointer"
              title="Restaurar turnos estándar por defecto (A, B, C, M, T, N)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right instructions / status */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="hidden sm:inline">
            {selectedShiftCode
              ? selectedShiftCode === 'EMPTY'
                ? 'Modo Borrador activo: haz clic sobre una casilla para vaciarla'
                : `Modo Pintar [${selectedShiftCode}] activo: haz clic para asignar turnos rápidamente`
              : 'Arrastra y suelta turnos en las casillas o usa la papelera para quitarlos.'}
          </span>
          {selectedShiftCode && (
            <button
              onClick={() => onSelectShiftCode(null)}
              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Salir de pintar
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Delete Shift */}
      <ConfirmModal
        isOpen={Boolean(shiftToDelete)}
        title={`Eliminar Turno ${shiftToDelete?.code}`}
        message={`¿Estás seguro de que deseas quitar el turno "${shiftToDelete?.code} - ${shiftToDelete?.name}" (${shiftToDelete?.startTime} a ${shiftToDelete?.endTime}) de la paleta? Ya no podrás asignarlo a los vigilantes.`}
        confirmLabel="Sí, eliminar turno"
        cancelLabel="Cancelar"
        onCancel={() => setShiftToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Add / Edit Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              {editingShift ? `Editar Turno [${editingShift.code}]` : 'Poner / Añadir Nuevo Turno'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código (ej. D, N2, 10H, X)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm uppercase font-bold"
                    placeholder="D"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color Distintivo
                  </label>
                  <input
                    type="color"
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre descriptivo del turno
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm"
                  placeholder="Turno Diurno de 10 horas"
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="formIsOffDay"
                    checked={formIsOffDay}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormIsOffDay(checked);
                      if (checked && formCode.trim().toUpperCase() !== 'V') {
                        setFormTotalHours(0);
                      } else if (checked && formCode.trim().toUpperCase() === 'V' && (!formTotalHours || Number(formTotalHours) === 0)) {
                        setFormTotalHours(5.22);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="formIsOffDay" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Es día libre / descanso / vacaciones / ausencia
                  </label>
                </div>
                {formIsOffDay && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                    <strong>Cómputo:</strong> Los descansos computan 0h. Para <strong>Vacaciones (V)</strong> retribuidas, introduce <strong>5,22h</strong> en "Total Horas" para que sumen al total mensual del trabajador sin añadirse a la cobertura diaria presencial (H/DÍA) del puesto.
                  </p>
                )}
              </div>

              {!formIsOffDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={formStart}
                      onChange={e => setFormStart(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={formEnd}
                      onChange={e => setFormEnd(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Horas {formIsOffDay && '(ej. 5,22 para Vacaciones)'}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formTotalHours}
                    onChange={e => setFormTotalHours(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
                    placeholder="ej. 8 o 5,22"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Permite valores decimales como 5,22
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horas Nocturnas (22-06h)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formNightHours}
                    onChange={e => setFormNightHours(e.target.value)}
                    disabled={formIsOffDay}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  {editingShift ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
