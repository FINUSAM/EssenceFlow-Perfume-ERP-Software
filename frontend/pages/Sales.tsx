
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Sale, Product, Customer } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';

const Sales: React.FC = () => {
  const { businessSettings } = useApp();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewSale, setShowNewSale] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<Sale | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmVoidId, setConfirmVoidId] = useState<string | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleItems, setSaleItems] = useState<{productId: string, quantity: number}[]>([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [s, p, c] = await Promise.all([api.getSales(), api.getProducts(), api.getCustomers()]);
    setSales(s.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setProducts(p);
    setCustomers(c);
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((sum, item) => {
      const prod = products.find(p => p.id === item.productId);
      return sum + (prod ? prod.sellingPrice * item.quantity : 0);
    }, 0);
  };

  const handleCreateSale = async () => {
    try {
      const subtotal = calculateSubtotal();
      const finalSale = {
        customerId: selectedCustomerId,
        items: saleItems.map(si => ({
          productId: si.productId,
          quantity: si.quantity,
          unitPrice: products.find(p => p.id === si.productId)?.sellingPrice || 0,
          total: (products.find(p => p.id === si.productId)?.sellingPrice || 0) * si.quantity
        })),
        subtotal,
        discount,
        total: subtotal - discount,
        date: new Date().toISOString()
      };
      await api.createSale(finalSale as any);
      setErrorMessage('');
      fetchData();
      setShowNewSale(false);
      setSaleItems([]);
      setSelectedCustomerId('');
      setDiscount(0);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const executeVoid = async () => {
    if (!confirmVoidId) return;
    setIsVoiding(true);
    try {
      await api.voidSale(confirmVoidId);
      await fetchData();
      setConfirmVoidId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoiding(false);
    }
  };

  const handleShareReceipt = async (sale: Sale) => {
    const customer = customers.find(c => c.id === sale.customerId)?.name || 'Guest';
    const itemsText = sale.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return `• ${prod?.name || 'Item'} (x${item.quantity}): ₹${item.total.toLocaleString('en-IN')}`;
    }).join('\n');

    const shareContent = `🧾 *SALES INVOICE: ${businessSettings.name.toUpperCase()}*\n\n` +
      `*Invoice #:* ${sale.receiptNumber}\n` +
      `*Date:* ${new Date(sale.date).toLocaleDateString()}\n` +
      `*Client:* ${customer}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Amount: ₹${sale.total.toLocaleString('en-IN')}*\n\n` +
      `_Thank you for choosing ${businessSettings.name} Atelier._`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${sale.receiptNumber} - ${businessSettings.name}`,
          text: shareContent,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareContent)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-gold-100/50 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white">Sales Ledger</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Real-time revenue tracking and invoice management.</p>
        </div>
        <button onClick={() => setShowNewSale(true)} className="w-full md:w-auto bg-gold-600 hover:bg-gold-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          New Sale
        </button>
      </div>

      <div className="hidden lg:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl overflow-hidden border border-white dark:border-slate-800">
        <table className="w-full text-left">
          <thead className="bg-gold-50/50 dark:bg-slate-800/50">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">Date</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">Invoice #</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400 text-right">Revenue (₹)</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400 text-center">Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400 text-right pr-10">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
            {sales.map(sale => (
              <tr key={sale.id} className={`${sale.status === 'VOIDED' ? 'opacity-40' : 'hover:bg-gold-50/30 dark:hover:bg-slate-800/30'} transition-all`}>
                <td className="p-6 text-sm font-mono text-slate-500">{new Date(sale.date).toLocaleDateString()}</td>
                <td className="p-6 text-sm font-bold text-slate-900 dark:text-white">{sale.receiptNumber}</td>
                <td className="p-6 text-right text-lg font-mono font-bold text-gold-600">₹{sale.total.toLocaleString('en-IN')}</td>
                <td className="p-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{sale.status}</span>
                </td>
                <td className="p-6 text-right pr-10">
                  <div className="flex gap-4 justify-end">
                    <button onClick={() => setReceiptToPrint(sale)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-gold-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
                    {sale.status === 'COMPLETED' && (
                      <button onClick={() => setConfirmVoidId(sale.id)} className="p-3 bg-rose-50 dark:bg-rose-900/10 text-rose-400 rounded-xl hover:text-rose-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
        {sales.map(sale => (
          <div key={sale.id} className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-sm border border-white dark:border-slate-800 transition-all ${sale.status === 'VOIDED' ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {sale.status}
              </span>
              <button onClick={() => setReceiptToPrint(sale)} className="p-3 bg-gold-50 dark:bg-gold-950/20 text-gold-600 rounded-2xl shadow-sm border border-gold-100/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              </button>
            </div>

            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-1 leading-tight">{sale.receiptNumber}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{new Date(sale.date).toLocaleDateString()}</p>

            <div className="flex justify-between items-center py-4 border-y border-slate-50 dark:border-slate-800/50 my-5">
               <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{customers.find(c => c.id === sale.customerId)?.name || 'Guest'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                <p className="font-mono font-bold text-xl text-gold-600">₹{sale.total.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {sale.status === 'COMPLETED' && (
              <button onClick={() => setConfirmVoidId(sale.id)} className="w-full py-3 border-2 border-dashed border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-center justify-center gap-2 group transition-all active:bg-rose-50 dark:active:bg-rose-950/20">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-400">Void Bill</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {confirmVoidId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[250]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-scaleUp text-center border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-gold-50 dark:bg-gold-900/20 text-gold-600 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-serif font-bold mb-2 dark:text-white">Void Transaction?</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Voiding this invoice will automatically return all finished goods to laboratory stock and deduct the revenue from the ledger.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmVoidId(null)} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Cancel</button>
              <button 
                onClick={executeVoid} 
                disabled={isVoiding}
                className="flex-1 py-4 bg-gold-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex items-center justify-center transition-all"
              >
                {isVoiding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptToPrint && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[300] flex flex-col items-center justify-start p-4 md:p-10 animate-fadeIn overflow-y-auto pt-4 md:pt-16 pb-24">
          <div className="bg-white p-6 md:p-14 max-w-2xl w-full rounded-[2rem] md:rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col text-slate-900 relative">
             <div className="flex flex-col md:flex-row justify-between items-center md:items-start border-b-2 border-slate-900 pb-8 md:pb-10 mb-8 md:mb-10 text-center md:text-left gap-6 md:gap-0">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {businessSettings.logoUrl ? (
                    <img src={businessSettings.logoUrl} alt="Logo" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-gold-600 rounded-xl flex items-center justify-center text-white font-serif italic text-2xl font-bold">
                      {businessSettings.name[0]}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-tight">{businessSettings.name}</h1>
                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-gold-600 mt-1">{businessSettings.caption || 'Fine Fragrance Atelier'}</p>
                  </div>
                </div>
                <div className="flex flex-col md:items-end">
                   <h2 className="text-xl md:text-3xl font-serif font-bold text-slate-900 uppercase tracking-widest mb-1">Invoice</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{receiptToPrint.receiptNumber}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-10">
                <div className="text-center md:text-left">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
                   <p className="text-base md:text-lg font-serif font-bold text-slate-900">{customers.find(c => c.id === receiptToPrint.customerId)?.name || 'Walk-in Client'}</p>
                   <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">{customers.find(c => c.id === receiptToPrint.customerId)?.email || 'guest@example.com'}</p>
                </div>
                <div className="text-center md:text-right">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Billing Date</p>
                   <p className="text-base md:text-lg font-serif font-bold text-slate-900">{new Date(receiptToPrint.date).toLocaleDateString()}</p>
                   <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">Issued: {new Date(receiptToPrint.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
             </div>

             <div className="flex-1 overflow-x-hidden">
                <table className="w-full text-left mb-8 md:mb-10">
                   <thead className="border-b border-slate-100 hidden md:table-header-group">
                      <tr>
                         <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Description</th>
                         <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</th>
                         <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Unit Price</th>
                         <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {receiptToPrint.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <tr key={idx} className="flex flex-col md:table-row py-4 md:py-0">
                             <td className="md:py-5 flex-1">
                                <p className="font-serif font-bold text-slate-900 text-sm md:text-base">{product?.name || 'Unknown SKU'}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SKU: {product?.sku}</p>
                             </td>
                             <td className="md:py-5 flex justify-between md:table-cell md:text-center mt-2 md:mt-0">
                                <span className="md:hidden text-[9px] font-black uppercase tracking-widest text-slate-400">Quantity:</span>
                                <span className="font-mono font-bold text-slate-700 text-sm">{item.quantity}</span>
                             </td>
                             <td className="md:py-5 flex justify-between md:table-cell md:text-right">
                                <span className="md:hidden text-[9px] font-black uppercase tracking-widest text-slate-400">Rate:</span>
                                <span className="font-mono text-sm">₹{item.unitPrice.toLocaleString('en-IN')}</span>
                             </td>
                             <td className="md:py-5 flex justify-between md:table-cell md:text-right">
                                <span className="md:hidden text-[9px] font-black uppercase tracking-widest text-slate-400">Amount:</span>
                                <span className="font-mono font-bold text-slate-900 text-sm">₹{item.total.toLocaleString('en-IN')}</span>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>

                <div className="flex justify-center md:justify-end pt-8 border-t-2 border-slate-900">
                   <div className="w-full md:w-64 space-y-3">
                      <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                         <span>Subtotal</span>
                         <span className="font-mono text-slate-900">₹{receiptToPrint.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      {receiptToPrint.discount > 0 && (
                        <div className="flex justify-between items-center text-sm font-medium text-rose-500">
                           <span>Courtesy Discount</span>
                           <span className="font-mono">-₹{receiptToPrint.discount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                         <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900">Grand Total</span>
                         <span className="text-2xl md:text-3xl font-serif font-bold text-gold-600">₹{receiptToPrint.total.toLocaleString('en-IN')}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                <p className="text-[10px] text-slate-400 italic font-medium uppercase tracking-[0.2em] leading-relaxed px-4">Thank you for supporting artisanal perfumery.</p>
             </div>

             <div className="mt-10 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 no-print relative z-10">
                <button 
                  onClick={() => handleShareReceipt(receiptToPrint)} 
                  className="col-span-2 md:col-span-2 py-4 md:py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gold-600"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                   Share
                </button>
                <button onClick={() => window.print()} className="py-4 md:py-5 border-2 border-slate-100 hover:border-gold-300 rounded-2xl font-black uppercase tracking-widest text-[9px] text-slate-700 flex items-center justify-center gap-2 transition-all bg-white">
                   Print
                </button>
                <button onClick={() => setReceiptToPrint(null)} className="py-4 md:py-5 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-rose-500 transition-colors bg-white rounded-2xl border-2 border-transparent">
                   Close
                </button>
             </div>
          </div>
        </div>
      )}

      {showNewSale && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3.5rem] sm:rounded-[3rem] p-8 md:p-14 max-w-2xl w-full shadow-2xl animate-scaleUp text-slate-900 dark:text-white overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            <div className="shrink-0">
               <h2 className="text-3xl font-serif font-bold mb-1">New Sale</h2>
               <p className="text-slate-400 text-[10px] mb-8 tracking-widest uppercase font-black">Counter Checkout Protocol</p>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
              <div className="space-y-8">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Customer Profile</label>
                  <select className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none appearance-none" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                    <option value="">Guest/Walk-in</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4"><label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Cart Contents</label></div>
                  <div className="space-y-4">
                    {saleItems.map((si, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm relative">
                        <select className="flex-1 p-2 bg-transparent text-slate-900 dark:text-white text-sm font-bold outline-none" value={si.productId} onChange={e => { const items = [...saleItems]; items[idx].productId = e.target.value; setSaleItems(items); }}>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>{p.name} (Stock: {p.currentStock})</option>)}
                        </select>
                        <input type="number" className="w-20 p-3 bg-white dark:bg-slate-800 rounded-xl text-center font-mono font-bold text-base" value={si.quantity} onChange={e => { const items = [...saleItems]; items[idx].quantity = parseInt(e.target.value); setSaleItems(items); }} />
                        <button onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))} className="text-rose-300 hover:text-rose-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    ))}
                    <button onClick={() => setSaleItems([...saleItems, {productId: '', quantity: 1}])} className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Add Line Item</button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    Alert: {errorMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 pt-6 mt-auto border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
              <div className="flex flex-col gap-4">
                <button onClick={handleCreateSale} className="w-full py-5 bg-gold-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">Execute checkout</button>
                <button onClick={() => { setShowNewSale(false); setErrorMessage(''); }} className="w-full py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
