import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (quantity: number, unitCost: number) => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, product, onConfirm }) => {
  const [quantity, setQuantity] = useState(0);
  const [unitCost, setUnitCost] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
        setQuantity(0);
        // Default to the current FIFO cost of the product
        setUnitCost(product.cost || 0); 
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0 && unitCost >= 0) {
      onConfirm(quantity, unitCost);
    }
  };

  const totalCost = ((quantity || 0) * (unitCost || 0)).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">Add Inventory (Batch)</h3>
          <p className="text-sm text-slate-500">Restocking <strong>{product.branch}</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
            <h4 className="font-semibold text-slate-800 mb-2">{product.name}</h4>
            <div className="flex justify-between mb-1">
               <span className="text-sm text-slate-500">Branch:</span>
               <span className="text-sm font-medium text-slate-800">{product.branch}</span>
            </div>
            <div className="flex justify-between mb-1">
               <span className="text-sm text-slate-500">Current Stock:</span>
               <span className="text-sm font-medium text-slate-800">{product.quantity || 0}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-sm text-slate-500">Current Cost:</span>
               <span className="text-sm font-medium text-slate-800">₱{(product.cost || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Qty to Add</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  className="w-full border border-slate-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={quantity} 
                  onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost (₱)</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="0.01"
                  className="w-full border border-slate-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={unitCost} 
                  onChange={e => setUnitCost(parseFloat(e.target.value) || 0)} 
                />
              </div>
          </div>

          <div className="flex justify-between items-center py-2 text-sm">
             <span className="text-slate-500">Total Purchase Cost:</span>
             <span className="font-bold text-emerald-600 text-lg">₱{totalCost}</span>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
              <Plus size={18} /> Confirm Addition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};