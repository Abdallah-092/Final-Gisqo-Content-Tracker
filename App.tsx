
import React, { useState, useEffect } from 'react';
import { User, ContentEntry, AppSettings, Notice, Client } from './types';
import Sidebar from './components/Sidebar';
import AdminHub from './components/AdminHub';
import CreatorDashboard from './components/CreatorDashboard';
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';

// Initial default Admin user
const DEFAULT_ADMIN: User = { 
  id: 'admin-1', 
  name: 'System Administrator', 
  email: 'admin@gisqo.com', 
  password: 'admin123', 
  role: 'ADMIN', 
  active: true 
};

const INITIAL_SETTINGS: AppSettings = {
  appName: 'GisqoTracker',
  dailyGoal: 3,
  monthlyClientGoal: 12,
  allowWeekends: false,
  theme: 'dark',
  primaryColor: '#ffa500'
};

const App: React.FC = () => {
  // Initialize state from localStorage immediately to avoid flicker
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gisqo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('gisqo_settings');
    const parsed = saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    const merged = { ...INITIAL_SETTINGS, ...parsed };
    // Guard against empty string appName from storage
    if (!merged.appName || merged.appName.trim() === '') {
      merged.appName = INITIAL_SETTINGS.appName;
    }
    return merged;
  });

  const [creators, setCreators] = useState<User[]>(() => {
    const saved = localStorage.getItem('gisqo_creators');
    const parsed = saved ? JSON.parse(saved) : [DEFAULT_ADMIN];
    return parsed.length > 0 ? parsed : [DEFAULT_ADMIN];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('gisqo_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [contentEntries, setContentEntries] = useState<ContentEntry[]>(() => {
    const saved = localStorage.getItem('gisqo_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('gisqo_notices');
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Apply primary color to CSS variable
  useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
    }
  }, [settings.primaryColor]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('gisqo_entries', JSON.stringify(contentEntries));
    localStorage.setItem('gisqo_creators', JSON.stringify(creators));
    localStorage.setItem('gisqo_clients', JSON.stringify(clients));
    localStorage.setItem('gisqo_settings', JSON.stringify(settings));
    localStorage.setItem('gisqo_notices', JSON.stringify(notices));
  }, [contentEntries, creators, clients, settings, notices]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('gisqo_user', JSON.stringify(userData));
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gisqo_user');
    setShowLogoutConfirm(false);
  };

  const addContent = (entry: Omit<ContentEntry, 'id'>) => {
    const newEntry: ContentEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) } as ContentEntry;
    setContentEntries(prev => [...prev, newEntry]);
  };

  const updateContent = (updatedEntry: ContentEntry) => {
    setContentEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const deleteContent = (id: string) => {
    setContentEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateCreator = (updatedUser: User) => {
    setCreators(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} availableUsers={creators} settings={settings} />;
  }

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-[#111827] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        user={user} 
        view={view} 
        setView={setView} 
        onLogout={() => setShowLogoutConfirm(true)} 
        settings={settings}
      />
      
      <main className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
        {view === 'admin' && user.role === 'ADMIN' ? (
          <AdminHub 
            entries={contentEntries} 
            creators={creators}
            clients={clients}
            setClients={setClients}
            settings={settings}
            setSettings={setSettings}
            notices={notices}
            setNotices={setNotices}
            setCreators={setCreators}
            updateCreator={updateCreator}
            addContent={addContent}
          />
        ) : (
          <CreatorDashboard 
            user={user}
            entries={contentEntries}
            clients={clients}
            settings={settings}
            addContent={addContent}
            updateContent={updateContent}
            deleteContent={deleteContent}
            notices={notices}
            creators={creators}
          />
        )}
      </main>

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logging out?"
        message={`Are you sure you want to sign out, ${user.name.split(' ')[0]}?`}
        confirmText="Yes, Logout"
        variant="primary"
      />
    </div>
  );
};

export default App;
