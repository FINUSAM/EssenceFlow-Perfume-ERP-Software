
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Expense } from '../types.ts';
import { EXPENSE_CATEGORIES } from '../constants.tsx';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newExp, setNewExp] = useState<Omit<Expense, 'id'>>({
    category: EXPENSE_CATEGORIES[0],
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await api.getExpenses();
    setExpenses(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addExpense(newExp);
    await fetchData();
    setShowAdd(false);
    setNewExp({
      category: EXPENSE_CATEGORIES[0],
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteExpense(confirmDeleteId);
      await fetchData();
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to purge record from ledger.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="bg-gold-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-lg md:text-xl font-serif font-bold opacity-80 mb-2 tracking-tight">Total Laboratory Overhead</h3>
          <p className="text-4xl md:text-6xl font-serif font-bold tracking-tight">₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-6 opacity-60">Consolidated Operational Expenditure</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="relative z-10 bg-white text-gold-600 px-10 py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-2xl shadow-gold-950/20 active:scale-95 transition-all"
        >
          Add Expense Record
        </button>
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-12 -translate-y-12 scale-150">
           <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 md:pb-0">
        {expenses.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-gold-100 dark:border-slate-800">
            <p className="text-slate-400 font-serif italic text-lg">No operational expenses recorded.</p>
          </div>
        )}
        {expenses.map(exp => (
          <div key={exp.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-7 rounded-[2.5rem] shadow-sm border border-white dark:border-slate-800 relative transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-full text-[8px] font-black uppercase tracking-widest">
                {exp.category}
              </span>
              <button 
                onClick={() => { setConfirmDeleteId(exp.id); setDeleteError(null); }} 
                className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-300 hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            <h4 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-1">{exp.description}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{new Date(exp.date).toLocaleDateString()}</p>

            <div className="pt-5 border-t border-slate-50 dark:border-slate-800/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Value</p>
              <p className="font-mono font-bold text-2xl text-rose-500">-₹{exp.amount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[150]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-scaleUp text-center border border-slate-100 dark:border-slate-800">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${deleteError ? 'bg-rose-500 text-white animate-bounce' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            
            <h2 className="text-xl font-serif font-bold mb-2 dark:text-white">{deleteError ? 'Registry Alert' : 'Delete Record?'}</h2>
            
            {deleteError ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-left mb-6">
                <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-2">Protocol Error</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{deleteError}</p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">This operational overhead record will be permanently purged from the ledger. This cannot be undone.</p>
            )}

            <div className="flex gap-4">
              <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">{deleteError ? 'Close' : 'Cancel'}</button>
              {!deleteError && (
                <button 
                  onClick={executeDelete} 
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex items-center justify-center transition-all"
                >
                  {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Purge Entry'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] p-8 md:p-14 max-w-md w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white pb-12 sm:pb-14">
            <h2 className="text-3xl font-serif font-bold mb-1">Overhead Log</h2>
            <p className="text-slate-400 text-[10px] mb-10 tracking-widest uppercase font-black">Operational Expenditure Record</p>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Expense Class</label>
                <select className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none appearance-none" value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Material Description</label>
                <input required type="text" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Value (₹)</label>
                  <input required type="number" step="0.01" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm outline-none" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Date</label>
                  <input required type="date" className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={newExp.date} onChange={e => setNewExp({...newExp, date: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10 border-t border-slate-50 dark:border-slate-800">
                <button type="button" onClick={() => setShowAdd(false)} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard</button>
                <button type="submit" className="w-full sm:w-auto px-12 py-5 bg-gold-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">Log Expenditure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
