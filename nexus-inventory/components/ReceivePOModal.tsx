import React, { useState } from 'react';
import { PurchaseOrder } from '../types';
import { Truck, X, AlertTriangle, CheckCircle, PackageCheck, AlertOctagon, Printer } from 'lucide-react';

interface ReceivePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  onConfirm: (poId: string, invoiceRef: string, items: {productId: string, quantity: number}[], damagedItems: {productId: string, quantity: number, reason?: string}[]) => Promise<void>;
}

export const ReceivePOModal: React.FC<ReceivePOModalProps> = ({ isOpen, onClose, po, onConfirm }) => {
  const [invoiceRef, setInvoiceRef] = useState('');
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [damageQtys, setDamageQtys] = useState<Record<string, number>>({});
  const [damageReasons, setDamageReasons] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  if (!isOpen || !po) return null;

  const handleQtyChange = (productId: string, val: number, type: 'good' | 'damaged') => {
      if (type === 'good') {
        setReceiveQtys(prev => ({...prev, [productId]: val}));
      } else {
        setDamageQtys(prev => ({...prev, [productId]: val}));
      }
  };
  
  const handleReasonChange = (productId: string, val: string) => {
      setDamageReasons(prev => ({...prev, [productId]: val}));
  }

  const handleReceiveAll = () => {
      const all: Record<string, number> = {};
      po.items.forEach(item => {
          const remainingTotal = item.quantityOrdered - ((item.quantityReceived || 0) + (item.quantityDamaged || 0));
          const currentDamaged = damageQtys[item.productId] || 0;
          const goodToReceive = Math.max(0, remainingTotal - currentDamaged);
          
          if (goodToReceive > 0) {
            all[item.productId] = goodToReceive;
          }
      });
      setReceiveQtys(all);
  };

  const generateReportPDF = () => {
    return new Promise<void>((resolve) => {
        setGeneratingPdf(true);
        setTimeout(() => {
            const element = document.getElementById('receiving-report-template');
            if (element) {
                const opt = {
                    margin: 0.4,
                    filename: `ReceivingReport_${invoiceRef}_${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
                };

                const clone = element.cloneNode(true) as HTMLElement;
                clone.classList.remove('hidden');
                clone.style.display = 'block';
                
                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.top = '-10000px';
                container.style.left = '-10000px';
                container.style.width = '800px'; 
                container.appendChild(clone);
                document.body.appendChild(container);

                (window as any).html2pdf().set(opt).from(clone).save().then(() => {
                    document.body.removeChild(container);
                    setGeneratingPdf(false);
                    resolve();
                }).catch((err: any) => {
                    console.error(err);
                    setGeneratingPdf(false);
                    document.body.removeChild(container);
                    resolve();
                });
            } else {
                setGeneratingPdf(false);
                resolve();
            }
        }, 500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!invoiceRef) return;
      
      const itemsToReceive = Object.entries(receiveQtys)
        .map(([productId, quantity]) => ({ productId, quantity: quantity as number }))
        .filter(i => i.quantity > 0);

      const itemsDamaged = Object.entries(damageQtys)
        .map(([productId, quantity]) => ({ 
            productId, 
            quantity: quantity as number,
            reason: damageReasons[productId] || 'Damaged upon receipt'
        }))
        .filter(i => i.quantity > 0);

      if (itemsToReceive.length === 0 && itemsDamaged.length === 0) return;

      setLoading(true);
      try {
          // Generate PDF before closing logic
          await generateReportPDF();

          await onConfirm(po.id, invoiceRef, itemsToReceive, itemsDamaged);
          
          onClose();
          // Reset State
          setInvoiceRef('');
          setReceiveQtys({});
          setDamageQtys({});
          setDamageReasons({});
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  // Prepare data for preview in PDF
  const previewGoodItems = Object.entries(receiveQtys).map(([pid, qty]) => {
      const p = po.items.find(i => i.productId === pid);
      return { ...p, currentRecv: qty };
  }).filter(i => i.currentRecv > 0);

  const previewDamagedItems = Object.entries(damageQtys).map(([pid, qty]) => {
      const p = po.items.find(i => i.productId === pid);
      return { ...p, currentRecv: qty, reason: damageReasons[pid] };
  }).filter(i => i.currentRecv > 0);


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
       
       {/* PDF Template (Hidden) */}
       <div id="receiving-report-template" className="hidden bg-white text-slate-900 p-8 font-sans">
           <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">Receiving Report</h1>
                    <p className="text-sm text-slate-500 mt-1">Nexus Inventory Management</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-700">Ref: {invoiceRef}</h2>
                    <p className="text-sm text-slate-600">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600">PO #: {po.poNumber}</p>
                </div>
            </div>

            <div className="mb-6">
                 <p className="text-sm"><strong>Supplier:</strong> {po.supplier}</p>
                 <p className="text-sm"><strong>Received At:</strong> {po.branch}</p>
            </div>

            {previewGoodItems.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase text-slate-700 border-b border-slate-300 mb-2 pb-1">Accepted Stock (Good)</h3>
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="p-2">SKU</th>
                                <th className="p-2">Product</th>
                                <th className="p-2 text-center">Qty Accepted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewGoodItems.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="p-2 font-mono">{item.sku}</td>
                                    <td className="p-2">{item.productName}</td>
                                    <td className="p-2 text-center font-bold">{item.currentRecv}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {previewDamagedItems.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase text-red-700 border-b border-red-200 mb-2 pb-1">Damaged / Rejected Items</h3>
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="bg-red-50 text-red-900">
                                <th className="p-2">SKU</th>
                                <th className="p-2">Product</th>
                                <th className="p-2 text-center">Qty Rejected</th>
                                <th className="p-2">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewDamagedItems.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="p-2 font-mono">{item.sku}</td>
                                    <td className="p-2">{item.productName}</td>
                                    <td className="p-2 text-center font-bold text-red-600">{item.currentRecv}</td>
                                    <td className="p-2 italic">{item.reason || 'Damaged'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-12 pt-4 border-t border-slate-300 flex justify-between gap-10">
                <div className="flex-1">
                    <p className="text-xs uppercase text-slate-500 mb-8">Received By (Signature)</p>
                    <div className="border-b border-slate-400"></div>
                </div>
                <div className="flex-1">
                    <p className="text-xs uppercase text-slate-500 mb-8">Verified By</p>
                    <div className="border-b border-slate-400"></div>
                </div>
            </div>
       </div>

       <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
         <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="text-emerald-600" /> Receive Purchase Order
                </h3>
                <p className="text-sm text-slate-500 mt-1">PO #: <strong>{po.poNumber}</strong> • Supplier: {po.supplier}</p>
            </div>
            <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-6">
             
             {/* Invoice Reference Input */}
             <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Invoice Reference # <span className="text-red-500">*</span></label>
                 <input 
                    required
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="INV-XXXXX"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                 />
             </div>

             {/* Single Tab View */}
             <div className="min-h-[200px]">
                 <div className="flex justify-between items-center mb-3">
                     <div className="flex gap-4">
                        <div className="border-b-2 border-emerald-500 text-emerald-700 pb-2 px-2 font-bold text-sm flex items-center gap-2">
                            <PackageCheck size={18} /> Receive Good Stock
                        </div>
                        <div className="text-slate-400 pb-2 px-2 font-medium text-sm flex items-center gap-2 cursor-default">
                            <AlertOctagon size={18} /> Record Damaged Items
                        </div>
                     </div>
                 </div>

                 <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center text-sm text-emerald-800 mb-4">
                     <div className="flex gap-2 items-center">
                        <AlertTriangle className="text-emerald-600 shrink-0" size={16} />
                        <p>Items recorded here will be added to your active inventory.</p>
                     </div>
                     <button onClick={handleReceiveAll} className="text-xs text-blue-600 hover:underline font-bold">Auto-Fill Remaining</button>
                 </div>

                 <table className="w-full text-left text-sm border-collapse">
                     <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                         <tr>
                             <th className="px-3 py-3">Product</th>
                             <th className="px-3 py-3 text-center">Ordered</th>
                             <th className="px-3 py-3 text-center">Prev. Recv</th>
                             <th className="px-3 py-3 text-center w-24 text-red-600">Damaged</th>
                             <th className="px-3 py-3 text-center">Remaining</th>
                             <th className="px-3 py-3 w-32">Qty Good</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {po.items.map(item => {
                             const totalRemaining = item.quantityOrdered - ((item.quantityReceived || 0) + (item.quantityDamaged || 0));
                             const isComplete = totalRemaining <= 0;
                             
                             const currentDamaged = damageQtys[item.productId] || 0;
                             const displayRemaining = Math.max(0, totalRemaining - currentDamaged);

                             return (
                                 <tr key={item.productId} className={isComplete ? "bg-slate-50 opacity-60" : "hover:bg-slate-50 transition-colors"}>
                                     <td className="px-3 py-3">
                                         <div className="font-medium text-slate-800">{item.productName}</div>
                                         <div className="text-xs text-slate-500">{item.sku}</div>
                                         {/* Reason input visible if damage recorded */}
                                         {currentDamaged > 0 && (
                                             <input 
                                                 type="text" 
                                                 placeholder="Damage Reason?"
                                                 className="mt-1 w-full text-xs border border-red-200 rounded px-1 py-0.5 outline-none focus:border-red-400 bg-red-50 text-red-700 placeholder:text-red-300"
                                                 value={damageReasons[item.productId] || ''}
                                                 onChange={(e) => handleReasonChange(item.productId, e.target.value)}
                                             />
                                         )}
                                     </td>
                                     <td className="px-3 py-3 text-center text-slate-500">{item.quantityOrdered}</td>
                                     <td className="px-3 py-3 text-center text-slate-500">{item.quantityReceived || 0}</td>
                                     <td className="px-3 py-3 text-center">
                                         <input 
                                            type="number"
                                            min="0"
                                            disabled={isComplete}
                                            className="w-full border border-red-200 rounded px-2 py-1 text-center focus:ring-2 focus:ring-red-500 outline-none disabled:bg-slate-100 text-red-600 font-medium"
                                            value={damageQtys[item.productId] || ''}
                                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0, 'damaged')}
                                            placeholder="0"
                                         />
                                     </td>
                                     <td className="px-3 py-3 text-center font-bold text-slate-700">
                                         {displayRemaining}
                                     </td>
                                     <td className="px-3 py-3">
                                         <input 
                                            type="number"
                                            min="0"
                                            max={displayRemaining}
                                            disabled={isComplete}
                                            className="w-full border border-slate-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100 font-bold text-emerald-700"
                                            value={receiveQtys[item.productId] || ''}
                                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0, 'good')}
                                            placeholder="0"
                                         />
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>

         </div>

         <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
             <button onClick={onClose} disabled={loading} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
             <button 
                onClick={handleSubmit} 
                disabled={loading || !invoiceRef || (Object.values(receiveQtys).every((v: number) => v <= 0) && Object.values(damageQtys).every((v: number) => v <= 0))}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
             >
                {loading ? 'Processing...' : (
                    <>
                        {generatingPdf ? <Printer size={18} className="animate-pulse" /> : <PackageCheck size={18} />}
                        {generatingPdf ? 'Generating PDF...' : 'Confirm & Print Report'}
                    </>
                )}
             </button>
         </div>
       </div>
    </div>
  );
};