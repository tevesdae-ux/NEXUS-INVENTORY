import React, { useState, useMemo } from 'react';
import { Product, UserRole } from '../types';
import { Edit, Trash2, Search, Filter, AlertCircle, Download, TrendingUp, MapPin, Hourglass, Eye, Check, PlusCircle } from 'lucide-react';

interface InventoryTableProps {
  products: Product[];
  role: UserRole;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onViewDetails: (product: Product) => void;
  onAddStock: (product: Product) => void;
  highlightedProductId?: string | null;
  categories: string[];
  currentBranch: string;
  showLowStockOnly: boolean;
  setShowLowStockOnly: (value: boolean) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  products, role, onEdit, onDelete, onViewDetails, onAddStock, highlightedProductId, categories, currentBranch, showLowStockOnly, setShowLowStockOnly 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isExporting, setIsExporting] = useState(false);

  const filterOptions = useMemo(() => {
      return ['All', ...categories];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(term) || 
                            (p.sku || '').toLowerCase().includes(term);
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      const matchesLowStock = showLowStockOnly ? (p.quantity || 0) <= (p.minLevel || 0) : true;
      
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchTerm, filterCategory, showLowStockOnly]);

  const handleExportPDF = () => {
    const element = document.getElementById('inventory-pdf-template');
    if (!element || isExporting) return;
    
    setIsExporting(true);

    const opt = {
      margin: 0.4,
      filename: `Inventory_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`,
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
        setIsExporting(false);
    }).catch((err: any) => {
        console.error(err);
        setIsExporting(false);
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    });
  };

  const isAgingStock = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 90;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full animate-fade-in">
       {/* Hidden PDF Template */}
       <div id="inventory-pdf-template" className="hidden bg-white text-slate-900 p-8 font-sans">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">Inventory Stock Report</h1>
                <p className="text-sm text-slate-500 mt-1">Nexus Inventory System</p>
                <p className="text-sm font-bold text-slate-700 mt-1">Branch: {currentBranch}</p>
                {showLowStockOnly && <p className="text-xs text-red-600 font-bold uppercase mt-1">Filtered: Low Stock Only</p>}
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-500">Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          
          <table className="w-full text-[10px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300">SKU</th>
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300">Product Name</th>
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300">Category</th>
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center">Qty</th>
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-right">Current Cost</th>
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300">Restock Date</th>
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center">Restock Qty</th>
                 <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, idx) => (
                 <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                   <td className="px-2 py-1 border border-slate-300">{p.sku}</td>
                   <td className="px-2 py-1 border border-slate-300 font-medium">{p.name}</td>
                   <td className="px-2 py-1 border border-slate-300">{p.category}</td>
                   <td className={`px-2 py-1 border border-slate-300 text-center ${(p.quantity || 0) <= (p.minLevel || 0) ? 'text-red-600 font-bold' : ''}`}>{p.quantity || 0}</td>
                   <td className="px-2 py-1 border border-slate-300 text-right">₱{(p.cost || 0).toFixed(2)}</td>
                   <td className="px-2 py-1 border border-slate-300 whitespace-nowrap">{p.lastRestockDate ? new Date(p.lastRestockDate).toLocaleDateString() : '-'}</td>
                   <td className="px-2 py-1 border border-slate-300 text-center">{p.lastRestockQuantity || '-'}</td>
                   <td className="px-2 py-1 border border-slate-300 truncate max-w-[100px]">{p.supplier}</td>
                 </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-[10px] text-slate-400 text-center border-t border-slate-200 pt-2">
            End of Report • Total Items: {filteredProducts.length}
          </div>
       </div>

      {/* Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Inventory Items</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border w-full sm:w-auto ${
                showLowStockOnly 
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {showLowStockOnly ? <Check size={16} /> : <AlertCircle size={16} />}
            <span className="whitespace-nowrap">Low Stock {showLowStockOnly && `(${filteredProducts.length})`}</span>
          </button>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search SKU or Name..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white w-full"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {filterOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto disabled:opacity-70"
          >
            <Download size={18} /> {isExporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3 sm:px-6 sm:py-4">SKU</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Product Name</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Branch</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Category</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Stock</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Last Restock</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Unit Cost/Price</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                   <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Search size={48} className="opacity-20" />
                      <p className="text-sm font-medium">No inventory products found.</p>
                   </div>
                </td>
              </tr>
            )}
            {filteredProducts.map((product) => {
              const activeBatch = product.batches && product.batches.length > 0 
                  ? product.batches
                      .filter(b => b.quantity > 0)
                      .sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime())[0]
                  : null;

              const displayCost = activeBatch ? (activeBatch.unitCost || 0) : (product.cost || 0);
              const isHighlighted = product.id === highlightedProductId;
              const isStagnant = (product.quantity || 0) > 0 && isAgingStock(product.lastRestockDate);

              return (
                <tr 
                    key={product.id} 
                    className={`hover:bg-slate-50 transition-colors group cursor-pointer ${isHighlighted ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}`}
                    onClick={() => onViewDetails(product)}
                >
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm font-mono text-slate-600">
                     {product.sku}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{product.name}</div>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-slate-600">
                     <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {product.branch}
                     </div>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4">
                    <span className="px-2 py-1 text-[10px] font-black uppercase bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex flex-col">
                      <span className={`font-black text-base ${(product.quantity || 0) <= 0 ? 'text-red-600' : ((product.quantity || 0) <= (product.minLevel || 0) ? 'text-amber-600' : 'text-slate-900')}`}>
                        {product.quantity || 0}
                      </span>
                      {(product.quantity || 0) <= 0 ? (
                         <span className="text-[10px] font-bold text-red-500 uppercase">Out of Stock</span>
                      ) : (product.quantity || 0) <= (product.minLevel || 0) ? (
                         <span className="text-[10px] font-bold text-amber-500 uppercase">Low Stock</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">
                        {product.lastRestockDate ? new Date(product.lastRestockDate).toLocaleDateString() : <span className="text-slate-400 italic">N/A</span>}
                    </div>
                    {isStagnant && (
                        <div className="flex items-center gap-1 mt-1 text-orange-600 text-[10px] bg-orange-50 w-fit px-2 py-0.5 rounded-full border border-orange-100">
                            <Hourglass size={10} />
                            <span>Aging</span>
                        </div>
                    )}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm whitespace-nowrap">
                    <div className="text-slate-500 text-xs tracking-tighter">Cost: ₱{(displayCost || 0).toFixed(2)}</div>
                    <div className="text-slate-900 font-black">₱{(product.price || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onAddStock(product)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Restock (Batch Add)"
                      >
                         <PlusCircle size={18} />
                      </button>
                      <button 
                        onClick={() => onEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};