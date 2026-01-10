
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { InventoryItem, Product } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';

const Lab: React.FC = () => {
  const { businessSettings } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showMixBatch, setShowMixBatch] = useState<Product | null>(null);
  const [showAdjustStock, setShowAdjustStock] = useState<Product | null>(null);

  // Delete States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Operation States
  const [mixQuantity, setMixQuantity] = useState(1);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'currentStock'>>({
    sku: '',
    name: '',
    ingredients: [],
    packaging: [],
    sellingPrice: 0,
    totalCost: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prods, inv] = await Promise.all([api.getProducts(), api.getInventory()]);
    setProducts(prods);
    setInventory(inv);
  };

  useEffect(() => {
    const cost = [...newProduct.ingredients, ...newProduct.packaging].reduce((sum, item) => {
      if (!item.inventoryItemId) return sum;
      const invItem = inventory.find(i => String(i._id) === String(item.inventoryItemId));
      const unitCost = Number(invItem?.costPerUnit) || 0;
      const qty = Number(item.amount) || 0;
      return sum + (unitCost * qty);
    }, 0);

    const finalCost = parseFloat(cost.toFixed(2));
    if (newProduct.totalCost !== finalCost) {
      setNewProduct(prev => ({ ...prev, totalCost: finalCost }));
    }
  }, [newProduct.ingredients, newProduct.packaging, inventory, newProduct.totalCost]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, newProduct);
      } else {
        const productToSend = {
          ...newProduct,
          sku: newProduct.sku || `EF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        };
        await api.addProduct(productToSend);
      }

      handleCloseModal();
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setNewProduct({
      sku: p.sku,
      name: p.name,
      ingredients: p.ingredients.map(i => ({
        ...i,
        inventoryItemId: typeof i.inventoryItemId === 'object' && i.inventoryItemId ? (i.inventoryItemId as any)._id : i.inventoryItemId
      })),
      packaging: p.packaging.map(i => ({
        ...i,
        inventoryItemId: typeof i.inventoryItemId === 'object' && i.inventoryItemId ? (i.inventoryItemId as any)._id : i.inventoryItemId
      })),
      sellingPrice: p.sellingPrice,
      totalCost: p.totalCost
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setNewProduct({
      sku: '',
      name: '',
      ingredients: [],
      packaging: [],
      sellingPrice: 0,
      totalCost: 0
    });
  };

  // Helper to add ingredient row
  const addIngredientRow = () => {
    setNewProduct({
      ...newProduct,
      ingredients: [...newProduct.ingredients, { inventoryItemId: '', amount: 0 }]
    });
  };

  const updateIngredient = (index: number, field: 'inventoryItemId' | 'amount', value: any) => {
    const updated = [...newProduct.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setNewProduct({ ...newProduct, ingredients: updated });
  };

  const removeIngredient = (index: number) => {
    const updated = newProduct.ingredients.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, ingredients: updated });
  };

  // Helper for packaging
  const addPackagingRow = () => {
    setNewProduct({
      ...newProduct,
      packaging: [...newProduct.packaging, { inventoryItemId: '', amount: 0 }]
    });
  };

  const updatePackaging = (index: number, field: 'inventoryItemId' | 'amount', value: any) => {
    const updated = [...newProduct.packaging];
    updated[index] = { ...updated[index], [field]: value };
    setNewProduct({ ...newProduct, packaging: updated });
  };

  const removePackaging = (index: number) => {
    const updated = newProduct.packaging.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, packaging: updated });
  };

  // ... existing handleMix, handleAdjustStock, executeDelete ...
  const handleMix = async () => {
    if (!showMixBatch) return;
    try {
      await api.produceProduct(showMixBatch._id, mixQuantity);
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
      await api.adjustProductStock(showAdjustStock._id, adjustQuantity);
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
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-gold-600 hover:bg-gold-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          New Formulation
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {products.map(p => (
          <div key={p._id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-7 md:p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800 flex flex-col transition-all active:scale-[0.98] group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-600 dark:text-gold-500">SKU: {p.sku}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(p)}
                  className="p-2 text-slate-300 hover:text-gold-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={() => { setConfirmDeleteId(p._id); setDeleteError(null); }}
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

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-end sm:items-center justify-center z-[100] overflow-hidden">
          <div className="absolute inset-0" onClick={handleCloseModal}></div>
          <div className="bg-white dark:bg-slate-900 rounded-t-[3.5rem] sm:rounded-[3rem] max-w-4xl w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white relative max-h-[95vh] flex flex-col z-10">
            <div className="p-8 md:p-12 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-3xl font-serif font-bold mb-1">{editingProduct ? 'Edit Formulation' : 'New Formulation'}</h2>
              <p className="text-slate-400 text-[10px] tracking-widest uppercase font-black">Product & Recipe Definition</p>
            </div>

            <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto px-8 md:px-12 py-8 no-scrollbar space-y-10">
              <div className="grid grid-cols-1">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Product Name</label>
                  <input required type="text" className="w-full h-16 px-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-lg outline-none focus:ring-2 focus:ring-gold-500" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Selling Price (₹)</label>
                  <input required type="number" step="0.01" className="w-full h-16 px-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-gold-500" value={newProduct.sellingPrice} onChange={e => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Base Cost (Auto-Calc)</label>
                  <input readOnly type="number" step="0.01" className="w-full h-16 px-6 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-lg outline-none text-slate-500 cursor-not-allowed" value={newProduct.totalCost} />
                </div>
              </div>

              {/* Ingredients Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gold-600">Base Ingredients (Oils)</label>
                  <button type="button" onClick={addIngredientRow} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-100 text-slate-600">+ Add</button>
                </div>
                <div className="space-y-3">
                  {newProduct.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-4">
                      <select required className="flex-[2] h-14 px-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={ing.inventoryItemId} onChange={e => updateIngredient(idx, 'inventoryItemId', e.target.value)}>
                        <option value="">Select Material...</option>
                        {inventory.filter(i => i.category === 'OIL').map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                      </select>
                      <input required type="number" placeholder="Qty" step="0.01" className="flex-1 h-14 px-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm outline-none" value={ing.amount} onChange={e => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)} />
                      <button type="button" onClick={() => removeIngredient(idx)} className="w-14 h-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packaging Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Packaging Components</label>
                  <button type="button" onClick={addPackagingRow} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-100 text-slate-600">+ Add</button>
                </div>
                <div className="space-y-3">
                  {newProduct.packaging.map((pkg, idx) => (
                    <div key={idx} className="flex gap-4">
                      <select required className="flex-[2] h-14 px-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none" value={pkg.inventoryItemId} onChange={e => updatePackaging(idx, 'inventoryItemId', e.target.value)}>
                        <option value="">Select Component...</option>
                        {inventory.filter(i => i.category !== 'OIL').map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                      </select>
                      <input required type="number" placeholder="Qty" step="1" className="flex-1 h-14 px-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm outline-none" value={pkg.amount} onChange={e => updatePackaging(idx, 'amount', parseFloat(e.target.value) || 0)} />
                      <button type="button" onClick={() => removePackaging(idx)} className="w-14 h-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-5 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Discard</button>
                <button type="submit" className="px-14 py-6 bg-gold-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all">Save Definition</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <div className="flex gap-3 items-center">
                  <button onClick={() => setMixQuantity(q => Math.max(1, q - 1))} className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xl font-bold flex items-center justify-center transition-all active:bg-gold-100 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  </button>
                  <input type="number" className="min-w-0 flex-1 h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-3xl font-serif font-bold text-center outline-none focus:ring-2 focus:ring-gold-500" value={mixQuantity} onChange={e => setMixQuantity(parseInt(e.target.value) || 1)} />
                  <button onClick={() => setMixQuantity(q => q + 1)} className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xl font-bold flex items-center justify-center transition-all active:bg-gold-100 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
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
