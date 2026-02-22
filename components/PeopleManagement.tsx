
import React from 'react';
import { User } from '../types';

interface PeopleProps {
  creators: User[];
  onOpenAdd: () => void;
  onOpenEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

const PeopleManagement: React.FC<PeopleProps> = ({ creators, onOpenAdd, onOpenEdit, onDelete }) => {
  const getRoleLabel = (role: string) => role === 'CREATOR' ? 'CONTENT CREATOR' : 'ADMINISTRATOR';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Creators & Staff</h2>
        <button 
          onClick={onOpenAdd}
          className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-5 rounded-[2rem] font-black text-lg transition-all shadow-xl shadow-orange-900/40"
        >
          Add Person
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {creators.map(user => (
          <div key={user.id} className="bg-slate-800/40 p-10 rounded-[3.5rem] border border-slate-700/50 hover:bg-slate-800/60 transition-all group shadow-xl">
            <div className="flex items-center space-x-6 mb-10">
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-3xl border ${user.active ? 'bg-orange-600/10 text-orange-500 border-orange-500/20' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                {user.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-black text-xl text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{user.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{getRoleLabel(user.role)}</span>
                  {!user.active && <span className="text-[9px] font-black bg-red-500/20 text-red-500 px-2 py-0.5 rounded-lg">INACTIVE</span>}
                </div>
              </div>
            </div>
            
            <p className="text-base text-slate-500 font-bold mb-10 pb-8 border-b border-slate-700/50 truncate">{user.email}</p>
            
            <div className="flex justify-between items-center">
              <button onClick={() => onOpenEdit(user)} className="text-[11px] font-black text-white hover:text-orange-500 uppercase tracking-widest transition-colors">Edit Account</button>
              <button onClick={() => onDelete(user.id)} className="text-[11px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleManagement;
