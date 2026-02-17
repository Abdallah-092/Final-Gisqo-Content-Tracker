
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';

interface PeopleProps {
  creators: User[];
  setCreators: (u: User[]) => void;
  updateCreator: (u: User) => void;
}

const PeopleManagement: React.FC<PeopleProps> = ({ creators, setCreators, updateCreator }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Fix: Explicitly type the role property to UserRole to allow both 'ADMIN' and 'CREATOR' values
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'CREATOR' as UserRole, 
    active: true 
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const formModalOverlayRef = useRef<HTMLDivElement>(null);

  const getRoleLabel = (role: string) => role === 'CREATOR' ? 'CONTENT CREATOR' : 'ADMINISTRATOR';

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'CREATOR', active: true });
    setShowFormPassword(false);
    setShowForm(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: user.password || '', 
      role: user.role, 
      active: user.active 
    });
    setShowFormPassword(false);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateCreator({ ...editingUser, ...formData });
    } else {
      const newUser: User = { 
        id: Math.random().toString(36).substr(2, 9), 
        ...formData 
      };
      setCreators([...creators, newUser]);
    }
    setShowForm(false);
  };

  const performDelete = () => {
    if (deleteId) {
      setCreators(creators.filter(u => u.id !== deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Creators & Staff</h2>
        <button 
          onClick={handleOpenAdd}
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
              <button onClick={() => handleOpenEdit(user)} className="text-[11px] font-black text-white hover:text-orange-500 uppercase tracking-widest transition-colors">Edit Account</button>
              <button onClick={() => setDeleteId(user.id)} className="text-[11px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={performDelete}
        title="Remove User?"
        message="This user will be permanently deleted and lose all access."
        variant="danger"
        confirmText="Yes, Remove"
      />

      {showForm && (
        <div 
          ref={formModalOverlayRef}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-950/10 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a2333] w-full max-w-lg rounded-[3.5rem] p-12 border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300 relative pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{editingUser ? 'Update Profile' : 'New Creator'}</h3>
               <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Full Name</label>
                <input required type="text" placeholder="e.g. Abdallah" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Work Email</label>
                <input required type="email" placeholder="abdallah@gisqo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner" />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Password</label>
                <input 
                  required 
                  type={showFormPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner pr-14" 
                />
                <button 
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-5 top-[60%] -translate-y-[50%] text-slate-500 hover:text-white transition-colors"
                >
                  {showFormPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none">
                    <option value="CREATOR">Content Creator</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Status</label>
                  <select value={formData.active ? 'true' : 'false'} onChange={e => setFormData({...formData, active: e.target.value === 'true'})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-4 pt-6">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Cancel</button>
                <button type="submit" className="flex-[2] py-6 bg-orange-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-xl shadow-orange-900/40">{editingUser ? 'Update Member' : 'Create Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleManagement;
