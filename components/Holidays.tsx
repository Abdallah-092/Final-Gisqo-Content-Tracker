
import React, { useState } from 'react';
import { Holiday } from '../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface HolidaysProps {
  holidays: Holiday[];
  addHoliday: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
  updateHoliday: (holiday: Holiday) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
}

const Holidays: React.FC<HolidaysProps> = ({ holidays, addHoliday, updateHoliday, deleteHoliday }) => {
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHolidayName.trim() && newHolidayDate) {
      await addHoliday({ name: newHolidayName.trim(), date: newHolidayDate });
      setNewHolidayName('');
      setNewHolidayDate('');
    }
  };

  const handleUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHoliday && editingHoliday.name.trim() && editingHoliday.date) {
      await updateHoliday(editingHoliday);
      setEditingHoliday(null);
    }
  };

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
  };

  const openDeleteConfirm = (holiday: Holiday) => {
    setHolidayToDelete(holiday);
  };

  const handleConfirmDelete = async () => {
    if (holidayToDelete) {
      await deleteHoliday(holidayToDelete.id);
      setHolidayToDelete(null);
    }
  };

  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-800/20 p-10 rounded-[3.5rem] border border-slate-700/30 shadow-2xl">
        <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-8">Manage Holidays</h3>
        
        {/* Add Holiday Form */}
        <form onSubmit={handleAddHoliday} className="flex flex-col sm:flex-row gap-4 mb-10">
          <input
            required
            type="text"
            value={newHolidayName}
            onChange={e => setNewHolidayName(e.target.value)}
            placeholder="Holiday Name"
            className="flex-1 bg-[#0f172a] border border-slate-700 rounded-2xl px-8 py-5 text-xl font-black text-white focus:outline-none focus:border-orange-500 shadow-inner"
          />
          <input
            required
            type="date"
            value={newHolidayDate}
            onChange={e => setNewHolidayDate(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl px-8 py-5 text-xl font-black text-white focus:outline-none focus:border-orange-500 shadow-inner"
          />
          <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-900/40 flex items-center justify-center gap-2">
            <Plus size={16}/> Add Holiday
          </button>
        </form>

        {/* Holidays List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedHolidays.map(holiday => (
            <div key={holiday.id} className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 flex justify-between items-center group hover:bg-slate-800 transition-all">
              <div>
                <h4 className="font-black text-xl text-white uppercase tracking-tighter group-hover:text-orange-500 transition-colors">{holiday.name}</h4>
                <span className="text-sm font-medium text-slate-400">{new Date(holiday.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => openEditModal(holiday)} className="p-3 rounded-xl bg-slate-800 hover:text-orange-500 transition-colors">
                  <Pencil size={20} />
                </button>
                <button onClick={() => openDeleteConfirm(holiday)} className="p-3 rounded-xl bg-slate-800 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {sortedHolidays.length === 0 && (
            <p className="col-span-full text-center text-slate-700 py-20 font-bold uppercase tracking-[0.3em] opacity-40">No holidays scheduled.</p>
          )}
        </div>
      </div>

      {/* Edit Holiday Modal */}
      {editingHoliday && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/10 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1a2333] w-full max-w-lg rounded-[3rem] border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">
            <form onSubmit={handleUpdateHoliday} className="p-12 space-y-8 overflow-y-auto">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Edit Holiday</h2>
              <div>
                <label htmlFor="holidayName" className="text-sm font-bold text-slate-400 mb-2 block">Holiday Name</label>
                <input
                  id="holidayName"
                  type="text"
                  value={editingHoliday.name}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, name: e.target.value })}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-6 py-4 text-lg font-black text-white focus:outline-none focus:border-orange-500 shadow-inner"
                />
              </div>
              <div>
                <label htmlFor="holidayDate" className="text-sm font-bold text-slate-400 mb-2 block">Date</label>
                <input
                  id="holidayDate"
                  type="date"
                  value={editingHoliday.date}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-6 py-4 text-lg font-black text-white focus:outline-none focus:border-orange-500 shadow-inner"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setEditingHoliday(null)} className="px-8 py-3 bg-slate-700 rounded-xl text-xs font-black text-white hover:bg-slate-600 transition-all">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-orange-600 rounded-xl text-xs font-black text-white hover:bg-orange-700 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!holidayToDelete}
        onClose={() => setHolidayToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Holiday?"
        message={`Are you sure you want to delete the holiday "${holidayToDelete?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default Holidays;
