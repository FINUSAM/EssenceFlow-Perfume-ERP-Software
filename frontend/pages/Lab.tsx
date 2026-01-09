
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { InventoryItem, Product } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';

const Lab: React.FC = () => {
  const { businessSettings } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [showMixBatch, setShowMixBatch] = useState<Product | null>(null);
  const [showAdjustStock, setShowAdjustStock] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [mixQuantity, setMixQuantity] = useState(1);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const prods = await api.getProducts();
    setProducts(prods);
  };

  const handleMix = async () => {
    if (!showMixBatch) return;
    try {
      await api.produceProduct(showMixBatch.id, mixQuantity);
      setSuccessMessage(`Formulated ${mixQuantity} units. Balance synchronized.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setShowMixBatch(null);
      setMixQuantity(1);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleAdjustStock = async () => {
    if (!showAdjustStock) return;
    try {
      await api.adjustProductStock(showAdjustStock.id, adjustQuantity);
      setSuccessMessage(`Stock level adjusted by ${adjustQuantity}. Reconciliation complete.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setShowAdjustStock(null);
      setAdjustQuantity(0);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteProduct(confirmDeleteId);
      await fetchData();
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-10 animate-fadeIn">
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-5 rounded-3xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="font-bold text-sm tracking-tight">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <p className="text-slate-500 font-serif italic text-base md:text-lg max-w-lg leading-relaxed">Formulating high-purity finished product goods from raw material bases.</p>
        <button className="w-full md:w-auto bg-gold-600 hover:bg-gold-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          New Formulation
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {products.map(p => (
          <div key={p.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-7 md:p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800 flex flex-col transition-all active:scale-[0.98] group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-600 dark:text-gold-500">SKU: {p.sku}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setConfirmDeleteId(p.id); setDeleteError(null); }}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => setShowAdjustStock(p)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${p.currentStock > 5 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                  Stock: {p.currentStock}
                </button>
              </div>
            </div>
            
            <h3 className="text-xl md:text-2xl font-serif font-bold mb-6 text-slate-900 dark:text-white leading-tight">{p.name}</h3>
            
            <div className="space-y-2 mb-8 flex-1">
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Batch Cost</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-base">₹{p.totalCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center bg-gold-50/50 dark:bg-gold-950/10 p-3.5 rounded-2xl border border-gold-100/50">
                <span className="text-[9px] font-black uppercase tracking-widest text-gold-600">Retail</span>
                <span className="font-mono font-bold text-gold-600 text-base">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowMixBatch(p)}
              className="w-full py-4.5 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg active:bg-gold-600 transition-all"
            >
              Start Assembly
            </button>
          </div>
        ))}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[150]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-scaleUp text-center border border-slate-100 dark:border-slate-800">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${deleteError ? 'bg-rose-500 text-white' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold mb-2 dark:text-white">{deleteError ? 'Archival Conflict' : 'Retire Formulation?'}</h2>
            {deleteError ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-left mb-6">
                <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">Integrity Violation</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{deleteError}</p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Retiring this SKU will remove its formulation logic. Active stock remains but new production will be disabled.</p>
            )}
            <div className="flex gap-4">
              <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">{deleteError ? 'Dismiss' : 'Cancel'}</button>
              {!deleteError && (
                <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex items-center justify-center">
                  {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Purge SKU'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showMixBatch && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3.5rem] sm:rounded-[3rem] p-8 md:p-14 max-w-md w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white pb-12 sm:pb-14">
            <h2 className="text-3xl font-serif font-bold mb-1">Assembly Queue</h2>
            <p className="text-slate-400 text-[10px] mb-10 tracking-widest uppercase font-black">{showMixBatch.name}</p>
            <div className="space-y-10">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Batch Target Units</label>
                <div className="flex gap-4 items-center">
                  <button onClick={() => setMixQuantity(q => Math.max(1, q - 1))} className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 text-2xl font-bold flex items-center justify-center transition-all active:bg-gold-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  </button>
                  <input type="number" className="flex-1 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-4xl font-serif font-bold text-center outline-none focus:ring-2 focus:ring-gold-500" value={mixQuantity} onChange={e => setMixQuantity(parseInt(e.target.value) || 1)} />
                  <button onClick={() => setMixQuantity(q => q + 1)} className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 text-2xl font-bold flex items-center justify-center transition-all active:bg-gold-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>
              {errorMessage && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Protocol Warning: {errorMessage}</div>}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10 border-t border-slate-50 dark:border-slate-800">
                <button onClick={() => { setShowMixBatch(null); setErrorMessage(''); }} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Abort</button>
                <button onClick={handleMix} className="w-full sm:w-auto px-12 py-5 bg-gold-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">Formulate Batch</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdjustStock && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3.5rem] sm:rounded-[3rem] p-8 md:p-14 max-w-md w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white pb-12 sm:pb-14">
            <h2 className="text-3xl font-serif font-bold mb-1">Shelf Balance</h2>
            <p className="text-slate-400 text-[10px] mb-10 tracking-widest uppercase font-black">{showAdjustStock.name}</p>
            <div className="space-y-10">
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Available Finished Units</span>
                <span className="text-6xl font-serif font-bold text-gold-600">{showAdjustStock.currentStock}</span>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Reconciliation Value</label>
                <input type="number" className="w-full p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-5xl font-mono font-bold text-center outline-none focus:ring-2 focus:ring-gold-500" value={adjustQuantity} onChange={e => setAdjustQuantity(parseInt(e.target.value) || 0)} />
                <p className="text-[10px] text-center mt-6 text-slate-400 italic leading-relaxed uppercase tracking-tighter">Negative values initiate dismantling and material return.</p>
              </div>
              {errorMessage && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Logic Constraint: {errorMessage}</div>}
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button onClick={() => { setShowAdjustStock(null); setAdjustQuantity(0); setErrorMessage(''); }} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Dismiss</button>
                <button onClick={handleAdjustStock} className={`w-full sm:w-auto px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all ${adjustQuantity < 0 ? 'bg-rose-600 text-white' : 'bg-gold-600 text-white'}`}>Sync Product</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lab;
