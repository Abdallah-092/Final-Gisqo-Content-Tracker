
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { User, ContentEntry, AppSettings, Notice, Client, Holiday } from './types';
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

  // State initialization
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [creators, setCreators] = useState<User[]>([DEFAULT_ADMIN]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- Firestore Data Fetching ---
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'main');
    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        const merged = { ...INITIAL_SETTINGS, ...data };
        if (!merged.appName || merged.appName.trim() === '') {
          merged.appName = INITIAL_SETTINGS.appName;
        }
        setSettings(merged);
      } else {
        setDoc(settingsDocRef, { ...INITIAL_SETTINGS });
      }
    });

    const creatorsCollectionRef = collection(db, 'creators');
    const unsubscribeCreators = onSnapshot(creatorsCollectionRef, (snapshot) => {
      const creatorsList = snapshot.docs.map(doc => doc.data() as User);
      if (creatorsList.length === 0) {
        const defaultAdminDocRef = doc(db, 'creators', DEFAULT_ADMIN.id);
        setDoc(defaultAdminDocRef, { ...DEFAULT_ADMIN });
        setCreators([DEFAULT_ADMIN]);
      } else {
        setCreators(creatorsList);
      }
    });
    
    const clientsCollectionRef = collection(db, 'clients');
    const unsubscribeClients = onSnapshot(clientsCollectionRef, (snapshot) => {
        setClients(snapshot.docs.map(doc => doc.data() as Client));
    });

    const entriesCollectionRef = collection(db, 'contentEntries');
    const unsubscribeEntries = onSnapshot(entriesCollectionRef, (snapshot) => {
        setContentEntries(snapshot.docs.map(doc => doc.data() as ContentEntry));
    });

    const noticesCollectionRef = collection(db, 'notices');
    const unsubscribeNotices = onSnapshot(noticesCollectionRef, (snapshot) => {
        setNotices(snapshot.docs.map(doc => doc.data() as Notice));
    });

    const holidaysCollectionRef = collection(db, 'holidays');
    const unsubscribeHolidays = onSnapshot(holidaysCollectionRef, (snapshot) => {
        setHolidays(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Holiday)));
    });


    return () => {
        unsubscribeSettings();
        unsubscribeCreators();
        unsubscribeClients();
        unsubscribeEntries();
        unsubscribeNotices();
        unsubscribeHolidays();
    };
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

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('gisqo_user', JSON.stringify(userData));
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gisqo_user');
    setShowLogoutConfirm(false);
  };

  // --- Firestore Data Writing Functions ---

  const addContent = async (entry: Omit<ContentEntry, 'id'>) => {
    const newDocRef = await addDoc(collection(db, "contentEntries"), { ...entry });
    await updateDoc(newDocRef, { id: newDocRef.id });
  };

  const updateContent = async (updatedEntry: ContentEntry) => {
    const docRef = doc(db, "contentEntries", updatedEntry.id);
    await updateDoc(docRef, { ...updatedEntry });
  };

  const deleteContent = async (id: string) => {
    const docRef = doc(db, "contentEntries", id);
    await deleteDoc(docRef);
  };
  
  const updateCreator = async (updatedUser: User) => {
      const docRef = doc(db, "creators", updatedUser.id);
      await updateDoc(docRef, { ...updatedUser });
      if (user?.id === updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('gisqo_user', JSON.stringify(updatedUser));
      }
  };
  
  const handleSetCreators = async (newCreators: User[]) => {
      const batch = writeBatch(db);
      newCreators.forEach(creator => {
          const docRef = doc(db, "creators", creator.id);
          batch.set(docRef, { ...creator });
      });
      await batch.commit();
  }

  const handleSetClients = async (newClients: Client[]) => {
      const batch = writeBatch(db);
      newClients.forEach(client => {
          const docRef = doc(db, "clients", client.id);
          batch.set(docRef, { ...client });
      });
      await batch.commit();
  }

  const handleSetHolidays = async (newHolidays: Holiday[]) => {
    const batch = writeBatch(db);
    newHolidays.forEach(holiday => {
        const docRef = doc(db, "holidays", holiday.id);
        batch.set(docRef, { name: holiday.name, date: holiday.date });
    });
    await batch.commit();
  }

  const handleSetSettings = async (newSettings: AppSettings) => {
      const docRef = doc(db, "settings", "main");
      await setDoc(docRef, { ...newSettings });
  }

  const handleSetNotices = async (newNotices: Notice[]) => {
      const batch = writeBatch(db);
      newNotices.forEach(notice => {
          const docRef = doc(db, "notices", notice.id);
          batch.set(docRef, { ...notice });
      });
      await batch.commit();
  }


  if (!user) {
    return <Login onLogin={handleLoginSuccess} settings={settings} />;
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
            holidays={holidays}
            setHolidays={handleSetHolidays}
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
            holidays={holidays}
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
