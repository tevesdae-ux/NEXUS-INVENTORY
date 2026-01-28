import React, { useState, useMemo, useEffect } from 'react';
import { MasterProduct, Product } from '../types';
import { Layers, X, Search, Plus, Trash2, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProducts: MasterProduct[];
  branches: string[];
  currentBranch: string;
  onConfirm: (products: Product[]) => Promise<void>;
}

interface BulkItem extends MasterProduct {
    initialQty: number;
    sellingPrice: number;
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({ 
  isOpen, onClose, masterProducts, branches, currentBranch, onConfirm 
}) => {
  const [targetBranch, setTargetBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<BulkItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setTargetBranch(currentBranch === 'All Branches' ? (branches[0] || '') : currentBranch);
        setSelectedItems([]);
        setSearchTerm('');
        setError('');
        setLoading(false);
    }
  }, [isOpen, branches, currentBranch]);

  const filteredMaster = useMemo(() => {
      const lower = searchTerm.toLowerCase();
      if (!lower) return [];
      return masterProducts.filter(mp => {
          if (!mp) return false;
          return ((mp.name || '').toLowerCase().includes(lower) || (mp.sku || '').toLowerCase().includes(lower)) &&
                 !selectedItems.some(item => item.sku === mp.sku);
      }).slice(0, 10);
  }, [searchTerm, masterProducts, selectedItems]);

  const handleSelectItem = (mp: MasterProduct) => {
      setSelectedItems([...selectedItems, { 
          ...mp, 
          initialQty: 0, 
          sellingPrice: mp.cost ? mp.cost / 0.7 : 0 
      }]);
      setSearchTerm('');
      setShowDropdown(false);
  };

  const handleUpdateItem = (idx: number, field: 'initialQty' | 'sellingPrice' | 'cost', value: number) => {
      const newList = [...selectedItems];
      newList[idx] = { ...newList[idx], [field]: value };
      setSelectedItems(newList);
  };

  const handleRemove = (idx: number) => {
      const newList = [...selectedItems];
      newList.splice(idx, 1);
      setSelectedItems(newList);
  };

  const handleSubmit = async () => {
      if (!targetBranch) {
          setError("Please select a target branch.");
          return;
      }
      if (selectedItems.length === 0) {
          setError("Please add at least one product.");
          return;
      }

      setLoading(true);
      try {
          const productsToSave: Product[] = selectedItems.map(item => ({
              id: '', // Will be generated in service
              name: item.name,
              sku: item.sku,
              category: item.category,
              quantity: item.initialQty,
              minLevel: item.minLevel,
              price: item.sellingPrice,
              cost: item.cost,
              supplier: item.supplier,
              description: item.description,
              branch: targetBranch,
              lastUpdated: new Date().toISOString()
          }));

          await onConfirm(productsToSave);
          onClose();
      } catch (err: any) {
          setError(err.message || "Failed to bulk add products.");
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Batch Add Products</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase">Import from Masterlist into Branch Inventory</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={28} />
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Branch and Search Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/3">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Target Branch</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select 
                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none"
                                value={targetBranch}
                                onChange={e => setTargetBranch(e.target.value)}
                            >
                                <option value="" disabled>Select Branch...</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Search Masterlist</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                placeholder="Type SKU or Product Name..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                                onFocus={() => setShowDropdown(true)}
                            />
                        </div>

                        {showDropdown && searchTerm && (
                            <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                {filteredMaster.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 italic text-sm">No new templates found</div>
                                ) : (
                                    filteredMaster.map(mp => (
                                        <div 
                                            key={mp.id}
                                            className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                            onClick={() => handleSelectItem(mp)}
                                        >
                                            <div>
                                                <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{mp.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{mp.sku} • {mp.category}</div>
                                            </div>
                                            <Plus size={20} className="text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Items Table */}
                <div className="border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4 w-32">Initial Qty</th>
                                <th className="px-6 py-4 w-40">Unit Cost (₱)</th>
                                <th className="px-6 py-4 w-40">Retail Price (₱)</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {selectedItems.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Layers size={40} className="opacity-10" />
                                            <p className="text-sm font-bold uppercase opacity-40 tracking-tight">Search and add products above to start bulk import</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {selectedItems.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 line-clamp-1">{item.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{item.sku} • {item.category}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number"
                                            className="w-full border-2 border-slate-100 rounded-lg px-2 py-2 text-sm font-black focus:border-blue-400 outline-none"
                                            value={item.initialQty}
                                            onChange={e => handleUpdateItem(idx, 'initialQty', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            className="w-full border-2 border-slate-100 rounded-lg px-2 py-2 text-sm font-black focus:border-blue-400 outline-none"
                                            value={item.cost}
                                            onChange={e => handleUpdateItem(idx, 'cost', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            className="w-full border-2 border-slate-100 rounded-lg px-2 py-2 text-sm font-black text-blue-600 focus:border-blue-400 outline-none bg-blue-50/30"
                                            value={item.sellingPrice}
                                            onChange={e => handleUpdateItem(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleRemove(idx)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {selectedItems.length > 0 && (
                            <tfoot className="bg-slate-50 font-bold border-t border-slate-100">
                                <tr>
                                    <td className="px-6 py-4 text-xs uppercase text-slate-500">Total Items: {selectedItems.length}</td>
                                    <td colSpan={4} className="px-6 py-4 text-right">
                                        <span className="text-xs text-slate-400 uppercase mr-3">Est. Inventory Value:</span>
                                        <span className="text-lg font-black text-slate-900">
                                            ₱{selectedItems.reduce((sum, item) => sum + (item.initialQty * item.cost), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 animate-shake">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold uppercase">{error}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold uppercase text-sm tracking-wider"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={loading || selectedItems.length === 0}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? 'Processing...' : <><CheckCircle2 size={18} /> Confirm Batch Import</>}
                </button>
            </div>

        </div>
    </div>
  );
};