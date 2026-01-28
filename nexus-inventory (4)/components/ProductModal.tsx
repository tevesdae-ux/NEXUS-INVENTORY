import React, { useState, useEffect, useMemo } from 'react';
import { Product, MasterProduct } from '../types';
import { Lock, Unlock, Check, X, AlertOctagon } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (p: Product, damageQty?: number) => void;
  currentBranch: string;
  branches: string[];
  categories: string[];
  masterProducts: MasterProduct[];
}

export const ProductModal: React.FC<ProductModalProps> = ({ 
  isOpen, onClose, product, onSave, currentBranch, branches, categories, masterProducts 
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', category: '', quantity: 0, minLevel: 5, price: 0, cost: 0, supplier: '', description: '', branch: ''
  });
  
  const [initialDamage, setInitialDamage] = useState<number>(0);
  const [searchMaster, setSearchMaster] = useState('');
  const [showMasterDropdown, setShowMasterDropdown] = useState(false);

  // Authorization State
  const [isCostUnlocked, setIsCostUnlocked] = useState(false);
  const [showAuthInput, setShowAuthInput] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState(false);
  
  const AUTH_CODE = "120124";

  useEffect(() => {
    if (isOpen) {
      setFormData(product || {
        name: '', 
        sku: '', 
        category: categories[0] || '', 
        quantity: 0, 
        minLevel: 5, 
        price: 0, 
        cost: 0, 
        supplier: '', 
        description: '', 
        branch: currentBranch === 'All Branches' ? (branches[0] || '') : currentBranch
      });
      setInitialDamage(0);
      setSearchMaster('');
      setShowMasterDropdown(false);

      setIsCostUnlocked(!product); 
      setShowAuthInput(false);
      setAuthCode('');
      setAuthError(false);
    }
  }, [isOpen, product, currentBranch, branches, categories]);

  const filteredMasterProducts = useMemo(() => {
    const lower = (searchMaster || '').toLowerCase();
    if (!lower) return [];
    return masterProducts.filter(mp => {
        if (!mp) return false;
        return (mp.name || '').toLowerCase().includes(lower) || 
               (mp.sku || '').toLowerCase().includes(lower);
    }).slice(0, 5);
  }, [searchMaster, masterProducts]);

  const handleSelectMaster = (mp: MasterProduct) => {
      setFormData(prev => ({
          ...prev,
          name: mp.name,
          sku: mp.sku,
          category: mp.category,
          minLevel: mp.minLevel || 5,
          cost: mp.cost || 0,
          supplier: mp.supplier,
          description: mp.description
      }));
      setSearchMaster('');
      setShowMasterDropdown(false);
  };

  const handleUnlockCost = () => {
      if (authCode === AUTH_CODE) {
          setIsCostUnlocked(true);
          setShowAuthInput(false);
          setAuthError(false);
          setAuthCode('');
      } else {
          setAuthError(true);
      }
  };

  const profit = (formData.price || 0) - (formData.cost || 0);
  const margin = (formData.cost && formData.cost > 0) ? ((profit / formData.cost) * 100).toFixed(1) : '0.0';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.sku) {
      onSave(formData as Product, initialDamage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        
        {!product && (
            <div className="px-6 pt-6 relative">
                 <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Populate from Masterlist</label>
                 <input 
                    type="text"
                    placeholder="Search masterlist to auto-fill details..."
                    className="w-full border-2 border-blue-100 bg-blue-50 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchMaster}
                    onChange={e => { setSearchMaster(e.target.value); setShowMasterDropdown(true); }}
                    onFocus={() => setShowMasterDropdown(true)}
                 />
                 {showMasterDropdown && filteredMasterProducts.length > 0 && (
                     <div className="absolute left-6 right-6 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                         {filteredMasterProducts.map(mp => (
                             <div 
                                key={mp.id}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-50"
                                onClick={() => handleSelectMaster(mp)}
                             >
                                 <div className="font-medium text-slate-800">{mp.name}</div>
                                 <div className="text-xs text-slate-500">{mp.sku} • {mp.category}</div>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch Location</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.branch || ''}
                onChange={e => setFormData({...formData, branch: e.target.value})}
                disabled={!!product}
              >
                <option value="" disabled>Select Branch</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
               <select 
                required
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="" disabled>Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Good Stock</label>
                  <input required type="number" min="0" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.quantity || 0} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} 
                    disabled={!!product}
                  />
                  {product && <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Use PO to receive good stock.</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                        <AlertOctagon size={14} className="text-red-500" /> Damaged Stock
                    </label>
                    <input 
                        type="number" 
                        min="0" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none bg-red-50/30" 
                        value={initialDamage || 0} 
                        onChange={e => setInitialDamage(parseInt(e.target.value) || 0)} 
                        disabled={!!product}
                    />
                    {!product && <p className="text-[10px] text-red-400 mt-1 uppercase font-bold">Creates a separate (DAMAGE) item.</p>}
                </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg md:col-span-2 border border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3 text-sm uppercase tracking-wide">Pricing & Financials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="relative">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cost Price (Avg)</label>
                    <div className="flex items-center gap-2">
                        <input 
                            required 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            className={`w-full border rounded-lg p-2 outline-none ${
                                product && !isCostUnlocked 
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' 
                                : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                            }`}
                            value={formData.cost || ''} 
                            onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                            disabled={!!product && !isCostUnlocked}
                        />
                        
                        {product && !isCostUnlocked && (
                            <button 
                                type="button" 
                                onClick={() => setShowAuthInput(!showAuthInput)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-200 rounded-lg"
                                title="Unlock Cost Editing"
                            >
                                <Lock size={16} />
                            </button>
                        )}
                        {product && isCostUnlocked && (
                             <div className="p-2 text-emerald-500" title="Unlocked">
                                <Unlock size={18} />
                            </div>
                        )}
                    </div>

                    {showAuthInput && !isCostUnlocked && (
                        <div className="absolute right-0 top-0 mt-10 z-20 bg-white border border-slate-200 shadow-xl rounded-lg p-2 flex items-center gap-2 w-48 animate-fade-in">
                             <input 
                                type="password"
                                placeholder="Code" 
                                className={`w-full text-xs border rounded p-1.5 outline-none ${authError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                value={authCode}
                                onChange={(e) => { setAuthCode(e.target.value); setAuthError(false); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlockCost()}
                                autoFocus
                             />
                             <button type="button" onClick={handleUnlockCost} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check size={16} /></button>
                             <button type="button" onClick={() => setShowAuthInput(false)} className="text-slate-400 hover:bg-slate-50 p-1 rounded"><X size={16} /></button>
                        </div>
                    )}
                  </div>

                   <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Selling Price (₱)</label>
                    <input required type="number" step="0.01" min="0" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
                  </div>
                   <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Est. Profit / Unit</label>
                    <div className={`w-full border border-slate-200 bg-white rounded-lg p-2 font-medium flex justify-between items-center ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span>₱{(profit || 0).toFixed(2)}</span>
                        <span className="text-xs text-slate-400">{margin}%</span>
                    </div>
                  </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Level (Alert)</label>
              <input required type="number" min="0" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.minLevel || 0} onChange={e => setFormData({...formData, minLevel: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={3}
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};