
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { Wastage, InventoryItem, BusinessSettings } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { LOGO_SVG } from '../constants.tsx';

const Settings: React.FC = () => {
  const { businessSettings, updateBusinessSettings, darkMode, toggleDarkMode } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({ ...businessSettings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [logoError, setLogoError] = useState<string | null>(null);

  const [wastage, setWastage] = useState<Wastage[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showLogWastage, setShowLogWastage] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newWastage, setNewWastage] = useState<Omit<Wastage, 'id'>>({
    inventoryItemId: '',
    amount: 0,
    reason: 'Spillage during mixing',
    cost: 0,
    date: new Date().toISOString()
  });

  useEffect(() => {
    fetchWastageData();
  }, []);

  const fetchWastageData = async () => {
    const [w, i] = await Promise.all([api.getWastage(), api.getInventory()]);
    setWastage(w.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setInventory(i);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError(null);
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setLogoError("File exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logoUrl: undefined });
    setLogoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('IDLE');
    try {
      await updateBusinessSettings(formData);
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    } catch (error) {
      setSaveStatus('ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === newWastage.inventoryItemId);
    const cost = item ? item.costPerUnit * newWastage.amount : 0;
    
    await api.addWastage({...newWastage, cost});
    await fetchWastageData();
    setShowLogWastage(false);
    setNewWastage({
      inventoryItemId: '',
      amount: 0,
      reason: 'Spillage during mixing',
      cost: 0,
      date: new Date().toISOString()
    });
  };

  const executeDeleteWastage = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteWastage(confirmDeleteId);
      await fetchWastageData();
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, { name: '', unit: '' }]
    });
  };

  const removeCategory = (index: number) => {
    const newCats = formData.categories.filter((_, i) => i !== index);
    setFormData({ ...formData, categories: newCats });
  };

  const updateCategory = (index: number, field: 'name' | 'unit', value: string) => {
    const newCats = [...formData.categories];
    newCats[index] = { ...newCats[index], [field]: value.toUpperCase() };
    setFormData({ ...formData, categories: newCats });
  };

  const getUnit = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return 'units';
    const cat = businessSettings.categories.find(c => c.name === item.category);
    return cat?.unit || 'units';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn pb-32">
      <div className="px-2">
        <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Laboratory Protocols</h2>
        <p className="text-slate-500 text-sm mt-1 tracking-tight font-medium">Manage your atelier's digital identity and monitor material loss.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-sm border border-white dark:border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-600 mb-6">Interface Theme</h3>
            <button 
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-gold-500' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-serif font-bold mb-2">System Health</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">Infrastructure and data integrity diagnostics.</p>
              <div className="flex items-center gap-3 py-3 border-t border-white/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Network: Secure</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-t border-white/10">
                <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Database: Synced</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSavePreferences} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-xl border border-white dark:border-slate-800 space-y-10">
            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-600">Brand Identity</h3>
              
              <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="shrink-0 relative">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="scale-125 opacity-20">{LOGO_SVG}</div>
                    )}
                  </div>
                  {formData.logoUrl && (
                    <button 
                      type="button" 
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-rose-600 transition-all border-4 border-white dark:border-slate-950"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Atelier Signature Asset</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Upload a PNG or JPG to serve as your laboratory's official branding on invoices and reports.</p>
                  <div className="flex flex-col gap-3 items-center md:items-start pt-1">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gold-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-gold-500/20 active:scale-95 transition-all"
                    >
                      {formData.logoUrl ? 'Update Brand Logo' : 'Select Brand Logo'}
                    </button>
                    {logoError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{logoError}</p>}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Atelier Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Admin Email</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Atelier Caption</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fine Fragrance Atelier"
                  className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                  value={formData.caption || ''}
                  onChange={e => setFormData({...formData, caption: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-8 pt-10 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-600">Material Classification</h3>
                <button 
                  type="button" 
                  onClick={addCategory}
                  className="text-[9px] font-black uppercase tracking-widest text-gold-600 flex items-center gap-2 hover:opacity-70 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  Define New Class
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.categories.map((cat, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                      <input 
                        placeholder="CLASS NAME"
                        className="w-full bg-transparent font-black text-[10px] uppercase tracking-widest outline-none border-none"
                        value={cat.name}
                        onChange={e => updateCategory(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-20 border-l border-slate-200 dark:border-slate-800 pl-4">
                      <input 
                        placeholder="UNIT"
                        className="w-full bg-transparent font-mono font-bold text-xs text-gold-600 outline-none border-none text-right"
                        value={cat.unit}
                        onChange={e => updateCategory(idx, 'unit', e.target.value)}
                      />
                    </div>
                    <button type="button" onClick={() => removeCategory(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10 flex items-center gap-6">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-gold-600 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-gold-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSaving ? (
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Commit Registry Changes'}
              </button>
              
              {saveStatus === 'SUCCESS' && <div className="text-emerald-500 font-black text-[9px] uppercase tracking-widest animate-fadeIn">Registry Updated</div>}
              {saveStatus === 'ERROR' && <div className="text-rose-500 font-black text-[9px] uppercase tracking-widest animate-fadeIn">Sync Failed</div>}
            </div>
          </form>
        </div>
      </div>

      <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] md:rounded-[3.5rem] shadow-xl border border-white dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">Wastage & Spillage Log</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">Record laboratory spillages to maintain perfect inventory reconciliation.</p>
          </div>
          <button 
            onClick={() => setShowLogWastage(true)}
            className="w-full md:w-auto bg-rose-600 text-white px-6 md:px-8 py-4 md:py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            Log Material Loss
          </button>
        </div>
        
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date Logged</th>
                <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Material</th>
                <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Volume/Qty</th>
                <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Root Cause</th>
                <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Impact Value</th>
                <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {wastage.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-slate-400 font-serif italic text-lg">No spillages recorded. Laboratory precision is optimal.</p>
                  </td>
                </tr>
              )}
              {wastage.map(w => {
                const item = inventory.find(i => i.id === w.inventoryItemId);
                return (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="py-6 text-sm font-mono text-slate-500">{new Date(w.date).toLocaleDateString()}</td>
                    <td className="py-6">
                      <div className="font-bold text-slate-900 dark:text-white">{item?.name || 'Unknown material'}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item?.category}</div>
                    </td>
                    <td className="py-6 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {w.amount.toLocaleString()} <span className="text-[10px] opacity-50 uppercase">{getUnit(w.inventoryItemId)}</span>
                    </td>
                    <td className="py-6 text-sm font-medium text-slate-600 dark:text-slate-400 italic">"{w.reason}"</td>
                    <td className="py-6 text-right font-mono font-bold text-rose-500">₹{w.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-6 text-center">
                      <button 
                        onClick={() => { setConfirmDeleteId(w.id); }} 
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-300 hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-800 shadow-sm"
                        title="Delete record and return materials to inventory"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
           {wastage.length === 0 ? (
             <div className="py-10 text-center">
               <p className="text-slate-400 font-serif italic text-base">No spillages recorded.</p>
             </div>
           ) : (
             wastage.map(w => {
               const item = inventory.find(i => i.id === w.inventoryItemId);
               return (
                 <div key={w.id} className="bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 relative transition-all active:scale-[0.98]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-mono text-slate-400">{new Date(w.date).toLocaleDateString()}</p>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">{item?.name || 'Unknown material'}</h4>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item?.category}</span>
                      </div>
                      <button 
                        onClick={() => { setConfirmDeleteId(w.id); }} 
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-rose-400 shadow-sm border border-slate-100 dark:border-slate-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100 dark:border-slate-800/50 my-2">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Loss Volume</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                             {w.amount} <span className="text-[9px] opacity-50 uppercase">{getUnit(w.inventoryItemId)}</span>
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Value</p>
                          <p className="font-mono font-bold text-rose-500">₹{w.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                       </div>
                    </div>

                    <div className="pt-2">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Root Cause</p>
                       <p className="text-xs italic text-slate-600 dark:text-slate-400">"{w.reason}"</p>
                    </div>
                 </div>
               );
             })
           )}
        </div>
      </section>

      {/* Delete Confirmation Modal for Wastage */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[250]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-scaleUp text-center border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold mb-2 dark:text-white">Void Loss Entry?</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">This will purge the wastage log and restore the impacted material quantity back to active inventory stock.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Cancel</button>
              <button 
                onClick={executeDeleteWastage} 
                disabled={isDeleting}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex items-center justify-center transition-all"
              >
                {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Purge & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogWastage && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-[200]">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3.5rem] sm:rounded-[3rem] p-8 md:p-14 max-w-md w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white pb-12 sm:pb-14">
            <h2 className="text-3xl font-serif font-bold mb-1">Spillage Log</h2>
            <p className="text-slate-400 text-[10px] mb-10 tracking-widest uppercase font-black">Material Loss Reconciliation</p>
            <form onSubmit={handleLogWastage} className="space-y-6 text-left">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Impacted Material</label>
                <select required className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none appearance-none" value={newWastage.inventoryItemId} onChange={e => setNewWastage({...newWastage, inventoryItemId: e.target.value})}>
                  <option value="">-- Archive Registry --</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.quantity})</option>)}
                </select>
              </div>
              <div className="relative">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Amount Lost</label>
                <input required type="number" step="0.001" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-lg outline-none" value={newWastage.amount} onChange={e => setNewWastage({...newWastage, amount: parseFloat(e.target.value) || 0})} />
                <span className="absolute right-5 bottom-4 text-[9px] font-black uppercase text-gold-600 opacity-50">{getUnit(newWastage.inventoryItemId)}</span>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Root Cause Description</label>
                <input required type="text" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={newWastage.reason} onChange={e => setNewWastage({...newWastage, reason: e.target.value})} />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10 border-t border-slate-50 dark:border-slate-800">
                <button type="button" onClick={() => setShowLogWastage(false)} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Abort</button>
                <button type="submit" className="w-full sm:w-auto px-12 py-5 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">Execute Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
