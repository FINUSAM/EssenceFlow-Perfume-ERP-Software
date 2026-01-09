
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, BusinessSettings } from '../types.ts';
import { api } from '../services/api.ts';

export type Page = 'dashboard' | 'inventory' | 'purchasing' | 'products' | 'sales' | 'expenses' | 'contacts' | 'settings';

interface AppContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (s: BusinessSettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('essence_theme') === 'dark';
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: 'EssenceFlow',
    email: 'admin@essenceflow.com',
    categories: [
      { name: 'OIL', unit: 'ml' },
      { name: 'BOTTLE', unit: 'pcs' },
      { name: 'BOX', unit: 'pcs' }
    ]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await api.getSettings();
      setBusinessSettings(s);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('essence_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('essence_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const updateBusinessSettings = async (s: BusinessSettings) => {
    const updated = await api.updateSettings(s);
    setBusinessSettings(updated);
  };

  return (
    <AppContext.Provider 
      value={{ 
        user, setUser, currentPage, setCurrentPage, darkMode, toggleDarkMode, 
        businessSettings, updateBusinessSettings 
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
