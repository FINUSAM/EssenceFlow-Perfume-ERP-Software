
import React, { useState } from 'react';
import { AppProvider, useApp, Page } from './context/AppContext.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Inventory from './pages/Inventory.tsx';
import Lab from './pages/Lab.tsx';
import Sales from './pages/Sales.tsx';
import Expenses from './pages/Expenses.tsx';
import Contacts from './pages/Contacts.tsx';
import Settings from './pages/Settings.tsx';
import Purchasing from './pages/Purchasing.tsx';
import Sidebar from './components/Sidebar.tsx';

const AppContent: React.FC = () => {
  const { user, setUser, logout, currentPage, setCurrentPage, darkMode, toggleDarkMode, businessSettings } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'purchasing': return <Purchasing />;
      case 'products': return <Lab />;
      case 'sales': return <Sales />;
      case 'expenses': return <Expenses />;
      case 'contacts': return <Contacts />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const handleMobileNav = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#fdfcf8] dark:bg-luxury-black text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex md:hidden items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gold-100/50 dark:border-slate-800 z-30">
          <h1 className="text-xl font-serif font-bold text-gold-600 truncate max-w-[150px]">
            {businessSettings.name}
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 text-slate-400">
              {darkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button onClick={logout} className="text-[10px] font-black uppercase tracking-widest bg-gold-600 text-white px-3 py-1.5 rounded-lg shadow-sm">
              Signout
            </button>
          </div>
        </header>

        <header className="hidden md:flex justify-between items-center px-8 py-6 bg-transparent">
          <h1 className="text-3xl font-serif font-bold capitalize text-slate-900 dark:text-white">
            {currentPage === 'inventory' ? 'Stock' : currentPage === 'products' ? 'Product' : currentPage.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated As</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.email}</p>
            </div>
            <button onClick={logout} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:text-red-500 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:px-8 md:pb-8 pb-24 no-scrollbar">
          {renderPage()}
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[45] animate-fadeIn" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute bottom-24 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-slate-800 p-6 shadow-2xl animate-scaleUp" onClick={e => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'purchasing', label: 'Purchasing', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                  { id: 'expenses', label: 'Expenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                  { id: 'contacts', label: 'Directory', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
                  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37' }
                ].map(item => (
                  <button key={item.id} onClick={() => handleMobileNav(item.id as any)} className={`flex flex-col items-center gap-2 p-6 rounded-3xl transition-all ${currentPage === item.id ? 'bg-gold-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gold-100/50 dark:border-slate-800 flex justify-around items-center p-3 pb-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {[
            { id: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home' },
            { id: 'inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Stock' },
            { id: 'products', icon: 'M10 2h4l1 3H9l1-3zM7 8h10a1 1 0 011 1v11a2 2 0 01-2 2H8a2 2 0 01-2-2V9a1 1 0 011-1zm5 4v4m-2-2h4', label: 'Product' },
            { id: 'sales', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Sales' },
            { id: 'more', icon: 'M4 6h16M4 12h16M4 18h16', label: 'More' }
          ].map(item => (
            <button key={item.id} onClick={() => item.id === 'more' ? setIsMobileMenuOpen(!isMobileMenuOpen) : handleMobileNav(item.id as any)} className={`flex flex-col items-center gap-1 transition-all duration-300 ${((item.id === 'more' && isMobileMenuOpen) || currentPage === item.id) ? 'text-gold-600 scale-110' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
