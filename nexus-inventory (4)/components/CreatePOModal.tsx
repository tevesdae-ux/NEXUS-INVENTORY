import React, { useState, useEffect, useMemo } from 'react';
import { Product, User, MasterProduct } from '../types';
import { FilePlus, X, Search, Plus, Trash2, ShoppingBag, Hash, Box, UserCheck, Edit3 } from 'lucide-react';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  masterProducts: MasterProduct[];
  currentUser: User;
  onConfirm: (poData: any) => Promise<any>;
  branches: string[];
}

interface NewPOItem {
    productId: string;
    productName: string;
    sku: string;
    quantityOrdered: number;
    unitCost: number;
    unit?: string;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({ 
    isOpen, onClose, products, masterProducts, currentUser, onConfirm, branches 
}) => {
  const [poNumber, setPoNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [targetBranch, setTargetBranch] = useState(branches[0] || '');
  const [notes, setNotes] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [notedBy, setNotedBy] = useState('');
  
  const [items, setItems] = useState<NewPOItem[]>([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [unitToAdd, setUnitToAdd] = useState('PCS');
  
  // Selected Item can be existing Product OR MasterProduct
  const [selectedItem, setSelectedItem] = useState<{ id: string, name: string, sku: string, cost: number, type: 'existing' | 'master' } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        setPoNumber(`PO-${dateStr}-${randomSuffix}`);

        setSupplier('');
        setTargetBranch(branches[0] || '');
        setNotes('');
        setPreparedBy(currentUser.name);
        setNotedBy('');
        setItems([]);
        setSearchTerm('');
        setSelectedItem(null);
        setQtyToAdd(1);
        setUnitToAdd('PCS');
        setIsSubmitting(false);
    }
  }, [isOpen, branches, currentUser]);

  const filteredResults = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    if (!term) return { existing: [], master: [] };

    const branchProducts = targetBranch ? products.filter(p => p && p.branch === targetBranch) : products;
    const existing = branchProducts.filter(p => {
      if (!p) return false;
      return ((p.name || '').toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term)) &&
             !items.some(i => i.productId === p.id);
    });

    const existingSkus = new Set(existing.map(p => p.sku));
    const master = masterProducts.filter(mp => {
        if (!mp) return false;
        return ((mp.name || '').toLowerCase().includes(term) || (mp.sku || '').toLowerCase().includes(term)) &&
               !existingSkus.has(mp.sku) && 
               !items.some(i => i.productId === mp.id);
    });

