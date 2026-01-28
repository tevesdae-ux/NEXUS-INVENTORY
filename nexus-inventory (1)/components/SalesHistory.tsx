import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Product } from '../types';
import { 
  ShoppingCart, TrendingUp, Calendar, Download, 
  ChevronDown, ChevronRight as ChevronRightIcon, 
  Printer, DollarSign, ReceiptText, Trash2, X, 
  FileText, List, BarChart3, Building2, Sparkles, RefreshCcw, Plus, Search
} from 'lucide-react';

interface SalesHistoryProps {
  transactions: Transaction[];
  branchName: string;
  onOpenReturn: () => void;
  onOpenRecordSale: () => void;
  onOpenAIAssistant: () => void;
  onDeleteInvoice?: (invoiceNumber: string) => Promise<void>;
  branches: string[];
  currentBranch: string;
  onBranchChange: (branch: string) => void;
}

type PeriodType = 'daily' | 'monthly';
type ViewMode = 'log' | 'summary';

export const SalesHistory: React.FC<SalesHistoryProps> = ({ 
  transactions, branchName, onOpenReturn, onOpenRecordSale, onOpenAIAssistant, onDeleteInvoice, branches, currentBranch, onBranchChange 
}) => {
  const toLocalISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const toLocalMonthString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [viewMode, setViewMode] = useState<ViewMode>('log');
  const [selectedDate, setSelectedDate] = useState(toLocalISOString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(toLocalMonthString(new Date()));
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [summarySearchTerm, setSummarySearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const DELETE_AUTH_CODE = "12012024";

  // Filter logic for the period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'OUT' && t.type !== 'RETURN') return false;
      const tDate = toLocalISOString(new Date(t.date));
      if (periodType === 'daily') return tDate === selectedDate;
      return tDate.startsWith(selectedMonth);
    });
  }, [transactions, selectedDate, selectedMonth, periodType]);

  // Group by Invoice for the Log view
  const groupedSales = useMemo(() => {
    const groups: Record<string, {
      id: string; invoiceNumber: string; date: string; user: string; type: 'OUT' | 'RETURN'; items: Transaction[]; totalRevenue: number; totalProfit: number; totalQty: number;
      paymentMethod?: string; referenceNo?: string;
    }> = {};
    
    filteredTransactions.forEach(t => {
      const inv = t.invoiceNumber || `NO-INV-${t.id}`;
      if (!groups[inv]) {
        groups[inv] = { 
            id: t.id, 
            invoiceNumber: t.invoiceNumber || 'N/A', 
            date: t.date, 
            user: t.user, 
            type: 'OUT', 
            items: [], 
            totalRevenue: 0, 
            totalProfit: 0, 
            totalQty: 0,
            paymentMethod: t.paymentMethod,
            referenceNo: t.referenceNo
        };
      }
      groups[inv].items.push(t);
      const isReturn = t.type === 'RETURN';
      const revenue = t.totalCost || 0;
      const cost = (t.unitCost || 0) * (t.quantity || 0);
      const profit = ((t.price || 0) * (t.quantity || 0)) - cost;
      
      if (isReturn) {
        groups[inv].totalRevenue -= revenue;
        groups[inv].totalProfit -= profit;
        groups[inv].totalQty -= (t.quantity || 0);
        groups[inv].type = 'RETURN';
      } else {
        groups[inv].totalRevenue += revenue;
        groups[inv].totalProfit += profit;
        groups[inv].totalQty += (t.quantity || 0);
      }
    });
    
    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  // Aggregate by Product for the Summary view
  const productSummary = useMemo(() => {
    const summary: Record<string, { name: string; qty: number; revenue: number; profit: number; returns: number }> = {};
    const term = summarySearchTerm.toLowerCase();
    
    filteredTransactions.forEach(t => {
      // Search filtering
      if (term && !t.productName.toLowerCase().includes(term)) return;

      if (!summary[t.productId]) {
        summary[t.productId] = { name: t.productName, qty: 0, revenue: 0, profit: 0, returns: 0 };
      }
      
      const cost = (t.unitCost || 0) * (t.quantity || 0);
      if (t.type === 'RETURN') {
        summary[t.productId].qty -= t.quantity;
        summary[t.productId].revenue -= (t.totalCost || 0);
        summary[t.productId].profit -= (((t.price || 0) * t.quantity) - cost);
        summary[t.productId].returns += t.quantity;
      } else {
        summary[t.productId].qty += t.quantity;
        summary[t.productId].revenue += (t.totalCost || 0);
        summary[t.productId].profit += (((t.price || 0) * t.quantity) - cost);
      }
    });
    
    return Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTransactions, summarySearchTerm]);

  const summaryTotals = useMemo(() => {
    return productSummary.reduce((acc, curr) => ({
      revenue: acc.revenue + (curr.revenue || 0),
      qty: acc.qty + (curr.qty || 0)
    }), { revenue: 0, qty: 0 });
  }, [productSummary]);

  const handleExportPDF = () => {
    const element = document.getElementById('sales-report-template');
    if (!element || isExporting) return;
    
    setIsExporting(true);

    const opt = {
      margin: 0.5,
      filename: `Sales_Report_${periodType}_${periodType === 'daily' ? selectedDate : selectedMonth}.pdf`,
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

    // @ts-ignore
    html2pdf().from(clone).set(opt).save().then(() => {
        document.body.removeChild(container);
        setIsExporting(false);
    }).catch((err: any) => {
        console.error("PDF Export Error:", err);
        setIsExporting(false);
        if (document.body.contains(container)) document.body.removeChild(container);
    });
  };

  const toggleExpand = (invoiceNumber: string) => {
    const newSet = new Set(expandedInvoices);
    if (newSet.has(invoiceNumber)) newSet.delete(invoiceNumber);
    else newSet.add(invoiceNumber);
    setExpandedInvoices(newSet);
  };

  const handleAuthCodeChange = async (e: React.ChangeEvent<HTMLInputElement>, invoiceNumber: string) => {
    const code = e.target.value;
    setAuthCode(code);
    if (code === DELETE_AUTH_CODE && onDeleteInvoice) {
      await onDeleteInvoice(invoiceNumber);
      setInvoiceToDelete(null);
      setAuthCode('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Daily Sales Log</h1>
          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full border border-emerald-200">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
            Live System
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={currentBranch} 
              onChange={(e) => onBranchChange(e.target.value)} 
              className="w-full md:w-48 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
              <option value="All Branches">All Branches</option>
            </select>
          </div>
          
          <button 
            onClick={onOpenRecordSale}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-bold shadow-lg shadow-emerald-100 transition-all"
          >
            <Plus size={18} /> Record Sale
          </button>
          
          <button 
            onClick={onOpenReturn}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold shadow-lg shadow-amber-100 transition-all"
          >
            <RefreshCcw size={18} /> Process Return
          </button>

          <button 
            onClick={onOpenAIAssistant}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 transition-all"
          >
            <Sparkles size={18} /> AI Assistant
          </button>
        </div>
      </div>

      {/* Main Filter & Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 justify-between items-center">
        
        {/* View Switcher Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full lg:w-auto border border-slate-200 shadow-inner">
          <button 
            onClick={() => { setPeriodType('daily'); setViewMode('log'); }}
            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${periodType === 'daily' && viewMode === 'log' ? 'bg-white text-blue-600 shadow-md border border-blue-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Daily Log
          </button>
          <button 
            onClick={() => { setPeriodType('monthly'); setViewMode('log'); }}
            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${periodType === 'monthly' && viewMode === 'log' ? 'bg-white text-blue-600 shadow-md border border-blue-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Monthly Summary
          </button>
          <button 
            onClick={() => { setViewMode('summary'); }}
            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'summary' ? 'bg-white text-blue-600 shadow-md border border-blue-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Item Summary
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4 w-full lg:w-auto">
           {/* Period Picker */}
           <div className="flex items-center gap-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Period:</div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                {periodType === 'daily' ? (
                  <input 
                    type="date" 
                    className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tracking-tight focus:ring-2 focus:ring-blue-500 outline-none w-40"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                ) : (
                  <input 
                    type="month" 
                    className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tracking-tight focus:ring-2 focus:ring-blue-500 outline-none w-40"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                )}
              </div>
           </div>

           <button 
             onClick={handleExportPDF}
             disabled={isExporting}
             className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-50"
           >
             <Download size={16} /> {isExporting ? 'Exporting...' : 'Export Report'}
           </button>
        </div>
      </div>

      {/* Summary Search Bar */}
      {viewMode === 'summary' && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 animate-fade-in-up">
           <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search products in summary..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={summarySearchTerm}
                onChange={(e) => setSummarySearchTerm(e.target.value)}
              />
              {summarySearchTerm && (
                <button 
                  onClick={() => setSummarySearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
           </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {viewMode === 'log' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-[10px] uppercase text-slate-400 font-black tracking-[0.1em] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5">Transaction Date</th>
                  <th className="px-6 py-5">Invoice #</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-center">Items</th>
                  <th className="px-6 py-5 text-right">Revenue</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupedSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center text-slate-300 font-bold uppercase tracking-widest italic flex flex-col items-center gap-4">
                      <List size={48} className="opacity-10" />
                      No transactions found for this period.
                    </td>
                  </tr>
                )}
                {groupedSales.map((group) => {
                  const isExpanded = expandedInvoices.has(group.invoiceNumber);
                  const isDeleting = invoiceToDelete === group.invoiceNumber;
                  return (
                    <React.Fragment key={group.id}>
                      <tr 
                        onClick={() => toggleExpand(group.invoiceNumber)}
                        className={`hover:bg-blue-50/30 group transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-6 py-5 text-xs font-bold text-slate-500">
                           {new Date(group.date).toLocaleDateString('en-GB')}
                           <span className="text-[10px] block text-slate-300 font-normal mt-0.5">{new Date(group.date).toLocaleTimeString()}</span>
                        </td>
                        <td className="px-6 py-5 font-mono font-black text-blue-600 text-sm tracking-tight">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown size={14} className="text-blue-400" /> : <ChevronRightIcon size={14} className="text-slate-300" />}
                            {group.invoiceNumber}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md font-black tracking-wider ${group.type === 'RETURN' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                            {group.type}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center text-xs font-bold text-slate-400">
                          {group.items.length} sku(s)
                        </td>
                        <td className="px-6 py-5 text-right font-black text-slate-900 text-base tracking-tighter">
                          {group.totalRevenue < 0 ? '-' : ''}₱{Math.abs(group.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2">
                             {!isDeleting ? (
                               <>
                                 <button onClick={() => window.print()} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white rounded-xl transition-all" title="Reprint"><Printer size={18} /></button>
                                 <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all" title="View Details"><FileText size={18} /></button>
                                 <button onClick={() => { setInvoiceToDelete(group.invoiceNumber); setAuthCode(''); }} className="p-2 text-slate-300 hover:text-red-600 hover:bg-white rounded-xl transition-all" title="Delete"><Trash2 size={18} /></button>
                               </>
                             ) : (
                               <div className="flex items-center gap-1 animate-fade-in-up">
                                  <input 
                                    type="password"
                                    placeholder="Confirm Code"
                                    className="border border-red-200 rounded-lg px-2 py-1.5 text-[10px] w-24 outline-none focus:border-red-500 bg-red-50/30"
                                    value={authCode}
                                    onChange={(e) => handleAuthCodeChange(e, group.invoiceNumber)}
                                    autoFocus
                                  />
                                  <button onClick={() => setInvoiceToDelete(null)} className="p-1.5 text-slate-400 hover:text-slate-600"><X size={16} /></button>
                               </div>
                             )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={6} className="px-8 py-4">
                             <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm animate-fade-in p-4">
                                <div className="mb-4 flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex gap-4">
                                        <span>Payment: <strong className="text-slate-700">{group.paymentMethod || 'CASH'}</strong></span>
                                        {group.referenceNo && <span>Ref #: <strong className="text-blue-600 font-mono">{group.referenceNo}</strong></span>}
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-slate-400">Processed by: <span className="text-slate-700">{group.user}</span></div>
                                </div>
                                <table className="w-full text-[11px]">
                                   <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest border-b border-slate-100">
                                      <tr>
                                         <th className="px-4 py-3 text-left">Product</th>
                                         <th className="px-4 py-3 text-center">Qty</th>
                                         <th className="px-4 py-3 text-right">Unit Price</th>
                                         <th className="px-4 py-3 text-right">Total</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-50">
                                      {group.items.map((item, idx) => (
                                         <tr key={idx} className={item.type === 'RETURN' ? 'bg-red-50/20 text-red-700' : ''}>
                                            <td className="px-4 py-3 font-bold">{item.productName} {item.type === 'RETURN' && '(RETURN)'}</td>
                                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">₱{(item.price || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-black">₱{((item.price || 0) * item.quantity).toFixed(2)}</td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ITEM SUMMARY VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-[10px] uppercase text-slate-400 font-black tracking-[0.1em] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5">Product Name</th>
                  <th className="px-6 py-5 text-center">Qty Sold</th>
                  <th className="px-6 py-5 text-center">Qty Returned</th>
                  <th className="px-6 py-5 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productSummary.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-24 text-center text-slate-300 font-bold uppercase tracking-widest italic flex flex-col items-center gap-4">
                       <BarChart3 size={48} className="opacity-10" />
                       No data found matching your search criteria.
                     </td>
                   </tr>
                )}
                {productSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-900 uppercase text-xs tracking-tight">{item.name}</td>
                    <td className="px-6 py-5 text-center font-black text-slate-800 text-sm">{item.qty}</td>
                    <td className="px-6 py-5 text-center font-bold text-red-500 text-sm">{item.returns}</td>
                    <td className="px-6 py-5 text-right font-black text-slate-900 text-base tracking-tighter">₱{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-100 bg-slate-50/50">
                <tr className="font-black">
                  <td className="px-6 py-5 text-xs text-slate-500 uppercase">Total Revenue for Period</td>
                  <td colSpan={2}></td>
                  <td className="px-6 py-5 text-right text-lg text-slate-900 tracking-tighter">₱{summaryTotals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* HIDDEN PDF TEMPLATE */}
      <div id="sales-report-template" className="hidden p-8 bg-white text-slate-900 font-sans">
          <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Sales Analysis Report</h1>
              <p className="text-sm font-medium text-slate-500">MEJ HOME DEPOT HARDWARE • {branchName}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-slate-400">Generation Date</div>
              <div className="text-sm font-bold">{new Date().toLocaleString()}</div>
            </div>
          </div>

          <h2 className="text-sm font-black uppercase tracking-widest mb-4 border-l-4 border-blue-600 pl-3">
            {viewMode === 'log' ? 'Transaction Log' : 'Aggregated Item Summary'}
          </h2>

          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300">
                {viewMode === 'log' ? (
                  <>
                    <th className="p-3 font-bold uppercase">Date</th>
                    <th className="p-3 font-bold uppercase">Invoice #</th>
                    <th className="p-3 font-bold uppercase">Type</th>
                    <th className="p-3 font-bold uppercase text-right">Revenue</th>
                  </>
                ) : (
                  <>
                    <th className="p-3 font-bold uppercase">Product</th>
                    <th className="p-3 font-bold uppercase text-center">Qty</th>
                    <th className="p-3 font-bold uppercase text-right">Revenue</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {viewMode === 'log' ? groupedSales.map((g, i) => (
                <tr key={i}>
                  <td className="p-3">{new Date(g.date).toLocaleDateString()}</td>
                  <td className="p-3 font-mono">{g.invoiceNumber}</td>
                  <td className="p-3 font-bold">{g.type}</td>
                  <td className="p-3 text-right font-bold">₱{g.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              )) : productSummary.map((item, i) => (
                <tr key={i}>
                  <td className="p-3 font-bold text-xs">{item.name}</td>
                  <td className="p-3 text-center">{item.qty}</td>
                  <td className="p-3 text-right font-bold">₱{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-900 mt-4">
              <tr className="font-bold">
                 <td className="p-3 uppercase text-[10px]" colSpan={viewMode === 'log' ? 3 : 2}>Total Revenue</td>
                 <td className="p-3 text-right text-base">₱{summaryTotals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] italic text-slate-400">
            End of Report • System Generated via Nexus Inventory
          </div>
      </div>
    </div>
  );
};