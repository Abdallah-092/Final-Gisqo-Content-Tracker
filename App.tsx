
import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, set, push, remove } from "firebase/database";
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
  // User state remains in localStorage for session persistence
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gisqo_user');
    return saved ? JSON.parse(saved) : null;
  });

  // State initialization without localStorage
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [creators, setCreators] = useState<User[]>([DEFAULT_ADMIN]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- Firebase Data Fetching ---
  useEffect(() => {
    // onValue will listen for changes in real-time
    const settingsRef = ref(database, 'settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const merged = { ...INITIAL_SETTINGS, ...data };
        if (!merged.appName || merged.appName.trim() === '') {
          merged.appName = INITIAL_SETTINGS.appName;
        }
        setSettings(merged);
      } else {
        // If no settings in DB, set the initial ones
        set(ref(database, 'settings'), INITIAL_SETTINGS);
      }
    });

    const creatorsRef = ref(database, 'creators');
    onValue(creatorsRef, (snapshot) => {
        const data = snapshot.val();
        // Firebase returns an object, we convert it to an array
        const creatorsList = data ? Object.values(data) : [];
        // Ensure the default admin is always present if the db is empty
        if (creatorsList.length === 0) {
            const defaultAdminRef = ref(database, `creators/${DEFAULT_ADMIN.id}`);
            set(defaultAdminRef, DEFAULT_ADMIN);
            setCreators([DEFAULT_ADMIN]);
        } else {
            setCreators(creatorsList as User[]);
        }
    });

    const clientsRef = ref(database, 'clients');
    onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      setClients(data ? Object.values(data) as Client[] : []);
    });

    const entriesRef = ref(database, 'contentEntries');
    onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      setContentEntries(data ? Object.values(data) as ContentEntry[] : []);
    });

    const noticesRef = ref(database, 'notices');
    onValue(noticesRef, (snapshot) => {
      const data = snapshot.val();
      setNotices(data ? Object.values(data) as Notice[] : []);
    });
  }, []);


  // Apply primary color to CSS variable
  useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
    }
  }, [settings.primaryColor]);

  // Update favicon
  useEffect(() => {
    if (settings.favicon) {
      let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(favicon);
      }
      favicon.href = settings.favicon;
    }
  }, [settings.favicon]);
  
  // Update document title
  useEffect(() => {
    if (settings.appName) {
      document.title = settings.appName;
    }
  }, [settings.appName]);

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

  // --- Firebase Data Writing Functions ---

  const addContent = (entry: Omit<ContentEntry, 'id'>) => {
    const newEntryRef = push(ref(database, 'contentEntries'));
    const newEntry: ContentEntry = { ...entry, id: newEntryRef.key! } as ContentEntry;
    set(newEntryRef, newEntry);
  };

  const updateContent = (updatedEntry: ContentEntry) => {
    set(ref(database, `contentEntries/${updatedEntry.id}`), updatedEntry);
  };

  const deleteContent = (id: string) => {
    remove(ref(database, `contentEntries/${id}`));
  };
  
  const updateCreator = (updatedUser: User) => {
      set(ref(database, `creators/${updatedUser.id}`), updatedUser);
      if (user?.id === updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('gisqo_user', JSON.stringify(updatedUser));
      }
  };
  
  const handleSetCreators = (newCreators: User[]) => {
      const creatorsObject = newCreators.reduce((acc, creator) => {
          acc[creator.id] = creator;
          return acc;
      }, {} as {[key: string]: User});
      set(ref(database, 'creators'), creatorsObject);
  }

  const handleSetClients = (newClients: Client[]) => {
      const clientsObject = newClients.reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
      }, {} as {[key: string]: Client});
      set(ref(database, 'clients'), clientsObject);
  }

  const handleSetSettings = (newSettings: AppSettings) => {
      set(ref(database, 'settings'), newSettings);
  }

  const handleSetNotices = (newNotices: Notice[]) => {
       const noticesObject = newNotices.reduce((acc, notice) => {
          acc[notice.id] = notice;
          return acc;
      }, {} as {[key: string]: Notice});
      set(ref(database, 'notices'), noticesObject);
  }


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
            setClients={handleSetClients}
            settings={settings}
            setSettings={handleSetSettings}
            notices={notices}
            setNotices={handleSetNotices}
            setCreators={handleSetCreators}
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
