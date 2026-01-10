
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { InventoryItem, Vendor, PurchaseOrder, PurchaseItem } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';

const Purchasing: React.FC = () => {
  const { businessSettings } = useApp();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [v, i, p] = await Promise.all([
      api.getVendors(),
      api.getInventory(),
      api.getPurchases()
    ]);
    setVendors(v);
    setInventory(i);
    setPurchases(p.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  };

  const handleCreatePurchase = async () => {
    if (!selectedVendorId || orderItems.length === 0) {
      setErrorMessage('Please select a vendor and add at least one item.');
      return;
    }
    try {
      const totalAmount = calculateTotal();

      if (editingOrder) {
        await api.updatePurchase(editingOrder._id, {
          vendorId: selectedVendorId,
          items: orderItems,
          totalAmount,
          // Keep original date and ref number unless we expose them for edit
          date: editingOrder.date,
          referenceNumber: editingOrder.referenceNumber
        });
      } else {
        await api.createPurchase({
          vendorId: selectedVendorId,
          items: orderItems,
          totalAmount,
          date: new Date().toISOString(),
          referenceNumber: `PO-${Date.now().toString().slice(-8)}`
        });
      }

      setErrorMessage('');
      setShowNewOrder(false);
      setOrderItems([]);
      setSelectedVendorId('');
      setEditingOrder(null);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleEditClick = (order: PurchaseOrder) => {
    setEditingOrder(order);
    // Handle potential populated string vs object for vendorId
    setSelectedVendorId(typeof order.vendorId === 'object' ? (order.vendorId as any)._id : order.vendorId);

    // Handle populated items
    setOrderItems(order.items.map(i => ({
      ...i,
      inventoryItemId: typeof i.inventoryItemId === 'object' ? (i.inventoryItemId as any)._id : i.inventoryItemId
    })));
    setShowNewOrder(true);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deletePurchase(confirmDeleteId);
      await fetchData();
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { inventoryItemId: '', quantity: 1, costPerUnit: 0 }]);
  };

  const updateItemRow = (index: number, updates: Partial<PurchaseItem>) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], ...updates };
    if (updates.inventoryItemId) {
      const invItem = inventory.find(i => i._id === updates.inventoryItemId);
      if (invItem) newItems[index].costPerUnit = invItem.costPerUnit;
    }
    setOrderItems(newItems);
  };

  const getUnitForCategory = (categoryName: string) => {
    const cat = businessSettings.categories.find(c => c.name === categoryName);
    return cat ? cat.unit : 'pcs';
  };

  if (loading) return <div className="text-center py-12 text-gold-500 font-serif italic animate-pulse">Refreshing procurement data...</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-gold-100/50 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white">Procurement Ledger</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Maintain laboratory stock levels through selective supplier purchases.</p>
        </div>
        <button onClick={() => setShowNewOrder(true)} className="w-full md:w-auto bg-gold-600 hover:bg-gold-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-gold-500/20 flex items-center justify-center gap-3 transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          Restock Materials
        </button>
      </div>

      <div className="hidden lg:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl overflow-hidden border border-white dark:border-slate-800">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/30">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Date</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Ref #</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Supplier</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-right">Investment (₹)</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-right pr-10">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
            {purchases.map(order => (
              <tr key={order._id} className="hover:bg-gold-50/20 dark:hover:bg-slate-800/30 transition-all">
                <td className="p-6 text-sm font-mono text-slate-500">{new Date(order.date).toLocaleDateString()}</td>
                <td className="p-6 text-sm font-bold text-gold-700 dark:text-gold-500">{order.referenceNumber}</td>
                <td className="p-6 text-sm font-medium text-slate-700 dark:text-slate-200">{vendors.find(v => v._id === order.vendorId)?.name || 'Unknown Entity'}</td>
                <td className="p-6 text-right text-lg font-mono font-bold text-slate-900 dark:text-white">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                <td className="p-6 text-right pr-10">
                  <button onClick={() => handleEditClick(order)} className="p-3 text-slate-400 hover:text-gold-600 transition-colors mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => { setConfirmDeleteId(order._id); setDeleteError(null); }} className="p-3 text-rose-400 hover:text-rose-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
        {purchases.map(order => (
          <div key={order._id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-sm border border-white dark:border-slate-800 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-slate-50 text-slate-600 border-slate-100">
                Purchase Order
              </span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(order.date).toLocaleDateString()}</p>
            </div>

            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-1 leading-tight">{order.referenceNumber}</h3>
            <p className="text-[10px] font-bold text-gold-600 truncate">{vendors.find(v => v._id === order.vendorId)?.name || 'Unknown Entity'}</p>

            <div className="flex justify-between items-center py-4 border-y border-slate-50 dark:border-slate-800/50 my-5">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Items</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{order.items.length} materials</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost Impact</p>
                <p className="font-mono font-bold text-xl text-gold-600">₹{order.totalAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditClick(order)}
                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 group transition-all active:bg-slate-50 dark:active:bg-slate-900"
              >
                <svg className="w-4 h-4 text-slate-400 group-hover:text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-gold-600">Modify</span>
              </button>

              <button
                onClick={() => { setConfirmDeleteId(order._id); setDeleteError(null); }}
                className="w-full py-4 border-2 border-dashed border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-center justify-center gap-2 group transition-all active:bg-rose-50 dark:active:bg-rose-950/20"
              >
                <svg className="w-4 h-4 text-rose-300 group-hover:text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 group-hover:text-rose-600">Void Order</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[120]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-scaleUp text-center border border-slate-100 dark:border-slate-800">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${deleteError ? 'bg-rose-500 text-white' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold mb-2 dark:text-white">{deleteError ? 'Reversal Error' : 'Purge Order?'}</h2>
            {deleteError ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-left mb-6">
                <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">Integrity Violation</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{deleteError}</p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Purging this order will deduct these materials from stock. Only possible if current balance covers the reversal.</p>
            )}
            <div className="flex gap-4">
              <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">{deleteError ? 'Dismiss' : 'Cancel'}</button>
              {!deleteError && (
                <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex items-center justify-center">
                  {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Void Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] p-8 md:p-14 max-w-4xl w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white pb-12 overflow-y-auto max-h-[95vh] sm:max-h-[90vh] no-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold">{editingOrder ? 'Modify Order' : 'Restock Order'}</h2>
                <p className="text-slate-400 text-[10px] tracking-widest uppercase font-black mt-1">Laboratory Supply Registry</p>
              </div>
              <div className="text-left md:text-right bg-gold-50 dark:bg-gold-950/20 p-4 rounded-3xl border border-gold-100/50 w-full md:w-auto">
                <p className="text-[9px] font-black text-gold-600 uppercase tracking-widest">Est. Order Value</p>
                <p className="text-3xl font-mono font-bold text-gold-600">₹{calculateTotal().toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">1. Select Preferred Supplier</label>
                <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none appearance-none" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}>
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-6">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">2. Manifest of Materials</label>
                  <button onClick={addItemRow} className="text-gold-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gold-50 p-2 rounded-xl transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    Add Material
                  </button>
                </div>
                <div className="space-y-4">
                  {orderItems.map((item, idx) => {
                    const selectedInvItem = inventory.find(i => i._id === item.inventoryItemId);
                    return (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm relative">
                        <button onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          <div className="md:col-span-6">
                            <label className="block text-[8px] uppercase font-black tracking-widest text-slate-400 mb-2">Material Specification</label>
                            <select className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold" value={item.inventoryItemId} onChange={e => updateItemRow(idx, { inventoryItemId: e.target.value })}>
                              <option value="">Select Material</option>
                              {inventory.filter(i => !selectedVendorId || i.vendorId === selectedVendorId).map(i => <option key={i._id} value={i._id}>{i.name} ({i.category})</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[8px] uppercase font-black tracking-widest text-slate-400 mb-2">Qty ({selectedInvItem ? getUnitForCategory(selectedInvItem.category) : '...'})</label>
                            <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm text-slate-900 dark:text-white" value={item.quantity} onChange={e => updateItemRow(idx, { quantity: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[8px] uppercase font-black tracking-widest text-slate-400 mb-2">Purchase Price (₹)</label>
                            <input type="number" step="0.01" className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm text-gold-600" value={item.costPerUnit} onChange={e => updateItemRow(idx, { costPerUnit: parseFloat(e.target.value) || 0 })} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10 border-t border-slate-50 dark:border-slate-800">
                <button onClick={() => { setShowNewOrder(false); setErrorMessage(''); setOrderItems([]); setEditingOrder(null); }} className="px-10 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard Order</button>
                <button onClick={handleCreatePurchase} className="w-full sm:w-auto px-12 py-5 bg-gold-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">{editingOrder ? 'Update Manifest' : 'Verify & Import Inventory'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchasing;
