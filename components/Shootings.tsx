
import React, { useState, useMemo, useEffect } from 'react';
import { Shooting, Client, User } from '../types';

interface ShootingsProps {
  shootings: Shooting[];
  clients: Client[];
  creators: User[];
  addShooting: (shooting: Omit<Shooting, 'id'>) => void;
  updateShooting: (shooting: Shooting) => void;
  deleteShooting: (id: string) => void;
}

const Shootings: React.FC<ShootingsProps> = ({ shootings, clients, creators, addShooting, updateShooting, deleteShooting }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShooting, setEditingShooting] = useState<Shooting | null>(null);
  const [formData, setFormData] = useState<Omit<Shooting, 'id'>>({
    title: '',
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    time: '',
    creatorIds: [],
  });
  const [pastPage, setPastPage] = useState(1);
  const pastItemsPerPage = 5;

  useEffect(() => {
    if (editingShooting) {
      setFormData({
        ...editingShooting,
        date: new Date(editingShooting.date).toISOString().split('T')[0],
      });
      setIsModalOpen(true);
    } else {
      resetForm();
    }
  }, [editingShooting]);

  const { upcomingShootings, pastShootings } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const sorted = (shootings || [])
      .filter(s => s && s.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const upcoming = sorted.filter(s => s.date >= today);
    const past = sorted.filter(s => s.date < today);
    
    return { upcomingShootings: upcoming, pastShootings: past };
  }, [shootings]);

  const paginatedPastShootings = useMemo(() => {
    const startIndex = (pastPage - 1) * pastItemsPerPage;
    return pastShootings.slice(startIndex, startIndex + pastItemsPerPage);
  }, [pastShootings, pastPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatorSelection = (creatorId: string) => {
    setFormData(prev => {
      const newCreatorIds = prev.creatorIds.includes(creatorId) 
        ? prev.creatorIds.filter(id => id !== creatorId)
        : [...prev.creatorIds, creatorId];
      return { ...prev, creatorIds: newCreatorIds };
    });
  };

  const resetForm = () => {
    setFormData({
        title: '',
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        time: '',
        creatorIds: [],
    });
    setEditingShooting(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShooting) {
      updateShooting({ ...editingShooting, ...formData });
    } else {
      addShooting(formData);
    }
    resetForm();
  };

  const renderShootingList = (list: Shooting[], title: string, isPast: boolean = false) => (
    <div>
      <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-b-2 border-slate-700 pb-2">{title}</h3>
      {list.length > 0 ? (
        <div className="space-y-4">
          {list.map(shooting => {
            try {
              if (!shooting || !shooting.id) return null;

              const client = clients.find(c => c.id === shooting.clientId);
              const creatorIds = shooting.creatorIds || [];
              const assignedCreators = creators.filter(c => c && creatorIds.includes(c.id));

              return (
                <div key={shooting.id} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-white">{shooting.title}</h4>
                      <p className="text-sm text-slate-400">{client?.name} - {shooting.location}</p>
                      <p className="text-sm text-slate-400">{new Date(shooting.date).toLocaleDateString(undefined, { timeZone: 'UTC' })} {shooting.time && `at ${shooting.time}`}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setEditingShooting(shooting)} className="text-orange-500 hover:text-orange-400 p-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => deleteShooting(shooting.id)} className="text-red-500 hover:text-red-400 p-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Assigned Creators:</h5>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {assignedCreators.map(creator => (
                        <span key={creator.id} className="text-xs font-semibold bg-slate-700 text-white px-2 py-1 rounded-full">{creator.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            } catch (error) {
              console.error("Error rendering shooting:", shooting, error);
              return null;
            }
          })}
           {isPast && pastShootings.length > pastItemsPerPage && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              {Array.from({ length: Math.ceil(pastShootings.length / pastItemsPerPage) }, (_, i) => i + 1).map(page => (
                <button 
                  key={page} 
                  onClick={() => setPastPage(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${pastPage === page ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="py-10 text-center text-slate-600 font-bold uppercase tracking-widest">No {title.toLowerCase()}.</p>
      )}
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
            <input required type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Shooting Title" className="bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 h-[58px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select required name="clientId" value={formData.clientId} onChange={handleInputChange} className="bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 h-[58px]">
                <option value="" disabled>Select Client</option>
                {clients.filter(c => c.active).map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                ))}
            </select>
            <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 h-[58px]" />
            <input required type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Location" className="bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 h-[58px]" />
            <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="bg-[#0f172a] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 h-[58px]" />
        </div>
        <div>
            <label className="block text-sm font-bold text-slate-400 mb-3">Select Creators</label>
            <div className="flex flex-wrap gap-3">
                {creators.filter(c => c.active && c.role === 'CREATOR').map(creator => (
                    <button 
                        type="button"
                        key={creator.id} 
                        onClick={() => handleCreatorSelection(creator.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${formData.creatorIds.includes(creator.id) ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {creator.name}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex items-center gap-4 pt-4">
            <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all shadow-lg">
                {editingShooting ? 'Update Shooting' : 'Add Shooting'}
            </button>
            {editingShooting && (
                <button type="button" onClick={resetForm} className="w-full py-4 bg-slate-600 hover:bg-slate-700 text-white font-black rounded-2xl transition-all shadow-lg">
                    Cancel
                </button>
            )}
        </div>
    </form>
  );

  return (
    <>
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-800/20 p-10 rounded-[3.5rem] border border-slate-700/30 shadow-2xl">
                <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-8">Manage Shootings</h3>
                {renderForm()}
            </div>

            <div className="bg-slate-800/20 p-10 rounded-[3.5rem] border border-slate-700/30 shadow-2xl space-y-12">
                {renderShootingList(upcomingShootings, 'Upcoming Shootings')}
                {renderShootingList(paginatedPastShootings, 'Past Shootings', true)}
            </div>
        </div>
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-slate-800/80 backdrop-blur-xl w-full max-w-2xl rounded-[3rem] p-10 border-2 border-orange-500/50 shadow-2xl shadow-orange-900/40 animate-in zoom-in-95 duration-300 relative">
                    <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-8">Edit Shooting</h3>
                    {renderForm()}
                </div>
            </div>
        )}
    </>
  );
};

export default Shootings;
