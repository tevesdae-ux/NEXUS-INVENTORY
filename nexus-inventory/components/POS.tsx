import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '../types';
import { dataService } from '../services/dataService';
import { 
  Search, ShoppingCart, Trash2, Printer, Plus, Minus, 
  AlertCircle, X, CreditCard, Settings, Check, Wallet, 
  Banknote, Lock, ChevronDown, Hash 
} from 'lucide-react';

interface POSProps {
  products: Product[];
  currentBranch: string;
  onConfirm: (items: any[], invoice: string, date: string, paymentMethod?: string, referenceNo?: string) => Promise<void>;
}

interface POSItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  maxQuantity: number;
}

export const POS: React.FC<POSProps> = ({ products, currentBranch, onConfirm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<POSItem[]>([]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [tempInvoiceNo, setTempInvoiceNo] = useState('');
  
  const [customerName, setCustomerName] = useState('CASH');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState('');
  
  const ADMIN_OVERRIDE_CODE = "041411121621";
  const [showOverride, setShowOverride] = useState(false);
  const [overrideCode, setOverrideCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printData, setPrintData] = useState<any>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nextNo = dataService.getNextInvoiceNo();
    setInvoiceNo(nextNo);
    setTempInvoiceNo(nextNo);
    searchInputRef.current?.focus();
  }, []);

  const total = useMemo(() => cart.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 0)), 0), [cart]);

  // Logic: DIGITAL/TERMINAL methods don't need "Amount Tendered" logic in the traditional sense.
  // We auto-fill it to prevent validation errors while letting the user focus on the Reference No.
  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setAmountTendered(total.toString());
    } else {
      setAmountTendered('');
      setReferenceNo(''); // Clear ref for cash
    }
  }, [paymentMethod, total]);

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
        setCart([]);
        setCustomerName('CASH');
        setPaymentMethod('CASH');
        setAmountTendered('');
        setReferenceNo('');
        const nextNo = dataService.incrementInvoiceNo(invoiceNo);
        setInvoiceNo(nextNo);
        setTempInvoiceNo(nextNo);
      }, 700); 
      return () => clearTimeout(timer);
    }
  }, [printData, invoiceNo]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return products.slice(0, 12);
    return products.filter(p => {
      if (!p) return false;
      return (p.name || '').toLowerCase().includes(term) || 
             (p.sku || '').toLowerCase().includes(term);
    }).slice(0, 20);
  }, [products, searchTerm]);

  const addToCart = (p: Product) => {
    if ((p.quantity || 0) <= 0) {
      setError(`Stock empty for ${p.name}`);
      return;
    }
    const existing = cart.find(i => i.productId === p.id);
    if (existing) {
      if (existing.quantity >= (p.quantity || 0)) {
        setError("Cannot exceed available stock.");
        return;
      }
      setCart(cart.map(i => i.productId === p.id ? { ...i, quantity: (i.quantity || 0) + 1 } : i));
    } else {
      const minPrice = (p.cost || 0) / 0.75;
      if ((p.price || 0) < minPrice && !isAuthorized) {
        setError(`Product price for ${p.name} is below 25% margin. Administrative override required.`);
        return;
      }
      setCart([...cart, {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price || 0,
        cost: p.cost || 0,
        quantity: 1,
        maxQuantity: p.quantity || 0
      }]);
    }
    setError('');
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(i => {
      if (i.productId === id) {
        const newQty = Math.max(1, Math.min(i.maxQuantity || 0, (i.quantity || 0) + delta));
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.productId !== id));
  };

  const change = useMemo(() => {
    const tendered = parseFloat(amountTendered);
    if (paymentMethod === 'CASH' && !isNaN(tendered)) {
      return Math.max(0, tendered - total);
    }
    return 0;
  }, [paymentMethod, amountTendered, total]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const tendered = parseFloat(amountTendered);
    if (paymentMethod === 'CASH' && (isNaN(tendered) || tendered < total)) {
        setError("Insufficient amount tendered.");
        return;
    }

    if (paymentMethod !== 'CASH' && !referenceNo.trim()) {
        setError("Please enter a Reference Number for POS/GCASH.");
        return;
    }

    setLoading(true);
    setError('');
    try {
      const itemsToSave = cart.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        soldPrice: i.price,
        cost: i.cost
      }));
      const saleDate = new Date().toISOString();
      // Expanded confirm callback to include payment metadata
      await onConfirm(itemsToSave, invoiceNo, saleDate, paymentMethod, referenceNo);
      
      setPrintData({
        invoice: invoiceNo,
        date: new Date().toLocaleDateString(),
        customer: customerName,
        payment: paymentMethod,
        refNo: referenceNo,
        items: [...cart],
        total: total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = () => {
    if (overrideCode === ADMIN_OVERRIDE_CODE) {
      setIsAuthorized(true);
      setShowOverride(false);
      setError('');
      setOverrideCode('');
    } else {
      setError("Invalid override code.");
    }
  };

  const saveInvoiceNo = () => {
    if (tempInvoiceNo.trim()) {
      dataService.setNextInvoiceNo(tempInvoiceNo.trim());
      setInvoiceNo(tempInvoiceNo.trim());
      setIsEditingInvoice(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 print:bg-white">
      <div className="flex-1 flex flex-col p-6 space-y-6 print:hidden">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-inner font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-6">
           {filteredProducts.map(p => (
             <button key={p.id} onClick={() => addToCart(p)} className="flex flex-col text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all active:scale-95 group relative">
                <span className="text-[10px] font-mono text-slate-400 mb-1 font-bold tracking-wider">{p.sku}</span>
                <span className="font-black text-slate-800 line-clamp-2 mb-3 group-hover:text-emerald-700 leading-tight uppercase text-xs">{p.name}</span>
                <div className="mt-auto flex justify-between items-end">
                   <span className="text-lg font-black text-slate-900 tracking-tighter">₱{(p.price || 0).toFixed(2)}</span>
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${(p.quantity || 0) < 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{p.quantity || 0} units</span>
                </div>
             </button>
           ))}
        </div>
      </div>

      <div className="w-[400px] bg-white border-l-4 border-blue-500 flex flex-col shadow-2xl print:hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 space-y-6">
           <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Checkout</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Next SI:</span>
                  {isEditingInvoice ? (
                    <div className="flex items-center gap-1">
                       <input type="text" className="border-2 border-emerald-500 rounded px-2 py-0.5 text-xs font-mono w-24 outline-none" value={tempInvoiceNo} onChange={e => setTempInvoiceNo(e.target.value)} autoFocus />
                       <button onClick={saveInvoiceNo} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 shadow-sm"><Check size={12}/></button>
                       <button onClick={() => setIsEditingInvoice(false)} className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"><X size={12}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingInvoice(true)}>
                      <span className="text-xs text-blue-600 font-mono font-black">{invoiceNo}</span>
                      <Settings size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-emerald-500">
                <CreditCard size={24} />
              </div>
           </div>

           <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sold To</label>
                <input type="text" placeholder="Customer Name" className="w-full border-2 border-slate-100 bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-slate-700 transition-all" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <select 
                    className="w-full border-2 border-slate-100 bg-white rounded-xl pl-11 pr-10 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none cursor-pointer font-black text-slate-700 transition-all" 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">CASH</option>
                    <option value="POS">POS (Terminal)</option>
                    <option value="GCASH">GCASH</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                </div>
              </div>

              {/* DYNAMIC FIELD: Cash vs Digital */}
              {paymentMethod === 'CASH' ? (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount Paid</label>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                className="w-full border-2 border-blue-100 bg-white rounded-xl pl-9 pr-3 py-3 text-base font-black text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                value={amountTendered} 
                                onChange={e => setAmountTendered(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Change</label>
                        <div className="w-full bg-slate-200/50 rounded-xl px-4 py-3 text-lg font-black text-slate-700 h-[52px] flex items-center shadow-inner">
                            ₱{(change || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                  </div>
              ) : (
                <div className="animate-fade-in-up space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reference # / Approval Code</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Enter Transaction ID" 
                        className="w-full border-2 border-emerald-100 bg-white rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-emerald-700 transition-all shadow-sm" 
                        value={referenceNo} 
                        onChange={e => setReferenceNo(e.target.value)} 
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-emerald-600">Total to Process</span>
                    <span className="text-sm font-black text-emerald-700">₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
           {cart.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                <ShoppingCart size={64} strokeWidth={1.5} />
                <p className="text-xs mt-4 font-black uppercase tracking-widest">Cart is empty</p>
             </div>
           )}
           {cart.map(item => (
             <div key={item.productId} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-black text-slate-800 truncate uppercase leading-tight">{item.name}</p>
                   <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden p-0.5 border border-slate-200">
                         <button onClick={() => updateQty(item.productId, -1)} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors"><Minus size={14} /></button>
                         <span className="w-10 text-center text-sm font-black text-slate-800">{item.quantity || 0}</span>
                         <button onClick={() => updateQty(item.productId, 1)} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors"><Plus size={14} /></button>
                      </div>
                      <span className="text-base font-black text-slate-900 tracking-tighter">₱{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                   </div>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="text-slate-200 hover:text-red-500 transition-colors self-start mt-1"><Trash2 size={20} /></button>
             </div>
           ))}
        </div>

        <div className="p-6 bg-white border-t border-slate-200 space-y-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center justify-between gap-2 text-xs font-bold border border-red-100">
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="uppercase tracking-tight leading-tight">{error}</span>
                </div>
                {!isAuthorized && error.includes('override') && (
                    <button onClick={() => setShowOverride(true)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-red-200 transition-all active:scale-95">Override</button>
                )}
             </div>
           )}

           <div className="flex justify-between items-center">
              <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Grand Total</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">₱{(total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </div>

           <button 
                onClick={handleCheckout} 
                disabled={loading || cart.length === 0} 
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
           >
                {loading ? 'Processing...' : <><Printer size={24} /> Print Physical SI</>}
           </button>
        </div>
      </div>

      {/* PHYSICAL SALES INVOICE (Hidden from web view) */}
      <div id="physical-receipt-template" style={{ display: 'none' }}>
          {printData && (
            <div style={{ position: 'relative', width: '20cm', height: '15cm', background: 'white' }}>
               <div style={{ position: 'absolute', top: '0.6cm', left: '0.8cm', width: '13.6cm', textAlign: 'left', fontWeight: 'bold', fontSize: '13pt', lineHeight: '1.2' }}>
                  MEJ HOME DEPOT HARDWARE AND CONSTRUCTION SUPPLIES
               </div>
               <div style={{ position: 'absolute', top: '2.2cm', left: '0.8cm', width: '10.5cm', textAlign: 'left', fontSize: '10pt', lineHeight: '1.4' }}>
                  <div>DEO C. TEVES – Prop.</div>
                  <div>NON-VAT Reg. TIN: 253-320-147-00000</div>
                  <div>LURAY II, 6038 TOLEDO CITY, CEBU</div>
               </div>
               <div style={{ position: 'absolute', top: '0.6cm', left: '14.9cm', width: '4.0cm', textAlign: 'right', fontWeight: 'bold', fontSize: '14pt' }}>
                  SALES INVOICE
               </div>
               <div style={{ position: 'absolute', top: '2.2cm', left: '14.2cm', width: '5cm', fontSize: '10pt' }}>
                  <strong>INVOICE NO:</strong> {printData.invoice}
               </div>
               <div style={{ position: 'absolute', top: '2.8cm', left: '14.2cm', width: '5cm', fontSize: '10pt' }}>
                  <strong>DATE:</strong> {printData.date}
               </div>
               <div style={{ position: 'absolute', top: '3.6cm', left: '0.8cm', width: '18cm', display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
                  <div><strong>SOLD TO:</strong> {printData.customer}</div>
                  <div style={{ marginRight: '0.7cm' }}><strong>PAYMENT:</strong> {printData.payment} {printData.refNo && `(${printData.refNo})`}</div>
               </div>
               <div style={{ position: 'absolute', top: '4.2cm', left: '0.7cm', width: '18.6cm', height: '7.3cm', border: '1px solid black' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                     <thead>
                        <tr style={{ height: '0.7cm', fontSize: '9pt', fontWeight: 'bold' }}>
                           <th style={{ width: '9.8cm', borderRight: '1px solid black', borderBottom: '1px solid black', padding: '0 0.1cm', textAlign: 'left' }}>ITEM DESCRIPTION</th>
                           <th style={{ width: '2.6cm', borderRight: '1px solid black', borderBottom: '1px solid black', textAlign: 'center' }}>QUANTITY</th>
                           <th style={{ width: '3.0cm', borderRight: '1px solid black', borderBottom: '1px solid black', textAlign: 'center' }}>UNIT PRICE</th>
                           <th style={{ width: '3.2cm', borderBottom: '1px solid black', textAlign: 'center' }}>AMOUNT</th>
                        </tr>
                     </thead>
                     <tbody style={{ fontSize: '10pt' }}>
                        {printData.items.map((item: any, idx: number) => (
                           <tr key={idx} style={{ height: '0.6cm' }}>
                              <td style={{ borderRight: '1px solid black', padding: '0 0.1cm', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.name}</td>
                              <td style={{ borderRight: '1px solid black', textAlign: 'center' }}>{item.quantity || 0}</td>
                              <td style={{ borderRight: '1px solid black', textAlign: 'right', paddingRight: '0.2cm' }}>{(item.price || 0).toFixed(2)}</td>
                              <td style={{ textAlign: 'right', paddingRight: '0.2cm' }}>{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                           </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 10 - printData.items.length) }).map((_, i) => (
                           <tr key={`empty-${i}`} style={{ height: '0.6cm' }}>
                              <td style={{ borderRight: '1px solid black' }}></td>
                              <td style={{ borderRight: '1px solid black' }}></td>
                              <td style={{ borderRight: '1px solid black' }}></td>
                              <td></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div style={{ position: 'absolute', top: '11.8cm', left: '12.2cm', fontSize: '10pt', fontWeight: 'bold' }}>TOTAL AMOUNT DUE</div>
               <div style={{ position: 'absolute', top: '11.6cm', left: '16.1cm', width: '3.2cm', height: '0.9cm', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.2cm', fontSize: '12pt', fontWeight: 'bold' }}>
                  ₱{printData.total}
               </div>
               <div style={{ position: 'absolute', top: '13.5cm', left: '0.8cm', fontSize: '9pt' }}>Checked By: ____________________________________</div>
               <div style={{ position: 'absolute', top: '13.5cm', left: '10.2cm', fontSize: '9pt' }}>Cashier/Authorized Person: ____________________________________</div>
            </div>
          )}
      </div>
    </div>
  );
};