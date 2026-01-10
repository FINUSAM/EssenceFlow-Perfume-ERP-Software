
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { InventoryItem, Sale, Expense } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';

const Dashboard: React.FC = () => {
  const { businessSettings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState<any>(null);
  const [systemError, setSystemError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [inv, sls, exp] = await Promise.all([
        api.getInventory(),
        api.getSales(),
        api.getExpenses()
      ]);
      setInventory(inv);
      setSales(sls.filter(s => s.status === 'COMPLETED'));
      setExpenses(exp);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCOGS = sales.reduce((sum, s) => sum + (s.subtotal * 0.4), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSales - totalCOGS - totalExpenses;

  const assetValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  const lowStock = inventory.filter(i => i.quantity <= i.minThreshold);
  const nearingExpiry = inventory.filter(i => {
    if (!i.expiryDate) return false;
    const exp = new Date(i.expiryDate);
    const threeMonthsAway = new Date();
    threeMonthsAway.setMonth(threeMonthsAway.getMonth() + 3);
    return exp <= threeMonthsAway;
  });

  const getUnitForCategory = (categoryName: string) => {
    const cat = businessSettings.categories.find(c => c.name === categoryName);
    return cat ? cat.unit : 'pcs';
  };

  const handleExportJson = async () => {
    const data = await api.getBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `essenceflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);
        setPendingBackupData(backupData);
        setShowRestoreModal(true);
      } catch (err: any) {
        setSystemError("CRITICAL ERROR: The selected file is not a valid EssenceFlow archive or is corrupted.");
        setTimeout(() => setSystemError(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
    if (!pendingBackupData) return;
    try {
      await api.restoreBackup(pendingBackupData);
      window.location.reload();
    } catch (err: any) {
      setSystemError(err.message);
      setShowRestoreModal(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 md:p-7 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-white dark:border-slate-800 transition-all active:scale-95 md:hover:-translate-y-2">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${color.bg} ${color.text} shadow-sm text-2xl`}>
          {icon}
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${color.pill}`}>
          Live
        </div>
      </div>
      <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</h3>
      <p className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">₹{value.toLocaleString('en-IN')}</p>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-gold-500 font-serif italic text-xl animate-pulse tracking-widest">Awaiting Command...</div>;

  return (
    <div className="space-y-6 md:space-y-10 animate-fadeIn">
      {systemError && (
        <div className="fixed top-6 right-6 left-6 md:left-auto md:w-96 z-[200] animate-fadeIn">
          <div className="bg-rose-600 text-white p-5 rounded-3xl shadow-2xl flex items-start gap-4">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm font-bold leading-tight">{systemError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <StatCard title="Net Profit" value={netProfit} icon="💰" color={{ bg: 'from-emerald-50 to-emerald-100/50', text: 'text-emerald-600', pill: 'bg-emerald-50 text-emerald-600' }} />
        <StatCard title="Revenue" value={totalSales} icon="📈" color={{ bg: 'from-sky-50 to-sky-100/50', text: 'text-sky-600', pill: 'bg-sky-50 text-sky-600' }} />
        <StatCard title="Asset Value" value={assetValue} icon="🧪" color={{ bg: 'from-gold-50 to-gold-100/50', text: 'text-gold-600', pill: 'bg-gold-50 text-gold-600' }} />
        <StatCard title="Expenditure" value={totalExpenses} icon="📉" color={{ bg: 'from-rose-50 to-rose-100/50', text: 'text-rose-600', pill: 'bg-rose-50 text-rose-600' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800">
          <h2 className="text-xl md:text-2xl font-serif font-bold mb-6 md:mb-8 flex items-center gap-4 text-slate-900 dark:text-white">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gold-50 dark:bg-slate-800 flex items-center justify-center text-gold-600">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
            </div>
            Stock Alerts
          </h2>
          <div className="space-y-4">
            {lowStock.length === 0 && nearingExpiry.length === 0 && (
              <div className="py-12 md:py-20 text-center">
                <p className="text-slate-400 font-serif italic text-base md:text-lg">System operational. No pending alerts detected.</p>
              </div>
            )}
            {lowStock.map(item => (
              <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-6 bg-red-50/30 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl transition-all">
                <div className="flex gap-4 items-center mb-4 sm:mb-0">
                  <div className="w-1.5 h-10 bg-red-500 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-red-900 dark:text-red-300 text-base leading-tight">{item.name}</h4>
                    <p className="text-[10px] text-red-600/70 dark:text-red-400 font-black uppercase tracking-wider mt-0.5">Stock Shortfall: {item.quantity} {getUnitForCategory(item.category)}</p>
                  </div>
                </div>
                <button className="w-full sm:w-auto text-[9px] font-black uppercase tracking-[0.2em] text-red-700 bg-white dark:bg-slate-800 px-6 py-2.5 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50">Restock</button>
              </div>
            ))}
            {nearingExpiry.map(item => (
              <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl transition-all">
                <div className="flex gap-4 items-center mb-4 sm:mb-0">
                  <div className="w-1.5 h-10 bg-amber-500 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 text-base leading-tight">{item.name}</h4>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400 font-black uppercase tracking-wider mt-0.5">Expiry Horizon: {item.expiryDate}</p>
                  </div>
                </div>
                <button className="w-full sm:w-auto text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 bg-white dark:bg-slate-800 px-6 py-2.5 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/50">Audit</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-950 p-8 md:p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 scale-150 transition-transform group-hover:scale-[1.6]">
            <svg className="w-24 md:w-32 h-24 md:h-32 text-gold-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" /></svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-serif font-bold mb-2 text-white">System Stock</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">Secure state management and laboratory data exports.</p>

            <div className="space-y-4">
              <button onClick={handleExportJson} className="w-full flex items-center justify-between p-5 bg-white/10 border border-white/10 rounded-[1.5rem] hover:bg-gold-500 hover:border-gold-400 transition-all group">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Master Backup</span>
                <svg className="w-5 h-5 text-gold-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>

              <div className="relative">
                <input type="file" ref={fileInputRef} accept=".json" onChange={onFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[1.5rem] hover:bg-slate-800 transition-all group">
                  <span className="text-xs font-bold text-white uppercase tracking-widest opacity-80 group-hover:opacity-100">Restore Archive</span>
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </button>
              </div>

              <button className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[1.5rem] opacity-40 cursor-not-allowed">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Audit Archive</span>
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-gold-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Infrastructure</p>
                <p className="text-xs font-bold text-white">Synced & Secured</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-[300]">
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] max-w-lg w-full shadow-2xl animate-scaleUp text-center border border-white/20">
            <div className="w-20 h-20 rounded-full bg-gold-50 dark:bg-gold-950/20 text-gold-600 flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4 dark:text-white">System Re-Imaging</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mb-10 leading-relaxed">
              Caution: Restoring this archive will permanently <span className="text-rose-500 font-bold">OVERWRITE</span> all current laboratory data. This action is irreversible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => { setShowRestoreModal(false); setPendingBackupData(null); }} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Abort Process</button>
              <button onClick={executeRestore} className="flex-1 py-5 bg-gold-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-gold-500/20 active:scale-95 transition-all">Initialize Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