    return { existing, master };
  }, [products, masterProducts, searchTerm, items, targetBranch]);

  const handleSelectProduct = (p: Product) => {
      setSelectedItem({ id: p.id, name: p.name, sku: p.sku, cost: p.cost || 0, type: 'existing' });
      setSearchTerm(p.name);
      setShowDropdown(false);
  };

  const handleSelectMaster = (mp: MasterProduct) => {
      setSelectedItem({ id: mp.id, name: mp.name, sku: mp.sku, cost: mp.cost || 0, type: 'master' });
      setSearchTerm(mp.name);
      setShowDropdown(false);
  };

  const handleAddItem = () => {
      if (selectedItem && qtyToAdd > 0) {
          setItems([...items, {
              productId: selectedItem.id, 
              productName: selectedItem.name,
              sku: selectedItem.sku,
              quantityOrdered: qtyToAdd,
              unitCost: selectedItem.cost,
              unit: unitToAdd.toUpperCase()
          }]);
          setSelectedItem(null);
          setSearchTerm('');
          setQtyToAdd(1);
          setUnitToAdd('PCS');
      }
  };

  const handleRemoveItem = (idx: number) => {
      const newItems = [...items];
      newItems.splice(idx, 1);
      setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supplier || items.length === 0 || !poNumber || !preparedBy || !notedBy) return;

      setIsSubmitting(true);
      try {
          await onConfirm({
              poNumber,
              supplier,
              branch: targetBranch,
              dateCreated: new Date().toISOString(),
              createdBy: currentUser.name,
              preparedBy,
              notedBy,
              items: items.map(i => ({...i, quantityReceived: 0})),
              notes
          });
      } catch (e: any) {
          alert(e.message || "Failed to create Purchase Order");
      }
      setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
           <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <FilePlus className="text-blue-600" /> Create Purchase Order
           </h3>
           <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">PO Number</label>
                    <div className="relative">
                        <input 
                            required
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 pl-9 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            value={poNumber}
                            onChange={e => setPoNumber(e.target.value)}
                            placeholder="PO-YYYYMMDD-XXXX"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                           <Hash size={16} />
                        </div>
                    </div>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                    <input 
                        required
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={supplier}
                        onChange={e => setSupplier(e.target.value)}
                        placeholder="e.g. TechGear Inc"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Branch</label>
                    <select 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={targetBranch}
                        onChange={e => {
                            setTargetBranch(e.target.value);
                            setItems([]); 
                        }}
                    >
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                 <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                    <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ref number..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                        <Edit3 size={14} className="text-blue-500" /> Prepared By <span className="text-red-500">*</span>
                    </label>
                    <input 
                        required
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={preparedBy}
                        onChange={e => setPreparedBy(e.target.value)}
                        placeholder="Name of individual preparing order"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                        <UserCheck size={14} className="text-emerald-500" /> Noted By <span className="text-red-500">*</span>
                    </label>
                    <input 
                        required
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={notedBy}
                        onChange={e => setNotedBy(e.target.value)}
                        placeholder="Manager or Supervisor name"
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                 <h4 className="text-sm font-bold text-slate-700 mb-3">Add Items to Order</h4>
                 <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 w-full relative">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Search Product / Masterlist</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="Search by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                    if (selectedItem) setSelectedItem(null);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            />
                        </div>
                        {showDropdown && searchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {filteredResults.existing.length > 0 && (
                                    <>
                                        <div className="px-4 py-1 bg-slate-100 text-xs font-bold text-slate-500 uppercase">Existing Branch Inventory</div>
                                        {filteredResults.existing.map(p => (
                                            <div 
                                                key={p.id} 
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-50 text-sm"
                                                onMouseDown={() => handleSelectProduct(p)}
                                            >
                                                <div className="font-medium text-slate-800">{p.name}</div>
                                                <div className="text-xs text-slate-500">{p.sku} • In Stock: {p.quantity || 0}</div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {filteredResults.master.length > 0 && (
                                    <>
                                        <div className="px-4 py-1 bg-purple-50 text-xs font-bold text-purple-600 uppercase flex items-center gap-1 border-t border-slate-200">
                                            <Box size={10} /> Masterlist (New to Branch)
                                        </div>
                                        {filteredResults.master.map(mp => (
                                            <div 
                                                key={mp.id} 
                                                className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-slate-50 text-sm"
                                                onMouseDown={() => handleSelectMaster(mp)}
                                            >
                                                <div className="font-medium text-slate-800">{mp.name}</div>
                                                <div className="text-xs text-slate-500">{mp.sku} • {mp.category}</div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {filteredResults.existing.length === 0 && filteredResults.master.length === 0 && (
                                    <div className="p-3 text-sm text-slate-400 text-center">No matches found</div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                        <input type="number" min="1" className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" 
                            value={qtyToAdd} onChange={e => setQtyToAdd(parseInt(e.target.value)||0)} />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" 
                            placeholder="e.g. PCS"
                            value={unitToAdd} onChange={e => setUnitToAdd(e.target.value)} />
                    </div>
                    <button 
                        onClick={handleAddItem} 
                        disabled={!selectedItem}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                        <Plus size={18} />
                    </button>
                 </div>
                 {selectedItem?.type === 'master' && (
                     <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-100 flex items-center gap-2">
                         <Box size={12} />
                         This product will be created in <strong>{targetBranch}</strong> inventory upon receipt.
                     </div>
                 )}
            </div>

            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-2 w-12">No.</th>
                        <th className="px-4 py-2 text-center w-20">Qty</th>
                        <th className="px-4 py-2 text-center w-24">Unit</th>
                        <th className="px-4 py-2">Item Description</th>
                        <th className="px-4 py-2 text-center w-20">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-6 text-slate-400 italic">No items added.</td></tr>
                    )}
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-2 text-center font-bold">{item.quantityOrdered || 0}</td>
                            <td className="px-4 py-2 text-center">{item.unit || 'PCS'}</td>
                            <td className="px-4 py-2">
                                <div className="font-medium text-slate-800">{item.productName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                            </td>
                            <td className="px-4 py-2 text-center">
                                <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
             <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold">Cancel</button>
             <button 
                onClick={handleSubmit} 
                disabled={!supplier || items.length === 0 || !poNumber || isSubmitting || !preparedBy || !notedBy}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 font-bold"
             >
                {isSubmitting ? 'Generating...' : <><ShoppingBag size={18} /> Generate PO</>}
             </button>
        </div>
      </div>
    </div>
  );
};