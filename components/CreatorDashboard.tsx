
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, ContentEntry, AppSettings, Notice, ContentType, Client } from '../types';
import ConfirmModal from './ConfirmModal';

interface CreatorDashboardProps {
  user: User;
  entries: ContentEntry[];
  clients: Client[];
  settings: AppSettings;
  addContent: (entry: Omit<ContentEntry, 'id'>) => void;
  updateContent: (entry: ContentEntry) => void;
  deleteContent: (id: string) => void;
  notices: Notice[];
  creators: User[];
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ 
  user, entries, clients, settings, addContent, updateContent, deleteContent, notices, creators
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [filterCreatorId, setFilterCreatorId] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<ContentEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [closedNoticeIds, setClosedNoticeIds] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const logModalOverlayRef = useRef<HTMLDivElement>(null);
  const viewModalOverlayRef = useRef<HTMLDivElement>(null);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [formData, setFormData] = useState({ 
    title: '', 
    type: 'Video' as ContentType, 
    link: '', 
    date: todayStr,
    creatorId: user.role === 'ADMIN' ? '' : user.id,
    clientId: '' // Mandatory client selection
  });

  const filteredEntries = useMemo(() => {
    if (settings.allowWeekends) {
      return entries;
    }
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const day = entryDate.getUTCDay(); // Use UTC day to avoid timezone issues
      return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
    });
  }, [entries, settings.allowWeekends]);

  // Calculate Periodic Stats for the Insights Panel
  const teamStats = useMemo(() => {
    const now = new Date();
    const periodEntries = filteredEntries.filter(e => {
      const entryDate = new Date(e.date);
      // Filter by period first
      let inPeriod = false;
      if (reportPeriod === 'daily') {
        inPeriod = e.date === todayStr;
      } else if (reportPeriod === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        inPeriod = entryDate >= weekAgo;
      } else {
        inPeriod = entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
      }

      // Then filter by selected creator if not 'all'
      const matchesCreator = filterCreatorId === 'all' || e.creatorId === filterCreatorId;
      
      return inPeriod && matchesCreator;
    });

    const byType = {
      Video: periodEntries.filter(e => e.type === 'Video').length,
      Flyer: periodEntries.filter(e => e.type === 'Flyer').length,
      Animation: periodEntries.filter(e => e.type === 'Animation').length,
      Newsletter: periodEntries.filter(e => e.type === 'Newsletter').length,
      Other: periodEntries.filter(e => e.type === 'Other').length,
    };

    const creatorOutput = creators
      .filter(c => c.role === 'CREATOR')
      .map(c => ({
        id: c.id,
        name: c.name,
        count: filteredEntries.filter(e => {
          const entryDate = new Date(e.date);
          let inPeriod = false;
          if (reportPeriod === 'daily') inPeriod = e.date === todayStr;
          else if (reportPeriod === 'weekly') {
            const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
            inPeriod = entryDate >= weekAgo;
          }
          else inPeriod = entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
          return inPeriod && e.creatorId === c.id;
        }).length
      }))
      .sort((a, b) => b.count - a.count);

    const total = periodEntries.length;
    const maxOutput = Math.max(...creatorOutput.map(c => c.count), 1);

    return { total, byType, creatorOutput, maxOutput };
  }, [filteredEntries, selectedMonth, selectedYear, creators, reportPeriod, todayStr, filterCreatorId]);

  // Client Specific Progress
  const clientHealth = useMemo(() => {
    return clients.filter(c => c.active).map(client => {
      const monthlyCount = filteredEntries.filter(e => 
        e.clientId === client.id && 
        new Date(e.date).getMonth() === selectedMonth && 
        new Date(e.date).getFullYear() === selectedYear
      ).length;
      return { 
        ...client, 
        count: monthlyCount, 
        percentage: Math.min((monthlyCount / settings.monthlyClientGoal) * 100, 100) 
      };
    });
  }, [filteredEntries, clients, selectedMonth, selectedYear, settings.monthlyClientGoal]);

  // Load editing data into form
  useEffect(() => {
    if (editingEntry) {
      setFormData({
        title: editingEntry.title,
        type: editingEntry.type,
        link: editingEntry.link,
        date: editingEntry.date,
        creatorId: editingEntry.creatorId,
        clientId: editingEntry.clientId
      });
      setShowLogModal(true);
    }
  }, [editingEntry]);

  const activeNotice = useMemo(() => {
    if (user.role !== 'CREATOR') return null;
    return notices.find(n => n.active && !closedNoticeIds.includes(n.id));
  }, [notices, closedNoticeIds, user.role]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const availableYears = [currentYear];

  const weeks = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    
    const calendarWeeks: { weekNumber: number, days: Date[] }[] = [];
    let currentDay = new Date(firstDay);
    
    while (currentDay.getDay() !== 1) {
      currentDay.setDate(currentDay.getDate() - 1);
    }

    let weekIndex = 1;
    while (currentDay <= lastDay) {
      const weekDays: Date[] = [];
      const tempDay = new Date(currentDay);
      for (let i = 0; i < 7; i++) {
        const isWeekend = tempDay.getDay() === 0 || tempDay.getDay() === 6;
        if (settings.allowWeekends || !isWeekend) {
          weekDays.push(new Date(tempDay));
        }
        tempDay.setDate(tempDay.getDate() + 1);
      }
      
      if (weekDays.some(d => d.getMonth() === selectedMonth)) {
        calendarWeeks.push({ weekNumber: weekIndex++, days: weekDays });
      }
      currentDay.setDate(currentDay.getDate() + 7);
    }
    return calendarWeeks;
  }, [selectedMonth, selectedYear, settings.allowWeekends]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert("Please assign this content to a client.");
      return;
    }
    if (user.role === 'ADMIN' && !formData.creatorId) {
      alert("Please select a content creator first.");
      return;
    }

    if (editingEntry) {
      updateContent({ ...editingEntry, ...formData } as ContentEntry);
    } else {
      addContent(formData as any);
    }

    closeLogModal();
  };

  const closeLogModal = () => {
    setShowLogModal(false);
    setEditingEntry(null);
    setFormData({ 
      title: '', 
      type: 'Video', 
      link: '', 
      date: todayStr,
      creatorId: user.role === 'ADMIN' ? '' : user.id,
      clientId: ''
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getEntriesForDay = (dateStr: string) => {
    const dayEntries = filteredEntries.filter(e => e.date === dateStr);
    if (filterCreatorId === 'all') return dayEntries;
    return dayEntries.filter(e => e.creatorId === filterCreatorId);
  };

  const getIcon = (type: ContentType) => {
    switch (type) {
      case 'Video': return '📹';
      case 'Flyer': return '📄';
      case 'Animation': return '✨';
      case 'Newsletter': return '📰';
      default: return '📁';
    }
  };

  const isAdmin = user.role === 'ADMIN';
  const isCreator = user.role === 'CREATOR';
  const userTodayCount = filteredEntries.filter(e => e.creatorId === user.id && e.date === todayStr).length;
  
  const isWeekendNow = new Date().getDay() === 0 || new Date().getDay() === 6;
  const weekendSubmissionsDisabled = !settings.allowWeekends;
  const isLogButtonDisabled = isCreator && weekendSubmissionsDisabled && isWeekendNow;

  return (
    <>
      <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
        {/* Notice Banner */}
        {activeNotice && (
          <div className="animate-in slide-in-from-left fade-in duration-700">
            <div className="bg-orange-600/20 border border-orange-500/30 rounded-[2rem] p-6 flex items-center justify-between backdrop-blur-sm shadow-xl shadow-orange-900/10">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-600 p-3 rounded-2xl text-white animate-pulse">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Team Announcement</p>
                  <p className="text-white font-bold leading-tight">{activeNotice.message}</p>
                </div>
              </div>
              <button 
                onClick={() => setClosedNoticeIds([...closedNoticeIds, activeNotice.id])}
                className="text-orange-500/50 hover:text-orange-500 transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Header Info Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 px-2">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight hover:scale-[1.01] transition-transform cursor-default uppercase">Content Tracker</h1>
            <div className="mt-2 text-slate-400 font-bold text-base md:text-lg flex flex-wrap items-center gap-4">
              {isAdmin ? (
                <span>Monitoring <span className="text-orange-500 font-black animate-pulse">{creators.filter(u => u.role === 'CREATOR').length} Content Creators</span> activity.</span>
              ) : (
                <span>Daily Goal: <span className={`font-black ${userTodayCount >= settings.dailyGoal ? 'text-emerald-500' : 'text-orange-500'}`}>{userTodayCount}/{settings.dailyGoal} contents</span> today.</span>
              )}
              
              <button 
                onClick={() => setShowHealth(!showHealth)}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-500 transition-colors bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span>{showHealth ? 'Hide Production Health' : 'Show Production Health'}</span>
              </button>

              <button 
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-500 transition-colors bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50"
              >
                <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${showStats ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span>{showStats ? 'Hide Team Insights' : 'Show Team Insights'}</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-[#1f293b] rounded-2xl border border-slate-700 px-4 py-3 text-white font-bold text-sm shadow-sm transition-all hover:border-slate-500">
               <span className="mr-3 opacity-50">📅</span>
               <select 
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                 className="bg-transparent focus:outline-none cursor-pointer"
               >
                 {months.map((m, i) => <option key={m} value={i} className="bg-[#1f293b]">{m}</option>)}
               </select>
               <select 
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                 className="bg-transparent focus:outline-none cursor-pointer ml-3 border-l border-slate-700 pr-2"
               >
                 {availableYears.map(y => <option key={y} value={y} className="bg-[#1f293b]">{y}</option>)}
               </select>
            </div>
            <button 
              onClick={() => setShowLogModal(true)}
              disabled={isLogButtonDisabled}
              className="flex items-center px-8 md:px-10 py-4 md:py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-[1.5rem] font-black transition-all shadow-xl shadow-orange-900/40 text-base md:text-lg hover:-translate-y-1 active:translate-y-0 active:scale-95 group w-full md:w-auto justify-center disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
            >
              <span className="mr-3 text-xl md:text-2xl group-hover:rotate-90 transition-transform group-disabled:rotate-0">+</span> Log New Post
            </button>
          </div>
        </div>

        {/* Client Health Health Board */}
        {showHealth && (
          <div className="bg-slate-800/20 p-8 rounded-[3.5rem] border border-slate-700/30 shadow-2xl animate-in slide-in-from-top-4 duration-1000">
            <div className="flex justify-between items-center mb-10 px-4">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Production Health Board</h3>
              <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-800/80 px-4 py-2 rounded-xl">Target: {settings.monthlyClientGoal} Posts/Month</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {clientHealth.map(client => (
                <div key={client.id} className="bg-slate-900/60 p-6 rounded-[2rem] border border-slate-800 group hover:border-orange-500/30 transition-all">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-black text-white uppercase tracking-tighter truncate pr-4">{client.name}</span>
                    <span className={`text-[10px] font-black ${client.count >= settings.monthlyClientGoal ? 'text-emerald-500' : 'text-orange-500'}`}>{client.count} / {settings.monthlyClientGoal}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div className={`h-full transition-all duration-1000 ${client.count >= settings.monthlyClientGoal ? 'bg-emerald-500' : 'bg-orange-600'}`} style={{ width: `${client.percentage}%` }}></div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && <p className="col-span-full text-center py-8 text-slate-700 font-bold uppercase tracking-widest opacity-40">No clients registered for production yet.</p>}
            </div>
          </div>
        )}

        {/* Team Insights Panel */}
        {showStats && (
          <div className="animate-in slide-in-from-top-4 fade-in duration-700">
            <div className="bg-[#1a2333]/60 border border-slate-700/40 rounded-[3rem] p-10 backdrop-blur-md shadow-2xl space-y-10">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-800 pb-8 gap-8">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Team Performance</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Comparing live data across the production line</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Creator Selector */}
                  <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 flex items-center shadow-inner group">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3 mr-2 group-hover:text-orange-500 transition-colors">Viewing Profile:</span>
                     <select 
                       value={filterCreatorId}
                       onChange={(e) => setFilterCreatorId(e.target.value)}
                       className="bg-transparent text-white font-black text-xs uppercase tracking-widest focus:outline-none cursor-pointer pr-4"
                     >
                       <option value="all" className="bg-[#1a2333]">Whole Team</option>
                       {creators.filter(c => c.role === 'CREATOR').map(c => (
                         <option key={c.id} value={c.id} className="bg-[#1a2333]">{c.name}</option>
                       ))}
                     </select>
                  </div>

                  {/* Period Switcher */}
                  <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 flex shadow-inner">
                     {(['daily', 'weekly', 'monthly'] as const).map(p => (
                       <button 
                         key={p}
                         onClick={() => setReportPeriod(p)}
                         className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportPeriod === p ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                       >
                         {p}
                       </button>
                     ))}
                  </div>
                  
                  <div className="bg-orange-600/10 text-orange-500 px-6 py-2.5 rounded-2xl border border-orange-500/20 min-w-[120px] text-center">
                    <span className="text-2xl font-black">{teamStats.total}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest ml-2">Total</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Type Breakdown */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Content Breakdown</p>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: 'Videos', count: teamStats.byType.Video, color: 'text-orange-500' },
                       { label: 'Flyers', count: teamStats.byType.Flyer, color: 'text-blue-400' },
                       { label: 'Animations', count: teamStats.byType.Animation, color: 'text-purple-400' },
                       { label: 'Newsletters', count: teamStats.byType.Newsletter, color: 'text-emerald-400' },
                     ].map(s => (
                       <div key={s.label} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition-all">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{s.label}</span>
                         <span className={`text-xl font-black ${s.color}`}>{s.count}</span>
                       </div>
                     ))}
                  </div>
                </div>

                {/* Top Contributors Chart */}
                <div className="lg:col-span-2 space-y-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Team Productivity Ranking</p>
                  <div className="space-y-5">
                    {teamStats.creatorOutput.slice(0, 5).map((c, idx) => {
                      const percentage = (c.count / teamStats.maxOutput) * 100;
                      const isSelected = filterCreatorId === c.id;
                      const isAnySelected = filterCreatorId !== 'all';
                      const opacityClass = isAnySelected && !isSelected ? 'opacity-30 grayscale-[0.5]' : 'opacity-100';

                      return (
                        <div key={c.id} className={`space-y-2 group animate-in slide-in-from-left duration-700 transition-all ${opacityClass}`} style={{ animationDelay: `${idx * 100}ms` }}>
                           <div className="flex justify-between items-end">
                              <span className={`text-xs font-black uppercase tracking-widest flex items-center ${isSelected ? 'text-orange-500' : 'text-white'}`}>
                                 {idx === 0 && <span className="mr-2 text-orange-500">🏆</span>}
                                 {c.name}
                              </span>
                              <span className={`text-[10px] font-black ${isSelected ? 'text-orange-500' : 'text-slate-500'}`}>{c.count} contents</span>
                           </div>
                           <div className={`h-2.5 bg-slate-900/60 rounded-full overflow-hidden border ${isSelected ? 'border-orange-500/30' : 'border-slate-800'}`}>
                             <div 
                               className={`h-full rounded-full transition-all duration-[1.5s] ease-out ${isSelected ? 'bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.6)]' : 'bg-slate-700 group-hover:bg-slate-600'}`}
                               style={{ width: `${percentage || 2}%` }}
                             ></div>
                           </div>
                        </div>
                      )
                    })}
                    {teamStats.creatorOutput.length === 0 && (
                      <div className="flex items-center justify-center py-10 text-slate-700 italic font-bold uppercase tracking-widest text-xs">No output logged for this period.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Week Sections */}
        <div className="space-y-16">
          {weeks.map((week, wIdx) => (
            <div key={week.weekNumber} className={`space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700`} style={{ animationDelay: `${wIdx * 100}ms` }}>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3 pl-4 flex items-center justify-between">
                <span>Week {week.weekNumber}</span>
                {filterCreatorId !== 'all' && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-600/10 px-3 py-1 rounded-lg border border-orange-500/20 mr-4">
                    Filtered: {creators.find(c => c.id === filterCreatorId)?.name}
                  </span>
                )}
              </h3>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${settings.allowWeekends ? '7' : '5'} gap-4 md:gap-6`}>
                {week.days.map((dateObj) => {
                  const dateStr = dateObj.toISOString().split('T')[0];
                  const dayEntries = getEntriesForDay(dateStr);
                  const userDayEntries = dayEntries.filter(e => e.creatorId === user.id);
                  const isMet = !isAdmin && userDayEntries.length >= settings.dailyGoal;
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  const isToday = dateStr === todayStr;
                  const isDiffMonth = dateObj.getMonth() !== selectedMonth;
                  
                  const creatorGroups = creators
                    .filter(c => dayEntries.some(e => e.creatorId === c.id))
                    .sort((a, b) => {
                      if (a.id === user.id) return -1;
                      if (b.id === user.id) return 1;
                      return a.name.localeCompare(b.name);
                    });

                  return (
                    <div 
                      key={dateStr} 
                      className={`relative flex flex-col rounded-[2.5rem] border transition-all duration-300 min-h-[420px] md:min-h-[480px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] group/card ${isToday ? 'ring-2 ring-orange-500/50 scale-[1.01] md:scale-[1.02] z-10' : ''} ${isDiffMonth ? 'opacity-30 grayscale-[0.8]' : ''} ${isMet ? 'bg-[#0f2a24] border-emerald-500/20' : isWeekend ? 'bg-[#1a2333]/40 border-slate-800' : 'bg-[#1f293b] border-slate-700/50'}`}
                    >
                      <div className="p-6 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`text-[10px] font-black mb-1 uppercase tracking-[0.2em] ${isToday ? 'text-orange-500 font-black' : 'text-slate-500'}`}>
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                              {isToday && <span className="ml-2 animate-pulse hidden sm:inline">• TODAY</span>}
                            </p>
                            <p className="text-4xl font-black text-white leading-none">{dateObj.getDate()}</p>
                          </div>
                          <div className={`w-10 h-10 md:w-11 md:h-11 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform group-hover/card:scale-110 ${isMet ? 'bg-emerald-500 text-emerald-950' : 'bg-orange-500 text-white'}`}>
                            {isMet ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-px bg-slate-700/30"></div>
                      <div className="p-4 md:p-5 flex-1 flex flex-col">
                        <div className="space-y-4 flex-1">
                          {dayEntries.length > 0 ? (
                            <>
                              {creatorGroups.map((creator) => {
                                const creatorEntries = dayEntries.filter(e => e.creatorId === creator.id);
                                const isMe = creator.id === user.id;
                                const groupId = `${dateStr}-${creator.id}`;
                                const isExpanded = expandedGroups[groupId] || filterCreatorId !== 'all';
                                const creatorTodayCount = creatorEntries.length;
                                const hasGoalMet = creatorTodayCount >= settings.dailyGoal;

                                return (
                                  <div key={groupId} className="space-y-2">
                                    <button 
                                      onClick={() => toggleGroup(groupId)}
                                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${isExpanded ? 'bg-slate-800/80 border-slate-600 shadow-md' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'}`}
                                    >
                                      <div className="flex items-center space-x-2.5 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasGoalMet ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'} shadow-lg`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${hasGoalMet ? 'text-emerald-500' : 'text-red-500'}`}>
                                          {isMe ? 'Me' : creator.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2 flex-shrink-0 ml-1">
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${hasGoalMet ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/20' : 'bg-red-500/20 text-red-500'}`}>
                                          {creatorTodayCount}{isMe ? `/${settings.dailyGoal}` : ''}
                                        </span>
                                        <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </div>
                                    </button>

                                    {isExpanded && (
                                      <div className="space-y-2.5 pl-1 pr-1 pb-1 animate-in slide-in-from-top-2 duration-300">
                                        {creatorEntries.map((entry) => {
                                          const canManage = isAdmin || entry.creatorId === user.id;
                                          const client = clients.find(cl => cl.id === entry.clientId);
                                          return (
                                            <div 
                                              key={entry.id} 
                                              className="bg-[#0f172a]/40 p-3.5 rounded-[1.25rem] border border-slate-700/30 group relative transition-all hover:bg-[#0f172a]/70 hover:border-orange-500/30 cursor-pointer shadow-sm"
                                            >
                                              <div className="flex justify-between items-start mb-2" onClick={() => setViewingEntry(entry)}>
                                                <div className="flex-1 min-w-0 pr-3">
                                                  <h4 className="block text-xs font-bold text-white leading-tight truncate group-hover:text-orange-500 transition-colors">
                                                    {entry.title}
                                                  </h4>
                                                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">{client?.name || 'No Client'}</p>
                                                </div>
                                                <a 
                                                  href={entry.link} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="text-slate-500 hover:text-orange-500 transition-all group-hover:scale-110 p-1 bg-slate-800/50 rounded-lg"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                </a>
                                              </div>
                                              
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-slate-800/50" onClick={() => setViewingEntry(entry)}>
                                                  <span className="text-[10px]">{getIcon(entry.type)}</span>
                                                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{entry.type}</span>
                                                </div>

                                                {canManage && (
                                                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); }} className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600/20 text-slate-400 hover:text-orange-500 transition-all">
                                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(entry.id); }} className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-500 transition-all">
                                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-700 opacity-20 h-full group-hover/card:opacity-40 transition-opacity">
                               <div className="bg-slate-800 p-4 rounded-[1.25rem] mb-4 shadow-inner group-hover/card:scale-110 transition-transform">
                                 <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" /><path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" /></svg>
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">No Submissions</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteContent(deleteId);
            setViewingEntry(null);
          }
        }}
        title="Delete Item?"
        message="This entry will be permanently removed from the tracking board. Continue?"
        variant="danger"
        confirmText="Yes, Delete"
      />

      {/* View Entry Details Modal */}
      {viewingEntry && (
        <div 
          ref={viewModalOverlayRef}
          onClick={(e) => e.target === viewModalOverlayRef.current && setViewingEntry(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-950/10 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-[#1a2333] w-full max-w-2xl rounded-[3.5rem] p-12 border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300 relative pointer-events-auto"
           >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4 bg-slate-800/50 px-5 py-2 rounded-2xl border border-slate-700/50">
                  <span className="text-2xl">{getIcon(viewingEntry.type)}</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{viewingEntry.type}</span>
                </div>
                <button onClick={() => setViewingEntry(null)} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-3 ml-1">Content Title</p>
                  <h2 className="text-4xl font-black text-white leading-tight tracking-tighter">{viewingEntry.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-700/30">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Creator</p>
                    <p className="text-xl font-black text-white">{creators.find(c => c.id === viewingEntry.creatorId)?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Client Portfolio</p>
                    <p className="text-xl font-black text-blue-500">{clients.find(cl => cl.id === viewingEntry.clientId)?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Date Logged</p>
                    <p className="text-xl font-black text-white">{new Date(viewingEntry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="pt-12 flex flex-col sm:flex-row gap-4">
                  <a href={viewingEntry.link} target="_blank" rel="noopener noreferrer" className="flex-1 py-6 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-3xl text-center text-xl uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
                    View Content Link
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  {(isAdmin || user.id === viewingEntry.creatorId) && (
                    <button onClick={() => setDeleteId(viewingEntry.id)} className="py-6 px-10 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black rounded-3xl uppercase tracking-widest text-sm transition-all border border-red-500/20">Delete Log</button>
                  )}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Log/Edit Entry Modal */}
      {showLogModal && (
        <div ref={logModalOverlayRef} className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/10 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div onClick={(e) => e.stopPropagation()} className="bg-[#1a2333] w-full max-w-xl rounded-[3rem] border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 md:p-10 pb-4 md:pb-6 flex-shrink-0">
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">{editingEntry ? 'Edit Post Log' : 'Log New Post'}</h3>
              <button onClick={closeLogModal} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-6 md:px-10 pb-8 md:pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {isAdmin && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Creator</label>
                    <div className="relative group">
                      <select required value={formData.creatorId} onChange={e => setFormData({...formData, creatorId: e.target.value})} className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 appearance-none shadow-sm transition-all cursor-pointer">
                        <option value="" disabled>Select a creator</option>
                        {creators.filter(u => u.role === 'CREATOR').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-orange-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                )}
                <div className={isAdmin ? '' : 'col-span-2'}>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Client Portfolio *</label>
                  <div className="relative group">
                    <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 appearance-none shadow-sm transition-all cursor-pointer">
                      <option value="" disabled>Choose Client</option>
                      {clients.filter(c => c.active).map(cl => <option key={cl.id} value={cl.id}>{cl.name.toUpperCase()}</option>)}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-orange-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Content Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="What's this about?" className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-orange-500 shadow-sm transition-all" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Category</label>
                  <div className="relative group">
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ContentType})} className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 appearance-none shadow-sm transition-all cursor-pointer">
                      <option>Video</option>
                      <option>Flyer</option>
                      <option>Animation</option>
                      <option>Newsletter</option>
                      <option>Other</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-orange-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Post Date</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 transition-all pr-2" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Content Link</label>
                <input required type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://drive.google.com/..." className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500 transition-all" />
              </div>

              <button type="submit" className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-[1.5rem] transition-all shadow-2xl text-lg uppercase tracking-widest hover:scale-[1.02] active:scale-95 !mt-8">
                {editingEntry ? 'Update Content Log' : 'Publish Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatorDashboard;
