import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, User, Product, MasterProduct } from '../types';
import { ClipboardList, Plus, Search, Filter, Box, Eye, CheckCircle, Clock, Archive, Download, Home } from 'lucide-react';
import { CreatePOModal } from './CreatePOModal';
import { ReceivePOModal } from './ReceivePOModal';

interface PurchaseOrderManagementProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  masterProducts: MasterProduct[]; 
  currentUser: User;
  branches: string[];
  onCreatePO: (po: any) => Promise<PurchaseOrder | void>;
  onReceivePO: (poId: string, invoiceRef: string, items: any[], damagedItems: any[]) => Promise<void>;
}

export const PurchaseOrderManagement: React.FC<PurchaseOrderManagementProps> = ({
  purchaseOrders, products, masterProducts, currentUser, branches, onCreatePO, onReceivePO
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  const [pdfPO, setPdfPO] = useState<PurchaseOrder | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredPOs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return purchaseOrders.filter(po => {
      if (!po) return false;
      const matchesTab = activeTab === 'active' 
        ? po.status !== 'Closed' 
        : po.status === 'Closed';
      
      const matchesSearch = 
        (po.poNumber || '').toLowerCase().includes(term) || 
        (po.supplier || '').toLowerCase().includes(term);
        
      return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  }, [purchaseOrders, activeTab, searchTerm]);

  const handleOpenReceive = (po: PurchaseOrder) => {
      setSelectedPO(po);
      setIsReceiveOpen(true);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Pending Receipt': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'Partially Received': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'Closed': return 'bg-slate-100 text-slate-600 border-slate-200';
          default: return 'bg-slate-100 text-slate-800';
      }
  };

  const handleExportPDF = (po: PurchaseOrder) => {
    setPdfPO(po);
    setIsExporting(true);
    setTimeout(() => {
        const element = document.getElementById('po-pdf-template');
        if (!element) {
            setIsExporting(false);
            return;
        }

        const opt = {
            margin: 0, 
            filename: `${po.poNumber}_PurchaseOrder.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
        };

        const clone = element.cloneNode(true) as HTMLElement;
        clone.classList.remove('hidden');
        clone.style.display = 'block';
        
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-10000px';
        container.style.left = '-10000px';
        container.style.width = '8.5in'; 
        container.appendChild(clone);
        document.body.appendChild(container);

        (window as any).html2pdf().set(opt).from(clone).save().then(() => {
            document.body.removeChild(container);
            setIsExporting(false);
            setPdfPO(null);
        }).catch((err: any) => {
            console.error(err);
            setIsExporting(false);
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        });
    }, 500);
  };

  const handleCreateAndPrint = async (draft: any) => {
      const createdPO = await onCreatePO(draft);
      setIsCreateOpen(false);
      if (createdPO) {
          handleExportPDF(createdPO);
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full animate-fade-in pb-10">
       
       {/* EXPORT PDF TEMPLATE: COORDINATE-BASED FOR 8.5 x 11 BOND PAPER (ADJUSTED UPWARD) */}
       <div id="po-pdf-template" className="hidden bg-white text-black font-sans relative" style={{ width: '8.5in', height: '11in' }}>
          {pdfPO && (
              <>
                {/* 3.A & 3.B: Logo & Subtitle Section - Shifted Up to Y=0.45 */}
                <div style={{ position: 'absolute', left: '3.05in', top: '0.45in', width: '2.4in', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                        <div style={{ position: 'relative', width: '100%', height: '40px' }}>
                             <svg viewBox="0 0 100 40" style={{ width: '100px', margin: '0 auto' }}>
                                <path d="M10 35 L50 5 L90 35" fill="none" stroke="#1d4ed8" strokeWidth="6" />
                                <path d="M25 35 L25 20 L40 20 L40 35" fill="#1d4ed8" />
                                <path d="M60 35 L60 20 L75 20 L75 35" fill="#1d4ed8" />
                             </svg>
                        </div>
                        <div style={{ fontWeight: '900', fontSize: '32pt', lineHeight: '1', color: '#1d4ed8', marginTop: '-5px' }}>MEJ</div>
                        <div style={{ fontWeight: '900', fontSize: '14pt', lineHeight: '1', color: '#000', letterSpacing: '0.1em' }}>HOME DEPOT</div>
                    </div>
                </div>
                <div style={{ position: 'absolute', left: '2.55in', top: '1.45in', width: '3.4in', textAlign: 'center', fontSize: '8.5pt', fontWeight: 'bold', color: '#000', letterSpacing: '0.05em' }}>
                    HARDWARE & CONSTRUCTION SUPPLIES
                </div>

                {/* 3.C: PURCHASE ORDER Title - Shifted Up to Y=1.85 */}
                <div style={{ position: 'absolute', left: '0.75in', top: '1.85in', width: '4.5in', fontWeight: '900', fontSize: '24pt', color: '#000' }}>
                    PURCHASE ORDER
                </div>

                {/* 3.D: Date & PO Number - Shifted Up to Y=1.90, Right 0.80in */}
                <div style={{ position: 'absolute', left: '6.05in', top: '1.90in', width: '1.65in', textAlign: 'right', fontSize: '9pt', color: '#000' }}>
                    <div style={{ fontWeight: 'bold' }}>{pdfPO.poNumber}</div>
                    <div style={{ marginTop: '2px' }}>{new Date(pdfPO.dateCreated).toLocaleDateString('en-US')}</div>
                </div>

                {/* 3.E: Horizontal Divider - Shifted Up to Y=2.50 */}
                <div style={{ position: 'absolute', left: '0.75in', top: '2.50in', width: '7in', borderBottom: '1.2pt solid #000' }}></div>

                {/* 4: Vendor / Ship To Labels - Shifted Up to Y=2.75 */}
                <div style={{ position: 'absolute', left: '0.75in', top: '2.75in', width: '3.4in', fontSize: '9pt', color: '#64748b', fontWeight: 'bold' }}>VENDOR / SUPPLIER</div>
                <div style={{ position: 'absolute', left: '4.35in', top: '2.75in', width: '3.4in', fontSize: '9pt', color: '#64748b', fontWeight: 'bold' }}>SHIP TO / BILL TO</div>

                {/* 4: Vendor / Ship Names - Shifted Up to Y=3.00 */}
                <div style={{ position: 'absolute', left: '0.75in', top: '3.00in', width: '3.4in', fontSize: '13pt', fontWeight: 'bold' }}>{pdfPO.supplier.toUpperCase()}</div>
                <div style={{ position: 'absolute', left: '4.35in', top: '3.00in', width: '3.4in', fontSize: '13pt', fontWeight: 'bold' }}>{pdfPO.branch.toUpperCase()}</div>

                <div style={{ position: 'absolute', left: '0.75in', top: '3.30in', width: '3.4in', fontSize: '8pt', color: '#94a3b8' }}>Supplier Account Reference</div>

                {/* 5: Items Table - Shifted Up to Y=3.80, Row Height Reduced to 0.32in */}
                <div style={{ position: 'absolute', left: '0.75in', top: '3.80in', width: '7in' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.2pt solid #000' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f8e9', height: '0.4in', borderBottom: '1.2pt solid #000' }}>
                                <th style={{ width: '0.6in', borderRight: '1.2pt solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>No.</th>
                                <th style={{ width: '0.8in', borderRight: '1.2pt solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>QTY.</th>
                                <th style={{ width: '0.9in', borderRight: '1.2pt solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>UNIT</th>
                                <th style={{ width: '4.7in', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>ITEM DESCRIPTION</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '9.5pt' }}>
                            {pdfPO.items.map((item, idx) => (
                                <tr key={item.productId} style={{ height: '0.32in', borderBottom: '1pt solid #000' }}>
                                    <td style={{ textAlign: 'center', borderRight: '1.2pt solid #000' }}>{idx + 1}</td>
                                    <td style={{ textAlign: 'center', borderRight: '1.2pt solid #000', fontWeight: 'bold' }}>{item.quantityOrdered}</td>
                                    <td style={{ textAlign: 'center', borderRight: '1.2pt solid #000' }}>{item.unit || 'PCS'}</td>
                                    <td style={{ padding: '0 0.12in', fontWeight: 'bold', borderRight: '0', textAlign: 'center' }}>{item.productName.toUpperCase()}</td>
                                </tr>
                            ))}
                            {/* Empty balance row */}
                            <tr style={{ height: '0.32in' }}>
                                <td style={{ borderRight: '1.2pt solid #000' }}></td>
                                <td style={{ borderRight: '1.2pt solid #000' }}></td>
                                <td style={{ borderRight: '1.2pt solid #000' }}></td>
                                <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold', fontSize: '9pt', letterSpacing: '0.1em', padding: '0.05in 0' }}>*** NOTHING FOLLOWS ***</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 6: Signature Section - Adjusted Downward */}
                {/* Prepared By moved to Y = 8.50 (Line) */}
                <div style={{ position: 'absolute', left: '0.75in', top: '8.25in', width: '2.8in', textAlign: 'center', fontSize: '11.5pt', fontWeight: 'bold' }}>
                    {pdfPO.preparedBy.toUpperCase()}
                </div>
                <div style={{ position: 'absolute', left: '0.75in', top: '8.50in', width: '2.8in', borderBottom: '1.2pt solid #000' }}></div>
                <div style={{ position: 'absolute', left: '0.75in', top: '8.55in', width: '2.8in', textAlign: 'center', fontSize: '8.5pt', fontWeight: 'bold', color: '#64748b' }}>
                    PREPARED BY
                </div>

                {/* Noted By moved to Y = 9.40 (Line) */}
                <div style={{ position: 'absolute', left: '0.75in', top: '9.15in', width: '2.8in', textAlign: 'center', fontSize: '11.5pt', fontWeight: 'bold' }}>
                    {pdfPO.notedBy.toUpperCase()}
                </div>
                <div style={{ position: 'absolute', left: '0.75in', top: '9.40in', width: '2.8in', borderBottom: '1.2pt solid #000' }}></div>
                <div style={{ position: 'absolute', left: '0.75in', top: '9.45in', width: '2.8in', textAlign: 'center', fontSize: '8.5pt', fontWeight: 'bold', color: '#64748b' }}>
                    NOTED BY
                </div>
              </>
          )}
       </div>

       {/* UI Table and Controls */}
       <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="text-indigo-600" /> Purchase Orders
              </h2>
              <p className="text-sm text-slate-500">Manage supplier orders and incoming stock</p>
          </div>
          <button 
             onClick={() => setIsCreateOpen(true)}
             disabled={isExporting}
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 font-bold"
          >
              <Plus size={18} /> Generate PO
          </button>
       </div>

       <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
             <button 
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Active Orders
             </button>
             <button 
                onClick={() => setActiveTab('closed')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'closed' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
             >
                History (Closed)
             </button>
          </div>
          
          <div className="relative flex-1 w-full sm:w-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search PO # or Supplier..."
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
       </div>

       <div className="overflow-x-auto flex-1">
           <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-black border-b border-slate-200">
                   <tr>
                       <th className="px-6 py-4">PO Number</th>
                       <th className="px-6 py-4">Date</th>
                       <th className="px-6 py-4">Supplier</th>
                       <th className="px-6 py-4">Branch</th>
                       <th className="px-6 py-4 text-center">Items</th>
                       <th className="px-6 py-4 text-center">Status</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                   {filteredPOs.length === 0 && (
                       <tr>
                           <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                               No purchase orders found.
                           </td>
                       </tr>
                   )}
                   {filteredPOs.map(po => (
                       <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-mono font-bold text-slate-700">{po.poNumber}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">{new Date(po.dateCreated).toLocaleDateString()}</td>
                           <td className="px-6 py-4 font-bold text-slate-900">{po.supplier}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">{po.branch}</td>
                           <td className="px-6 py-4 text-center">
                               <span className="inline-flex items-center justify-center px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
                                   {po.items.length}
                               </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(po.status)}`}>
                                   {po.status === 'Closed' ? <CheckCircle size={12} /> : (po.status === 'Partially Received' ? <Clock size={12} /> : <Box size={12} />)}
                                   {po.status}
                               </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                   <button 
                                      onClick={() => handleExportPDF(po)}
                                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                      title="Print PDF"
                                   >
                                       <Download size={18} />
                                   </button>
                                   {po.status !== 'Closed' && (
                                       <button 
                                          onClick={() => handleOpenReceive(po)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-xs font-bold shadow-sm transition-colors"
                                       >
                                           <Box size={14} /> Receive
                                       </button>
                                   )}
                                   {po.status === 'Closed' && (
                                       <button className="text-slate-400 hover:text-slate-600 p-2" title="View Details">
                                           <Eye size={18} />
                                       </button>
                                   )}
                               </div>
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
       
       <CreatePOModal 
         isOpen={isCreateOpen}
         onClose={() => setIsCreateOpen(false)}
         products={products}
         masterProducts={masterProducts}
         currentUser={currentUser}
         branches={branches}
         onConfirm={handleCreateAndPrint}
       />

       <ReceivePOModal 
         isOpen={isReceiveOpen}
         onClose={() => setIsReceiveOpen(false)}
         po={selectedPO}
         onConfirm={onReceivePO}
       />
    </div>
  );
};
