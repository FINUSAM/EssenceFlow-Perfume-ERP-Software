
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { InventoryItem, Vendor } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';

const Inventory: React.FC = () => {
  const { businessSettings } = useApp();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    category: 'OIL',
    quantity: 0,
    costPerUnit: 0,
    minThreshold: 0,
    vendorId: '',
    batchNumber: '',
    expiryDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [inv, vends] = await Promise.all([api.getInventory(), api.getVendors()]);
    setInventory(inv);
    setVendors(vends);
    if (vends.length > 0 && !newItem.vendorId) setNewItem(prev => ({ ...prev, vendorId: vends[0]._id }));
  };

  const filtered = inventory.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || i.category === filter;
    return matchesSearch && matchesFilter;
  });

  const getUnitForCategory = (categoryName: string) => {
    const cat = businessSettings.categories.find(c => c.name === categoryName);
    return cat ? cat.unit : 'pcs';
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await api.updateInventory(editingItem._id, newItem);
    } else {
      await api.addInventory(newItem);
    }
    await fetchData();
    handleCloseModal();
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      costPerUnit: item.costPerUnit,
      minThreshold: item.minThreshold,
      vendorId: item.vendorId,
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate || ''
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setNewItem({
      name: '',
      category: 'OIL',
      quantity: 0,
      costPerUnit: 0,
      minThreshold: 0,
      vendorId: vendors[0]?._id || '',
      batchNumber: '',
      expiryDate: ''
    });
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(confirmDeleteId);
    setDeleteError(null);
    try {
      await api.deleteInventory(confirmDeleteId);
      await fetchData();
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 md:p-6 rounded-[2rem] shadow-sm border border-gold-100/50 dark:border-slate-800 sticky top-0 md:relative z-20">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Filter archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-4 pl-12 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-gold-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white w-full transition-all text-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-gold-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest sm:min-w-[150px]"
          >
            <option value="ALL">All Stocks</option>
            {businessSettings.categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-gold-600 hover:bg-gold-700 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-gold-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          New Stock Entry
        </button>
      </div>

      <div className="hidden lg:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl overflow-hidden border border-white dark:border-slate-800">
        <table className="w-full text-left">
          <thead className="bg-gold-50/50 dark:bg-slate-800/50">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">Material Identifier</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">Classification</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">Current Balance</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">Unit Val (₹)</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">Total Asset (₹)</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400 text-right pr-10">Command</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
            {filtered.map(item => (
              <tr key={item._id} className="hover:bg-gold-50/30 dark:hover:bg-slate-800/30 transition-all">
                <td className="p-6">
                  <div className="font-bold text-slate-900 dark:text-white text-lg">{item.name}</div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                    System Batch: <span className="font-mono text-gold-600 dark:text-gold-400">{item.batchNumber || 'PENDING'}</span>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${item.category === 'OIL' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                    {item.category}
                  </span>
                </td>
                <td className="p-6">
                  <div className={`font-mono font-bold text-lg ${item.quantity <= item.minThreshold ? 'text-rose-500 animate-pulse' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.quantity.toLocaleString(undefined, { minimumFractionDigits: getUnitForCategory(item.category) === 'ml' ? 3 : 0 })}
                    <span className="text-xs font-medium ml-1 opacity-50">{getUnitForCategory(item.category)}</span>
                  </div>
                </td>
                <td className="p-6 font-mono font-bold text-slate-700 dark:text-slate-300">₹{item.costPerUnit.toLocaleString('en-IN')}</td>
                <td className="p-6 font-mono font-bold text-gold-600">₹{(item.quantity * item.costPerUnit).toLocaleString('en-IN')}</td>
                <td className="p-6 text-right pr-10">
                  <div className="flex gap-4 justify-end">
                    <button onClick={() => handleEditClick(item)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-gold-600 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(item._id); setDeleteError(null); }}
                      className={`p-3 rounded-xl transition-all ${confirmDeleteId === item._id ? 'bg-red-500 text-white' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-400 hover:text-rose-600'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
        {filtered.map(item => (
          <div key={item._id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-sm border border-white dark:border-slate-800 relative transition-all active:scale-[0.98]">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${item.category === 'OIL' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                {item.category}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(item)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-gold-600 transition-all border border-slate-100 dark:border-slate-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                </button>
              </div>
            </div>

            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-1 leading-tight">{item.name}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Batch: <span className="text-gold-600">{item.batchNumber || 'Auto-Assigned'}</span></p>

            <div className="flex justify-between items-center py-5 border-y border-slate-50 dark:border-slate-800/50 my-5">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                <p className={`font-mono font-bold text-xl ${item.quantity <= item.minThreshold ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.quantity} <span className="text-[10px] opacity-60 ml-0.5">{getUnitForCategory(item.category)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Value</p>
                <p className="font-mono font-bold text-xl text-gold-600 tracking-tighter">₹{(item.quantity * item.costPerUnit).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <button
              onClick={() => { setConfirmDeleteId(item._id); setDeleteError(null); }}
              className="w-full py-4 border-2 border-dashed border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-center justify-center gap-2 group transition-all active:bg-rose-50 dark:active:bg-rose-950/20"
            >
              <svg className="w-4 h-4 text-rose-300 group-hover:text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 group-hover:text-rose-600">Remove from Stock</span>
            </button>
          </div>
        ))}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[120]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-scaleUp text-center border border-slate-100 dark:border-slate-800">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${deleteError ? 'bg-rose-500 text-white animate-bounce' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold mb-2 dark:text-white">{deleteError ? 'Integrity Violation' : 'Delete Asset?'}</h2>
            {deleteError ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-left mb-6">
                <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">Dependency Alert</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{deleteError}</p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">This action is irreversible. The material record will be purged from the stock vault.</p>
            )}
            <div className="flex gap-4">
              <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">{deleteError ? 'Close' : 'Cancel'}</button>
              {!deleteError && (
                <button onClick={executeDelete} disabled={isDeleting !== null} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center">
                  {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Purge Record'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-end sm:items-center justify-center z-[100] overflow-hidden">
          <div className="absolute inset-0 hidden sm:block" onClick={handleCloseModal}></div>
          <div className="bg-white dark:bg-slate-900 rounded-t-[3.5rem] sm:rounded-[3rem] max-w-3xl w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white relative max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-14 pb-0 md:pb-0 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8 sm:hidden"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl md:text-4xl font-serif font-bold mb-1">{editingItem ? 'Edit Protocol' : 'New Stock Log'}</h2>
                  <p className="text-slate-400 text-[9px] md:text-[10px] tracking-widest uppercase font-black">Stock Inventory Registry</p>
                </div>
                <button onClick={handleCloseModal} className="hidden sm:flex w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddOrEdit} className="flex-1 overflow-y-auto px-6 md:px-14 pb-32 sm:pb-14 no-scrollbar">
              <div className="space-y-6 md:space-y-8">
                {editingItem && (
                  <div className="bg-gold-50 dark:bg-gold-950/20 p-4 rounded-2xl border border-gold-100/50">
                    <p className="text-[9px] font-black text-gold-600 uppercase tracking-widest mb-1">Laboratory Lot Trace</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-gold-400 text-sm tracking-tighter">{editingItem.batchNumber}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                  <div className="group">
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Material Identifier</label>
                    <input required type="text" placeholder="e.g. White Oud Essence" className="w-full h-14 md:h-16 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-base outline-none focus:ring-2 focus:ring-gold-500 transition-all placeholder:opacity-30" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Material Classification</label>
                    <select className="w-full h-14 md:h-16 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-base outline-none focus:ring-2 focus:ring-gold-500 transition-all appearance-none" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                      {businessSettings.categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
                  <div className="relative">
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Initial Quantity</label>
                    <input required type="number" step="0.001" className="w-full h-14 md:h-16 px-5 pr-14 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-gold-500" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })} />
                    <span className="absolute right-5 bottom-[1.1rem] md:bottom-[1.3rem] text-[10px] font-black uppercase text-gold-600 opacity-50">{getUnitForCategory(newItem.category)}</span>
                  </div>
                  <div className="relative">
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Cost Per Unit</label>
                    <span className="absolute left-5 bottom-[1.1rem] md:bottom-[1.3rem] text-lg font-mono text-slate-400">₹</span>
                    <input required type="number" step="0.01" className="w-full h-14 md:h-16 pl-10 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-gold-500" value={newItem.costPerUnit} onChange={e => setNewItem({ ...newItem, costPerUnit: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Low Stock Alert</label>
                    <input required type="number" className="w-full h-14 md:h-16 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-gold-500" value={newItem.minThreshold} onChange={e => setNewItem({ ...newItem, minThreshold: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                  <div>
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Expiration Threshold</label>
                    <input type="date" className="w-full h-14 md:h-16 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-base outline-none focus:ring-2 focus:ring-gold-500" value={newItem.expiryDate || ''} onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Primary Supplier</label>
                    <select required className="w-full h-14 md:h-16 px-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-base outline-none appearance-none focus:ring-2 focus:ring-gold-500" value={newItem.vendorId} onChange={e => setNewItem({ ...newItem, vendorId: e.target.value })}>
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex gap-3 z-20">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] active:bg-slate-50 dark:active:bg-slate-800 rounded-xl">Discard</button>
                <button type="submit" className="flex-[2] py-4 bg-gold-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg active:scale-95 transition-all">{editingItem ? 'Update Log' : 'Save Material'}</button>
              </div>

              <div className="hidden sm:flex justify-end gap-4 pt-8 md:pt-12 mt-8 border-t border-slate-50 dark:border-slate-800">
                <button type="button" onClick={handleCloseModal} className="px-10 py-5 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Discard Changes</button>
                <button type="submit" className="px-14 py-6 bg-gold-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-gold-500/30 active:scale-95 transition-all">{editingItem ? 'Update Stock Entry' : 'Log New Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
