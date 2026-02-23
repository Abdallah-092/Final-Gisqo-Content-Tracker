
import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, Notice } from '../types';
import ConfirmModal from './ConfirmModal';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  notices: Notice[];
  setNotices: (n: Notice[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, notices, setNotices }) => {
  const [noticeMsg, setNoticeMsg] = useState('');
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [showActiveNoticeErrorModal, setShowActiveNoticeErrorModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const noticesPerPage = 3;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setDraftSettings(settings);
    setIsSaved(true);
  }, [settings]);

  const isAppNameValid = draftSettings.appName.trim().length > 0;
  const hasChanges = JSON.stringify(draftSettings) !== JSON.stringify(settings);

  const handleSaveSettings = () => {
    if (!isAppNameValid) return;
    setSettings({ ...draftSettings, appName: draftSettings.appName.trim() });
    setIsSaved(true);
  };

  const handleDraftChange = (updates: Partial<AppSettings>) => {
    setDraftSettings(prev => ({ ...prev, ...updates }));
    setIsSaved(false);
  };

  const safeNotices = Array.isArray(notices) ? notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  const hasActiveNotice = safeNotices.some(n => n.active);

  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = safeNotices.slice(indexOfFirstNotice, indexOfLastNotice);

  const handlePublishNotice = async () => {
    if (!noticeMsg) return;
    if (hasActiveNotice && !editingNotice) {
      setShowActiveNoticeErrorModal(true);
      return;
    }

    if (editingNotice) {
      const noticeRef = doc(db, 'notices', editingNotice.id);
      try {
        await updateDoc(noticeRef, { message: noticeMsg });
        setEditingNotice(null);
        setNoticeMsg('');
      } catch (error) {
        console.error("Error updating notice: ", error);
        alert("Failed to update notice.");
      }
    } else {
      try {
        const newNoticeData = {
          title: 'Important Update',
          message: noticeMsg,
          type: 'warning',
          active: true,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'notices'), newNoticeData);
        await updateDoc(docRef, { id: docRef.id });
        setNoticeMsg('');
      } catch (error) {
        console.error("Error publishing notice: ", error);
        alert("Failed to publish notice.");
      }
    }
  };

  const toggleNoticeStatus = async (id: string) => {
    const notice = safeNotices.find(n => n.id === id);
    if (!notice) return;
    if (!notice.active && hasActiveNotice) {
      setShowActiveNoticeErrorModal(true);
      return;
    }
    const noticeRef = doc(db, 'notices', id);
    try {
      await updateDoc(noticeRef, { active: !notice.active });
    } catch (error) {
      console.error("Error toggling notice status: ", error);
      alert("Failed to update notice status.");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
        const noticeRef = doc(db, 'notices', id);
        await deleteDoc(noticeRef);
        const updatedNotices = safeNotices.filter(notice => notice.id !== id);
        setNotices(updatedNotices);

    } catch (error) {
        console.error("Error deleting notice: ", error);
        alert("Failed to delete notice. Check the console for more details.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleDraftChange({ [type]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center h-12">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">System Configuration</h2>
          {hasChanges && (
            <button 
              disabled={!isAppNameValid}
              onClick={handleSaveSettings}
              className={`px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl ${
                !isAppNameValid 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed grayscale' 
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-900/40 animate-pulse'
              }`}
            >
              SAVE ALL CHANGES
            </button>
          )}
        </div>
        
        <div className="bg-[#1a2333]/60 p-10 rounded-[3rem] border border-slate-700/40 space-y-10 shadow-2xl">
           <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="flex justify-between items-center ml-2">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Global Application Name</label>
                   {!isAppNameValid && <span className="text-[10px] font-black text-red-500 uppercase animate-pulse">Required *</span>}
                 </div>
                 <input 
                   type="text"
                   value={draftSettings.appName}
                   onChange={e => handleDraftChange({ appName: e.target.value })}
                   className={`w-full bg-[#0f172a] border rounded-3xl px-8 py-5 text-xl font-black text-white focus:outline-none transition-all shadow-inner ${
                     !isAppNameValid ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-slate-700 focus:border-orange-500'
                   }`}
                   placeholder="e.g. GisqoTracker"
                 />
               </div>

               <div className="space-y-4">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Brand Primary Color</label>
                 <div className="flex items-center space-x-4 bg-[#0f172a] border border-slate-700 rounded-3xl px-6 py-4 shadow-inner">
                   <input 
                     type="color"
                     value={draftSettings.primaryColor || '#ffa500'}
                     onChange={e => handleDraftChange({ primaryColor: e.target.value })}
                     className="w-14 h-14 rounded-xl border-none bg-transparent cursor-pointer"
                   />
                   <input 
                     type="text"
                     value={draftSettings.primaryColor || '#ffa500'}
                     onChange={e => handleDraftChange({ primaryColor: e.target.value })}
                     className="bg-transparent text-xl font-black text-white focus:outline-none uppercase w-full"
                   />
                 </div>
               </div>
             </div>
             
             <div className="space-y-4">
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Daily Posting Goal</label>
               <input 
                 type="number"
                 value={draftSettings.dailyGoal}
                 onChange={e => handleDraftChange({ dailyGoal: parseInt(e.target.value) || 0 })}
                 className="w-full bg-[#0f172a] border border-slate-700 rounded-3xl px-8 py-5 text-xl font-black text-white focus:outline-none focus:border-orange-500 transition-all shadow-inner"
               />
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Brand Logo</label>
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="h-40 rounded-[2.5rem] border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-all bg-slate-900/40 overflow-hidden group shadow-lg"
                >
                   {draftSettings.logo ? (
                     <img src={draftSettings.logo} alt="Logo" className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform" />
                   ) : (
                     <div className="text-center px-4">
                       <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Upload Brand Logo</p>
                     </div>
                   )}
                </div>
                <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">App Favicon</label>
                <div 
                  onClick={() => faviconInputRef.current?.click()}
                  className="h-40 rounded-[2.5rem] border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-all bg-slate-900/40 overflow-hidden group shadow-lg"
                >
                   {draftSettings.favicon ? (
                     <img src={draftSettings.favicon} alt="Favicon" className="w-16 h-16 object-contain group-hover:scale-110 transition-transform" />
                   ) : (
                     <div className="text-center px-4">
                       <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Upload Favicon</p>
                     </div>
                   )}
                </div>
                <input ref={faviconInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
              </div>
           </div>

           <div className="flex items-center justify-between p-8 bg-[#0f172a] rounded-[2.5rem] border border-slate-700/50 shadow-inner">
             <div>
               <p className="font-black text-white uppercase tracking-widest text-sm">Enable Weekends</p>
               <p className="text-xs text-slate-500 font-bold mt-1">Allow staff to track production on Sat/Sun.</p>
             </div>
             <button 
               onClick={() => handleDraftChange({ allowWeekends: !draftSettings.allowWeekends })}
               className={`w-16 h-8 rounded-full transition-all relative ${draftSettings.allowWeekends ? 'bg-orange-600' : 'bg-slate-700'}`}
             >
               <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${draftSettings.allowWeekends ? 'left-9' : 'left-1'}`}></div>
             </button>
           </div>
        </div>
      </div>

      {/* Notice Board */}
      <div className="space-y-6">
        <div className="bg-orange-600/5 p-10 rounded-[3rem] border border-orange-500/20 shadow-2xl">
          <h3 className="text-lg font-black text-orange-500 flex items-center mb-8 uppercase tracking-widest">
            Broadcast Terminal
          </h3>
          
          <div className="space-y-6">
            <textarea 
              value={noticeMsg}
              onChange={e => setNoticeMsg(e.target.value)}
              placeholder="What do you want to announce to the team?"
              className="w-full h-40 bg-[#0f172a]/50 border border-orange-500/20 rounded-3xl p-8 text-white focus:outline-none placeholder-orange-900/40 font-bold text-sm shadow-inner resize-none"
            ></textarea>
            <button 
              disabled={hasActiveNotice && !editingNotice}
              onClick={handlePublishNotice}
              className={`w-full py-5 font-black rounded-[1.5rem] transition-all shadow-xl uppercase tracking-widest text-xs ${hasActiveNotice && !editingNotice ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-900/40'}`}
            >
              {editingNotice ? 'Save Update' : 'Push Global Notice'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-6">Past Broadcasts</h4>
          {currentNotices.map(notice => (
            <div key={notice.id} className="bg-[#1a2333]/60 group p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between hover:border-orange-500/30 transition-all shadow-lg">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button 
                        onClick={() => toggleNoticeStatus(notice.id)}
                        className={`px-3 py-1 rounded-lg text-[8px] font-black transition-all flex-shrink-0 ${notice.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-700 text-slate-400'}`}
                    >
                        {notice.active ? 'LIVE' : 'OFF'}
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{notice.message}</p>
                        <p className="text-[9px] text-slate-500 font-black mt-1 uppercase tracking-widest">{notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Date not available'}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 transition-opacity opacity-0 group-hover:opacity-100">
                    <button 
                        onClick={() => { setEditingNotice(notice); setNoticeMsg(notice.message); }}
                        disabled={!notice.active}
                        className={`${notice.active ? 'text-slate-400 hover:text-white' : 'text-slate-600 cursor-not-allowed'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="text-red-500/60 hover:text-red-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
          ))}
          {safeNotices.length > noticesPerPage && (
            <div className="flex justify-center items-center space-x-4 mt-4">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-xs font-black text-orange-500/50 hover:text-orange-500 disabled:text-slate-600 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    Previous
                </button>
                <span className="text-xs font-bold text-slate-500">Page {currentPage}</span>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(safeNotices.length / noticesPerPage)))}
                    disabled={currentPage === Math.ceil(safeNotices.length / noticesPerPage)}
                    className="px-4 py-2 text-xs font-black text-orange-500/50 hover:text-orange-500 disabled:text-slate-600 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    Next
                </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={showActiveNoticeErrorModal}
        onClose={() => setShowActiveNoticeErrorModal(false)}
        onConfirm={() => setShowActiveNoticeErrorModal(false)}
        title="Broadcast Already Active"
        message="There is already a live broadcast. Please deactivate the current one before activating another."
        variant="warning"
        confirmText="Got It"
      />
    </div>
  );
};

export default Settings;
