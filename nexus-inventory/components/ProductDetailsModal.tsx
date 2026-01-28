import React from 'react';
import { Product } from '../types';
import { X, Package, Tag, MapPin, DollarSign, Calendar, Info, Layers, CircleCheck, CircleSlash } from 'lucide-react';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  // Sort batches: Active batches first, then by date (oldest first for FIFO logic within groups)
  const batches = product.batches ? [...product.batches].sort((a, b) => {
      // 1. Status: Active (qty > 0) before Sold Out (qty == 0)
      if ((a.quantity || 0) > 0 && (b.quantity || 0) === 0) return -1;
      if ((a.quantity || 0) === 0 && (b.quantity || 0) > 0) return 1;
      
      // 2. Date: Oldest first (FIFO order)
      return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
  }) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{product.name}</h3>
            <p className="text-sm text-slate-500 font-mono mt-1">{product.sku}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
            
            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Tag className="text-slate-400 mt-0.5" size={18} />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                            <p className="font-medium text-slate-800">{product.category}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="text-slate-400 mt-0.5" size={18} />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Branch</p>
                            <p className="font-medium text-slate-800">{product.branch}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Info className="text-slate-400 mt-0.5" size={18} />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Supplier</p>
                            <p className="font-medium text-slate-800">{product.supplier}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="flex items-start gap-3">
                        <Package className="text-slate-400 mt-0.5" size={18} />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Quantity</p>
                            <p className={`font-bold text-lg ${(product.quantity || 0) <= (product.minLevel || 0) ? 'text-red-600' : 'text-slate-800'}`}>
                                {product.quantity || 0} <span className="text-sm font-normal text-slate-500">units</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <DollarSign className="text-slate-400 mt-0.5" size={18} />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Valuation</p>
                            <div className="flex gap-4">
                                <div>
                                    <span className="text-slate-500 text-xs">Selling Price: </span>
                                    <span className="font-medium">₱{(product.price || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-xs">Current Batch Cost: </span>
                                    <span className="font-medium">₱{(product.cost || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar className="text-slate-400 mt-0.5" size={18} />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Last Restock</p>
                            <p className="font-medium text-slate-800">{new Date(product.lastRestockDate || product.lastUpdated).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{product.description || 'No description provided.'}"
                </p>
            </div>

            {/* FIFO Batches Table */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="text-blue-600" size={18} />
                        <h4 className="font-bold text-slate-700 text-sm uppercase">Inventory Batches (FIFO Layers)</h4>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                        {batches.length} Records
                    </span>
                </div>
                
                <div className="overflow-y-auto max-h-[250px] relative">
                    {batches.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3 bg-slate-50">Date Added</th>
                                    <th className="px-4 py-3 text-center bg-slate-50">Status</th>
                                    <th className="px-4 py-3 text-center bg-slate-50">Batch Qty</th>
                                    <th className="px-4 py-3 text-right bg-slate-50">Unit Cost</th>
                                    <th className="px-4 py-3 text-right bg-slate-50">Current Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {batches.map((batch) => {
                                    const isSoldOut = (batch.quantity || 0) === 0;
                                    return (
                                        <tr key={batch.id} className={`bg-white transition-colors hover:bg-slate-50 ${isSoldOut ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                            <td className="px-4 py-3 text-slate-700">
                                                <div className="font-medium">{new Date(batch.dateAdded).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(batch.dateAdded).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isSoldOut ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                        <CircleSlash size={10} /> Sold Out
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <CircleCheck size={10} /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium">
                                                <div className="flex flex-col items-center">
                                                    <span className={isSoldOut ? 'text-slate-400' : 'text-slate-800 text-lg'}>{batch.quantity || 0}</span>
                                                    <span className="text-[10px] text-slate-400">of {batch.originalQuantity || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">₱{(batch.unitCost || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-600">
                                                ₱{((batch.quantity || 0) * (batch.unitCost || 0)).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-400 italic flex flex-col items-center gap-2">
                             <Package size={32} className="opacity-20" />
                             <p>No inventory batch history available.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};