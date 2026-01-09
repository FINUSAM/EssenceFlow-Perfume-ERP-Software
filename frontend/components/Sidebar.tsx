
import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { LOGO_SVG } from '../constants.tsx';

const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, businessSettings } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'inventory', label: 'Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'purchasing', label: 'Purchasing', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { id: 'products', label: 'Product', icon: 'M10 2h4l1 3H9l1-3zM7 8h10a1 1 0 011 1v11a2 2 0 01-2 2H8a2 2 0 01-2-2V9a1 1 0 011-1zm5 4v4m-2-2h4' },
    { id: 'sales', label: 'Sales', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'expenses', label: 'Expenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'contacts', label: 'Directory', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-gold-200/30 dark:border-slate-800 flex flex-col h-full transition-all relative z-40">
      <div className="p-8 flex items-center gap-4">
        <div className="flex-shrink-0 transition-transform hover:scale-110 duration-500">
          {businessSettings.logoUrl ? (
            <img src={businessSettings.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
          ) : LOGO_SVG}
        </div>
        <span className="text-xl font-serif font-bold text-slate-800 dark:text-gold-400 truncate tracking-tight">
          {businessSettings.name}
        </span>
      </div>
      
      <nav className="flex-1 mt-4 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id as any)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
              currentPage === item.id 
                ? 'bg-gold-500 text-white shadow-[0_8px_20px_-4px_rgba(184,142,58,0.4)]' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-gold-50/80 dark:hover:bg-slate-900'
            }`}
          >
            <svg className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${currentPage === item.id ? 'scale-110' : 'group-hover:text-gold-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className={`text-sm font-bold tracking-tight transition-all duration-300 ${currentPage === item.id ? 'translate-x-1' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      
      <div className="p-6 border-t border-gold-100/50 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
          <p className="text-[9px] text-gold-600 dark:text-gold-500 font-black uppercase tracking-[0.2em] mb-2">Cloud Network</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
            </div>
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Encrypted</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
