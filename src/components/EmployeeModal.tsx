import React, { useState, useEffect } from 'react';
import { Employee } from '../types/quadrant';
import { User, ShieldCheck, Check } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
  onSaveEmployee: (employee: Employee) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
  onSaveEmployee,
}) => {
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [tip, setTip] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedPost, setAssignedPost] = useState('');
  const [annualHours, setAnnualHours] = useState(0);

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name);
      setDni(employeeToEdit.dni || '');
      setTip(employeeToEdit.tip || '');
      setEmail(employeeToEdit.email || '');
      setPhone(employeeToEdit.phone || '');
      setAssignedPost(employeeToEdit.assignedPost || '');
      setAnnualHours(employeeToEdit.annualAccumulatedHours || 0);
    } else {
      setName('');
      setDni('');
      setTip('');
      setEmail('');
      setPhone('');
      setAssignedPost('Puesto de Seguridad Principal');
      setAnnualHours(0);
    }
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const emp: Employee = {
      id: employeeToEdit ? employeeToEdit.id : `emp_${Date.now()}`,
      name: name.trim(),
      dni: dni.trim() || undefined,
      tip: tip.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      assignedPost: assignedPost.trim() || undefined,
      annualAccumulatedHours: Number(annualHours) || 0,
    };

    onSaveEmployee(emp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {employeeToEdit ? 'Editar Vigilante de Seguridad' : 'Añadir Vigilante al Cuadrante'}
              </h3>
              <p className="text-xs text-slate-500">
                Datos identificativos para cuadrante y sincronización
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre y Apellidos *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
              placeholder="Amador Pérez"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número TIP (Seguridad)
              </label>
              <input
                type="text"
                value={tip}
                onChange={e => setTip(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                placeholder="184920"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DNI / NIE
              </label>
              <input
                type="text"
                value={dni}
                onChange={e => setDni(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                placeholder="45892147K"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico (Gmail del Vigilante)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
              placeholder="amador.seguridad@gmail.com"
            />
            <span className="text-[10px] text-slate-500">
              Para sincronizar cuadrante con su calendario de Google
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono móvil
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                placeholder="+34 612 345 678"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horas Anuales Previas
              </label>
              <input
                type="number"
                step={0.5}
                value={annualHours}
                onChange={e => setAnnualHours(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Puesto Asignado habitual
            </label>
            <input
              type="text"
              value={assignedPost}
              onChange={e => setAssignedPost(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
              placeholder="Control de Accesos / Patrulla 24h"
            />
          </div>

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
              Guardar Vigilante
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
