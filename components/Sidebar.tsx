
import React from 'react';
import { User, AppSettings } from '../types';

interface SidebarProps {
  user: User;
  view: 'dashboard' | 'admin';
  setView: (v: 'dashboard' | 'admin') => void;
  onLogout: () => void;
  settings: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ user, view, setView, onLogout, settings }) => {
  const LogoPlaceholder = () => (
    <div className="flex items-center space-x-2">
      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40">
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );

  const getRoleLabel = (role: string) => {
    if (role === 'CREATOR') return 'CONTENT CREATOR';
    return 'ADMINISTRATOR';
  };
  
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.reload();
  }

  return (
    <nav className="bg-[#111827]/95 backdrop-blur-2xl border-b border-slate-800 sticky top-0 z-[500] px-4 md:px-8 animate-in slide-in-from-top-4 fade-in duration-700">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between h-20 items-center gap-2">
          
          {/* Left: Brand (Static) */}
          <div className="flex-1 flex items-center justify-start min-w-0">
            <a href="/" onClick={handleLogoClick} className="flex items-center space-x-3 cursor-pointer">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="h-9 md:h-11 w-auto object-contain" />
              ) : (
                <LogoPlaceholder />
              )}
              <span className="text-xl md:text-2xl font-black tracking-tighter text-white hidden lg:block truncate">
                {settings.appName || 'GisqoTracker'}
              </span>
            </a>
          </div>

          {/* Center: Large Centered Nav Menu */}
          <div className="flex items-center justify-center bg-slate-900/60 p-1.5 rounded-[1.8rem] border border-slate-700/50 shadow-inner">
            <button 
              onClick={() => setView('dashboard')}
              className={`px-6 md:px-12 py-3 rounded-[1.4rem] text-base md:text-xl font-black tracking-tight transition-all hover:scale-[1.02] active:scale-95 ${view === 'dashboard' ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/50' : 'text-slate-400 hover:text-white'}`}
            >
              Dashboard
            </button>
            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setView('admin')}
                className={`ml-2 p-3.5 md:p-4 transition-all rounded-[1.4rem] hover:scale-110 active:scale-95 ${view === 'admin' ? 'bg-orange-600 text-white shadow-2xl shadow-orange-900/60' : 'text-slate-500 hover:text-white hover:bg-slate-700/50'}`}
                title="Admin Hub"
              >
                <svg className={`w-6 h-6 md:w-8 md:h-8 ${view === 'admin' ? 'animate-[spin_8s_linear_infinite]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Right: Profile & Actions */}
          <div className="flex-1 flex items-center justify-end space-x-2 md:space-x-5">
            <div className="flex items-center space-x-3 text-right group cursor-default hidden sm:flex">
              <div className="hidden xl:block">
                <p className="text-sm font-black text-white leading-tight group-hover:text-orange-500 transition-colors">{user.name}</p>
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] mt-0.5">
                  {getRoleLabel(user.role)}
                </p>
              </div>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 transition-all group-hover:scale-105 shadow-xl">
                <span className="text-base font-black text-orange-500">{user.name.charAt(0)}</span>
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-800/40 text-slate-500 hover:text-white hover:bg-red-600/10 transition-all border border-slate-700/50 hover:scale-110 active:scale-95 group/logout shadow-lg"
              title="Sign Out"
            >
              <svg className="w-6 h-6 transition-transform group-hover/logout:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
