
import React, { useState, useMemo, useEffect } from 'react';
import { User, ContentEntry, AppSettings, Notice, Client, UserRole } from '../types';
import PeopleManagement from './PeopleManagement';
import Settings from './Settings';
import ConfirmModal from './ConfirmModal';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface AdminHubProps {
  entries: ContentEntry[];
  creators: User[];
  clients: Client[];
  setClients: (c: Client[]) => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  notices: Notice[];
  setNotices: (n: Notice[]) => void;
  setCreators: (u: User[]) => void;
  updateCreator: (u: User) => void;
  addContent: (e: Omit<ContentEntry, 'id'>) => void;
}

const AdminHub: React.FC<AdminHubProps> = ({ 
  entries, creators, clients, setClients, settings, setSettings, notices, setNotices, setCreators, updateCreator, addContent
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'people' | 'clients' | 'settings'>('reports');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [newClientName, setNewClientName] = useState('');
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // People Management Modals
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [personFormData, setPersonFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'CREATOR' as UserRole, 
    active: true 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalConfig, setStatusModalConfig] = useState({
      title: '',
      message: '',
      variant: 'primary' as 'primary' | 'danger' | 'warning',
  });
  
  // Content Bank States
  const [bankCreatorFilter, setBankCreatorFilter] = useState<string>('all');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankPage, setBankPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (showStatusModal) {
      const timer = setTimeout(() => {
        setShowStatusModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showStatusModal]);

  const stats = useMemo(() => {
    const now = new Date();
    const filteredEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      if (reportPeriod === 'daily') {
        return entryDate.toDateString() === now.toDateString();
      } else if (reportPeriod === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return entryDate >= weekAgo;
      }
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });

    const total = filteredEntries.length;
    const byType = {
      Video: filteredEntries.filter(e => e.type === 'Video').length,
      Flyer: filteredEntries.filter(e => e.type === 'Flyer').length,
      Animation: filteredEntries.filter(e => e.type === 'Animation').length,
      Newsletter: filteredEntries.filter(e => e.type === 'Newsletter').length,
      Other: filteredEntries.filter(e => e.type === 'Other').length,
    };
    
    const creatorsList = creators.filter(u => u.role === 'CREATOR');
    const performance = creatorsList.map(c => {
      const count = filteredEntries.filter(e => e.creatorId === c.id).length;
      
      let periodGoal = settings.dailyGoal;
      if (reportPeriod === 'weekly') periodGoal = settings.dailyGoal * 5;
      if (reportPeriod === 'monthly') periodGoal = settings.dailyGoal * 22;

      return { 
        ...c, 
        count, 
        goal: periodGoal,
        diff: count - periodGoal,
        status: count >= periodGoal ? 'Excess' : 'Shortage' 
      };
    });

    return { total, byType, performance };
  }, [entries, creators, settings.dailyGoal, reportPeriod]);

  const filteredBankEntries = useMemo(() => {
    let result = [...entries].reverse();
    if (bankCreatorFilter !== 'all') {
      result = result.filter(e => e.creatorId === bankCreatorFilter);
    }
    if (bankSearchQuery.trim() !== '') {
      result = result.filter(e => 
        e.title.toLowerCase().includes(bankSearchQuery.toLowerCase())
      );
    }
    return result;
  }, [entries, bankCreatorFilter, bankSearchQuery]);

  const totalPages = Math.ceil(filteredBankEntries.length / itemsPerPage);
  const paginatedEntries = filteredBankEntries.slice((bankPage - 1) * itemsPerPage, bankPage * itemsPerPage);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClientName.trim(),
      active: true
    };
    setClients([...clients, newClient]);
    setNewClientName('');
  };

  const toggleClientStatus = (id: string) => {
    setClients(clients.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const handleConfirmDeleteClient = () => {
    if (deletingClientId) {
      setClients(clients.filter(c => c.id !== deletingClientId));
      setDeletingClientId(null);
    }
  };

  const handleOpenAddPerson = () => {
    setEditingUser(null);
    setPersonFormData({ name: '', email: '', password: '', role: 'CREATOR', active: true });
    setShowPassword(false);
    setShowPersonForm(true);
  };

  const handleOpenEditPerson = (user: User) => {
    setEditingUser(user);
    setPersonFormData({ name: user.name, email: user.email, password: user.password || '', role: user.role, active: user.active });
    setShowPassword(false);
    setShowPersonForm(true);
  };

  const handlePersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateCreator({ ...editingUser, ...personFormData });
    } else {
      const newUser: User = { id: Math.random().toString(36).substr(2, 9), ...personFormData };
      setCreators([...creators, newUser]);
    }
    setShowPersonForm(false);
  };

  const requestDeleteUser = (userId: string) => {
    const user = creators.find(c => c.id === userId);
    if (user) {
        setUserToDelete(user);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
        const userDocRef = doc(db, 'creators', userToDelete.id);
        await deleteDoc(userDocRef);
        const updatedCreators = creators.filter(user => user.id !== userToDelete.id);
        setCreators(updatedCreators);

        setStatusModalConfig({
            title: 'Success!',
            message: 'User has been successfully deleted.',
            variant: 'primary',
        });
        setShowStatusModal(true);

    } catch (error) {
        console.error("Error deleting user:", error);
        setStatusModalConfig({
            title: 'Error',
            message: 'Failed to delete user. Please try again.',
            variant: 'danger',
        });
        setShowStatusModal(true);
    } finally {
        setUserToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col items-center space-y-10">
          <div className="text-center">
            <h1 className="text-5xl font-black text-white tracking-tight uppercase mb-2">Admin Hub</h1>
            <p className="text-slate-400 font-medium">
              Currently monitoring <span className="text-orange-500 font-black">{creators.filter(u => u.role === 'CREATOR').length} Content Creators</span>
            </p>
          </div>
          
          <div className="flex justify-center w-full">
            <div className="flex bg-[#1f293b]/80 p-2 rounded-[2.5rem] border border-slate-700/50 backdrop-blur-xl shadow-2xl shadow-black/40">
              {(['reports', 'people', 'clients', 'settings'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center px-10 py-4 rounded-[1.8rem] text-xs font-black tracking-[0.2em] transition-all hover:scale-105 active:scale-95 ${activeTab === tab ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/40' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'reports' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center px-2">
              <div className="bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 flex space-x-1 shadow-inner backdrop-blur-md">
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                  <button 
                      key={p}
                      onClick={() => setReportPeriod(p)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-700/50 ${reportPeriod === p ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/30 px-6 py-2 rounded-full border border-slate-700/30">
                Analytics Period: <span className="text-orange-500 ml-1">{reportPeriod}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'TOTAL CONTENT', value: stats.total, color: 'text-white' },
                { label: 'VIDEOS', value: stats.byType.Video, color: 'text-orange-500' },
                { label: 'FLYERS', value: stats.byType.Flyer, color: 'text-blue-400' },
                { label: 'ANIMATIONS', value: stats.byType.Animation, color: 'text-purple-400' },
                { label: 'NEWSLETTERS', value: stats.byType.Newsletter, color: 'text-emerald-400' },
              ].map((stat, i) => (
                <div key={i} className={`bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/50 shadow-lg hover:-translate-y-2 transition-all duration-300 animate-in fade-in zoom-in duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                  <p className="text-[9px] font-black text-slate-500 tracking-[0.2em] mb-4 uppercase leading-none">{stat.label}</p>
                  <p className={`text-5xl font-black ${stat.color} leading-none`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-800/20 p-10 rounded-[3.5rem] border border-slate-700/30 shadow-2xl transition-all hover:bg-slate-800/30 group">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider group-hover:text-orange-500 transition-colors">Productivity Chart</h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-900/50 px-3 py-1 rounded-lg">{reportPeriod} output per creator</span>
                </div>
                <div className="space-y-10">
                  {stats.performance.map((p, pIdx) => {
                    const percentage = Math.min((p.count / (p.goal || 1)) * 100, 100);
                    return (
                      <div key={p.id} className="space-y-3 animate-in fade-in slide-in-from-left duration-700" style={{ animationDelay: `${pIdx * 100}ms` }}>
                        <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                          <span className="text-slate-300">{p.name}</span>
                          <span className="text-orange-500 font-black">{p.count} Contents</span>
                        </div>
                        <div className="h-5 bg-slate-900/50 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                          <div 
                            className={`h-full transition-all duration-[1500ms] ease-out rounded-full ${p.status === 'Excess' ? 'bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.6)]' : 'bg-slate-600'}`}
                            style={{ width: `${percentage || 5}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-800/20 p-10 rounded-[3.5rem] border border-slate-700/30 space-y-10 shadow-2xl">
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">Status Alerts</h3>
                
                <div className="space-y-8">
                  <div>
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-5 pl-2">Elite Performers (Excess)</p>
                    <div className="space-y-4">
                      {stats.performance.filter(p => p.status === 'Excess').map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-emerald-500/10 p-5 rounded-[1.8rem] border border-emerald-500/20 animate-in fade-in zoom-in duration-500">
                          <span className="text-base font-bold text-emerald-200">{p.name}</span>
                          <span className="text-[11px] font-black bg-emerald-500 text-emerald-950 px-3 py-1.5 rounded-xl">+{p.diff} contents</span>
                        </div>
                      ))}
                      {stats.performance.filter(p => p.status === 'Excess').length === 0 && (
                        <p className="text-xs text-slate-600 italic px-6 py-4 bg-slate-900/30 rounded-3xl text-center">No one in excess this {reportPeriod}.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] mb-5 pl-2">Needs Support (Shortage)</p>
                    <div className="space-y-4">
                      {stats.performance.filter(p => p.status === 'Shortage').map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-red-500/10 p-5 rounded-[1.8rem] border border-red-500/20 animate-in fade-in zoom-in duration-500">
                          <span className="text-base font-bold text-red-200">{p.name}</span>
                          <span className="text-[11px] font-black bg-red-500 text-red-50 px-3 py-1.5 rounded-xl">{p.diff} contents</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/20 rounded-[3.5rem] border border-slate-700/30 overflow-hidden shadow-2xl transition-all hover:bg-slate-800/25">
              <div className="px-10 py-8 border-b border-slate-700/30 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/40 gap-4">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider">Content Bank</h3>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Master Audit Log • {filteredBankEntries.length} Items</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <input 
                    type="text"
                    placeholder="Search by title..."
                    value={bankSearchQuery}
                    onChange={e => { setBankSearchQuery(e.target.value); setBankPage(1); }}
                    className="bg-[#111827] border border-slate-700 rounded-2xl px-6 py-3 text-xs font-black text-white focus:outline-none hover:border-orange-500 transition-all shadow-xl w-64"
                  />
                  <div className="relative group">
                    <select 
                      value={bankCreatorFilter}
                      onChange={(e) => { setBankCreatorFilter(e.target.value); setBankPage(1); }}
                      className="bg-[#111827] border border-slate-700 rounded-2xl px-6 py-3 text-xs font-black text-white focus:outline-none appearance-none pr-12 hover:border-orange-500 transition-all cursor-pointer shadow-xl"
                    >
                      <option value="all">ALL CREATORS</option>
                      {creators.filter(u => u.role === 'CREATOR').map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] bg-slate-900/40">
                      <th className="px-10 py-6">Content Title</th>
                      <th className="px-10 py-6">Category</th>
                      <th className="px-10 py-6">Creator</th>
                      <th className="px-10 py-6">Client</th>
                      <th className="px-10 py-6">Log Date</th>
                      <th className="px-10 py-6 text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {paginatedEntries.map((entry, idx) => {
                      const creator = creators.find(c => c.id === entry.creatorId);
                      const client = clients.find(cl => cl.id === entry.clientId);
                      return (
                        <tr key={entry.id} className="hover:bg-orange-500/5 transition-all group animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
                          <td className="px-10 py-6 font-bold text-slate-200 group-hover:text-orange-500 transition-colors">{entry.title}</td>
                          <td className="px-10 py-6">
                            <span className="text-[10px] font-black bg-slate-800/80 text-slate-400 px-4 py-1.5 rounded-full uppercase group-hover:bg-orange-600/10 group-hover:text-orange-500 transition-all border border-slate-700/50">{entry.type}</span>
                          </td>
                          <td className="px-10 py-6 text-sm font-bold text-slate-300">{creator?.name}</td>
                          <td className="px-10 py-6 text-xs font-black text-blue-500 uppercase tracking-widest">{client?.name || 'N/A'}</td>
                          <td className="px-10 py-6 text-xs font-medium text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="px-10 py-6 text-right">
                            <a href={entry.link} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-orange-500 transition-all hover:scale-125 inline-block" title="Open Content Link">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredBankEntries.length === 0 && (
                  <div className="py-24 text-center text-slate-700 font-bold uppercase tracking-[0.3em] text-sm opacity-40">No matching records discovered.</div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="px-10 py-8 border-t border-slate-700/30 flex justify-between items-center bg-slate-900/10">
                  <button 
                    disabled={bankPage === 1}
                    onClick={() => setBankPage(p => Math.max(1, p - 1))}
                    className="px-8 py-3 bg-slate-800 rounded-2xl text-[10px] font-black text-white hover:bg-orange-600 hover:scale-105 active:scale-95 disabled:opacity-20 transition-all disabled:hover:bg-slate-800 disabled:hover:scale-100 shadow-xl tracking-[0.2em]"
                  >
                    PREVIOUS
                  </button>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Page <span className="text-white">{bankPage}</span> of <span className="text-white">{totalPages}</span></span>
                  <button 
                    disabled={bankPage === totalPages}
                    onClick={() => setBankPage(p => Math.min(totalPages, p + 1))}
                    className="px-8 py-3 bg-slate-800 rounded-2xl text-[10px] font-black text-white hover:bg-orange-600 hover:scale-105 active:scale-95 disabled:opacity-20 transition-all disabled:hover:bg-slate-800 disabled:hover:scale-100 shadow-xl tracking-[0.2em]"
                  >
                    NEXT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-800/20 p-10 rounded-[3.5rem] border border-slate-700/30 shadow-2xl">
                <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-8">Client Portfolio Manager</h3>
                <form onSubmit={handleAddClient} className="flex flex-col sm:flex-row gap-4 mb-10">
                  <input 
                    required
                    type="text"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    placeholder="Enter Client or Brand Name..."
                    className="flex-1 bg-[#0f172a] border border-slate-700 rounded-2xl px-8 py-5 text-xl font-black text-white focus:outline-none focus:border-orange-500 shadow-inner"
                  />
                  <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-900/40">Register Client</button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clients.map(client => (
                    <div key={client.id} className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 flex justify-between items-center group hover:bg-slate-800 transition-all">
                        <div>
                          <h4 className="font-black text-xl text-white uppercase tracking-tighter group-hover:text-orange-500 transition-colors">{client.name}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 block ${client.active ? 'text-emerald-500' : 'text-slate-600'}`}>{client.active ? 'Active Client' : 'Archived'}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => toggleClientStatus(client.id)} className="p-3 bg-slate-800 rounded-xl hover:text-white transition-colors" title="Toggle Active Status">
                            <svg className={`w-5 h-5 ${client.active ? 'text-emerald-500' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => setDeletingClientId(client.id)} className="p-3 bg-slate-800 rounded-xl hover:text-red-500 transition-colors" title="Delete Client">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                    </div>
                  ))}
                  {clients.length === 0 && <p className="col-span-full text-center text-slate-700 py-20 font-bold uppercase tracking-[0.3em] opacity-40">No clients registered yet.</p>}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <PeopleManagement 
            creators={creators} 
            onOpenAdd={handleOpenAddPerson}
            onOpenEdit={handleOpenEditPerson}
            onDelete={requestDeleteUser}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            settings={settings} 
            setSettings={setSettings} 
            notices={notices} 
            setNotices={setNotices} 
          />
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deletingClientId}
        onClose={() => setDeletingClientId(null)}
        onConfirm={handleConfirmDeleteClient}
        title="Remove Client?"
        message="This will permanently remove the client and all associated data. This action cannot be undone."
        variant="danger"
        confirmText="Yes, Remove Client"
      />

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User?"
        message={`Are you sure you want to delete ${userToDelete?.name}? This cannot be undone.`}
        variant="danger"
        confirmText="Yes, Delete User"
      />

       <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={() => setShowStatusModal(false)}
        title={statusModalConfig.title}
        message={statusModalConfig.message}
        variant={statusModalConfig.variant}
        confirmText="OK"
      />

      {showPersonForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/10 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1a2333] w-full max-w-lg rounded-[3rem] border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 md:p-10 pb-4 md:pb-6 flex-shrink-0">
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{editingUser ? 'Update Profile' : 'New Creator'}</h3>
              <button onClick={() => setShowPersonForm(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handlePersonSubmit} className="space-y-6 overflow-y-auto px-6 md:px-10 pb-8 md:pb-10">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Full Name</label>
                <input required type="text" placeholder="e.g. Abdallah" value={personFormData.name} onChange={e => setPersonFormData({...personFormData, name: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Work Email</label>
                <input required type="email" placeholder="abdallah@gisqo.com" value={personFormData.email} onChange={e => setPersonFormData({...personFormData, email: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner" />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Password</label>
                <input required type={showPassword ? "text" : "password"} placeholder="Password" value={personFormData.password} onChange={e => setPersonFormData({...personFormData, password: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner pr-14" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-[60%] -translate-y-[50%] text-slate-500 hover:text-white transition-colors">
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.127 2.463.372m-.626 6.375a3 3 0 11-4.242-4.242" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Role</label>
                    <div className="relative group">
                      <select value={personFormData.role} onChange={e => setPersonFormData({...personFormData, role: e.target.value as any})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner appearance-none cursor-pointer">
                        <option value="CREATOR">Content Creator</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-orange-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Status</label>
                    <div className="relative group">
                      <select value={personFormData.active ? 'true' : 'false'} onChange={e => setPersonFormData({...personFormData, active: e.target.value === 'true'})} className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-600 shadow-inner appearance-none cursor-pointer">
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-orange-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
              </div>
              <div className="flex space-x-4 pt-6">
                <button type="button" onClick={() => setShowPersonForm(false)} className="flex-1 py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Cancel</button>
                <button type="submit" className="flex-[2] py-6 bg-orange-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-xl shadow-orange-900/40">{editingUser ? 'Update Member' : 'Create Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHub;
