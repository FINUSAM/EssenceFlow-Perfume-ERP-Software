
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Vendor, Customer } from '../types.ts';

const Contacts: React.FC = () => {
  const [tab, setTab] = useState<'VENDORS' | 'CUSTOMERS'>('VENDORS');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    leadTime: 7,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [v, c] = await Promise.all([api.getVendors(), api.getCustomers()]);
      setVendors(v);
      setCustomers(c);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setFormData({ name: v.name, email: v.email, phone: v.phone, leadTime: v.leadTime });
    setShowModal(true);
  };

  const handleEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({ name: c.name, email: c.email, phone: c.phone, leadTime: 0 });
    setShowModal(true);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (tab === 'VENDORS') {
        await api.deleteVendor(confirmDeleteId);
      } else {
        await api.deleteCustomer(confirmDeleteId);
      }
      await fetchData();
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      if (tab === 'VENDORS') {
        if (editingVendor) {
          await api.updateVendor(editingVendor.id, formData);
        } else {
          await api.addVendor(formData as any);
        }
      } else {
        if (editingCustomer) {
          await api.updateCustomer(editingCustomer.id, formData);
        } else {
          await api.addCustomer({ name: formData.name, email: formData.email, phone: formData.phone } as any);
        }
      }
      await fetchData();
      handleClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to update contact registry.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingVendor(null);
    setEditingCustomer(null);
    setFormError(null);
    setFormData({ name: '', email: '', phone: '', leadTime: 7 });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-[2.5rem] shadow-sm border border-gold-100/50 dark:border-slate-800">
        <div className="flex p-1.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 w-full sm:w-auto">
          <button 
            onClick={() => setTab('VENDORS')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              tab === 'VENDORS' ? 'bg-gold-600 text-white shadow-lg' : 'text-slate-400 hover:text-gold-600'
            }`}
          >
            Suppliers
          </button>
          <button 
            onClick={() => setTab('CUSTOMERS')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              tab === 'CUSTOMERS' ? 'bg-gold-600 text-white shadow-lg' : 'text-slate-400 hover:text-gold-600'
            }`}
          >
            Clientele
          </button>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-slate-900 dark:bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-xl transition-all active:scale-95"
        >
          Add {tab === 'VENDORS' ? 'Vendor' : 'Customer'} Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 md:pb-0">
        {tab === 'VENDORS' ? (
          vendors.map(v => (
            <div key={v.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-white dark:border-slate-800 relative transition-all group">
              <h3 className="text-xl font-serif font-bold mb-6 text-slate-900 dark:text-white leading-tight">{v.name}</h3>
              <div className="space-y-4">
                <div className="bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-50 dark:border-slate-800/50">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Command</p>
                   <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{v.email}</p>
                </div>
                <div className="flex gap-4">
                   <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-50 dark:border-slate-800/50">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Direct Phone</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{v.phone}</p>
                   </div>
                   <div className="flex-1 bg-gold-50/50 dark:bg-gold-950/10 p-4 rounded-2xl border border-gold-100/50">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gold-600 mb-1">Lead Horizon</p>
                      <p className="text-xs font-bold text-gold-700 dark:text-gold-400">{v.leadTime} Days</p>
                   </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                <button 
                  onClick={() => handleEditVendor(v)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-500 hover:text-gold-600 transition-all border border-slate-100 dark:border-slate-700"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => { setConfirmDeleteId(v.id); setDeleteError(null); }}
                  className="p-3 text-rose-300 hover:text-rose-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          customers.map(c => (
            <div key={c.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-white dark:border-slate-800 relative transition-all group">
              <h3 className="text-xl font-serif font-bold mb-6 text-slate-900 dark:text-white leading-tight">{c.name}</h3>
              <div className="space-y-4">
                <div className="bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-50 dark:border-slate-800/50">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Email</p>
                   <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{c.email}</p>
                </div>
                <div className="flex justify-between items-center bg-gold-50/50 dark:bg-gold-950/10 p-4 rounded-2xl border border-gold-100/50">
                  <p className="text-[9px] uppercase font-black text-gold-600 dark:text-gold-500 tracking-widest">Lifetime Value</p>
                  <p className="font-mono font-bold text-gold-700 dark:text-gold-400">₹{c.totalSpent.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="mt-8 flex gap-3 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                <button 
                  onClick={() => handleEditCustomer(c)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-500 hover:text-gold-600 transition-all border border-slate-100 dark:border-slate-700"
                >
                  Edit Client
                </button>
                <button 
                   onClick={() => { setConfirmDeleteId(c.id); setDeleteError(null); }}
                  className="p-3 text-rose-300 hover:text-rose-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[120]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-scaleUp text-center border border-slate-100 dark:border-slate-800">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${deleteError ? 'bg-rose-500 text-white' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold mb-2 dark:text-white">{deleteError ? 'Directory Conflict' : `Purge ${tab === 'VENDORS' ? 'Vendor' : 'Client'}?`}</h2>
            {deleteError ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-left mb-6">
                <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">Integrity Violation</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{deleteError}</p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">This record will be permanently purged from the directory. Active transaction logs for this entity must be resolved first.</p>
            )}
            <div className="flex gap-4">
              <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">{deleteError ? 'Dismiss' : 'Cancel'}</button>
              {!deleteError && (
                <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex items-center justify-center">
                  {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Purge Entry'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] p-8 md:p-14 max-w-md w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white pb-12 sm:pb-14">
            <h2 className="text-3xl font-serif font-bold mb-1">
              {editingVendor || editingCustomer ? 'Update Profile' : 'New Entry'}
            </h2>
             <p className="text-slate-400 text-[10px] mb-10 tracking-widest uppercase font-black">{tab === 'VENDORS' ? 'Supplier Registry' : 'Client Directory'}</p>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Legal Identity</label>
                <input required type="text" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Electronic Mail</label>
                <input required type="email" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Direct Voice Line</label>
                <input required type="text" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              {tab === 'VENDORS' && (
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Est. Delivery Cycle (Days)</label>
                  <input required type="number" min="0" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm outline-none" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value) || 0})} />
                </div>
              )}
              
              {formError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/30">
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10 border-t border-slate-50 dark:border-slate-800">
                <button type="button" onClick={handleClose} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard</button>
                <button type="submit" disabled={isSaving} className="w-full sm:w-auto px-12 py-5 bg-gold-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all flex items-center justify-center">
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
