import React, { useState, useMemo, useEffect } from 'react';
import { MasterProduct } from '../types';
import { Search, Plus, Filter, Edit, Trash2, X, Save, Box, AlertCircle } from 'lucide-react';

interface MasterlistProps {
  masterProducts: MasterProduct[];
  categories: string[];
  onAdd: (mp: MasterProduct) => Promise<void>;
  onEdit: (mp: MasterProduct) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Masterlist: React.FC<MasterlistProps> = ({ masterProducts, categories, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterProduct | null>(null);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return masterProducts.filter(p => {
      if (!p) return false;
      const matchesSearch = (p.name || '').toLowerCase().includes(term) || 
                            (p.sku || '').toLowerCase().includes(term);
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [masterProducts, searchTerm, filterCategory]);

  const openAddModal = () => {
      setEditingItem(null);
      setIsModalOpen(true);
  };

  const openEditModal = (item: MasterProduct) => {
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(confirm("Are you sure? This will remove the template but won't affect existing inventory.")) {
          await onDelete(id);
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full animate-fade-in">
        
        {/* Header Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Box className="text-purple-600" />
                    Inventory Masterlist
                </h2>
                <p className="text-sm text-slate-500">Global product templates for all branches.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Templates..."
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                        className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white w-full"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <button 
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all font-medium"
                >
                    <Plus size={18} /> New Template
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">SKU</th>
                        <th className="px-6 py-4">Template Name</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Std. Cost</th>
                        <th className="px-6 py-4">Min. Alert</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                No master templates found. Add one to get started.
                            </td>
                        </tr>
                    )}
                    {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono text-slate-600">{item.sku}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                    {item.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">₱{(item.cost || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{item.minLevel}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => openEditModal(item)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Master Item Modal */}
        <MasterProductModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            item={editingItem}
            categories={categories}
            existingTemplates={masterProducts}
            onSave={async (item) => {
                if (editingItem) await onEdit(item);
                else await onAdd(item);
            }}
        />
    </div>
  );
};

interface MasterProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: MasterProduct | null;
    categories: string[];
    existingTemplates: MasterProduct[];
    onSave: (item: MasterProduct) => Promise<void>;
}

const MasterProductModal: React.FC<MasterProductModalProps> = ({ isOpen, onClose, item, categories, existingTemplates, onSave }) => {
    const [formData, setFormData] = useState<Partial<MasterProduct>>({
        name: '', sku: '', category: '', minLevel: 5, cost: 0, supplier: '', description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if(isOpen) {
            setFormData(item || {
                name: '', sku: '', category: categories[0] || '', minLevel: 5, cost: 0, supplier: '', description: ''
            });
            setError('');
        }
    }, [isOpen, item, categories]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // SKU Uniqueness Check
        const skuValue = formData.sku?.trim();
        if (!skuValue) {
            setError('SKU is required.');
            setLoading(false);
            return;
        }

        const isDuplicateSku = existingTemplates.some(t => 
            t.sku && skuValue && t.sku.trim().toLowerCase() === skuValue.toLowerCase() && 
            t.id !== item?.id
        );

        if (isDuplicateSku) {
            setError(`A template with SKU "${skuValue}" already exists. Please use a unique SKU.`);
            setLoading(false);
            return;
        }

        try {
            await onSave(formData as MasterProduct);
            onClose();
        } catch(err: any) {
            setError(err.message || 'Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800">{item ? 'Edit Template' : 'New Master Template'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none font-mono" 
                                value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                             <select 
                                required
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="" disabled>Select Category</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Default Supplier</label>
                            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                                value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
                        </div>
                        
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Default Min Level</label>
                            <input required type="number" min="0" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                                value={formData.minLevel} onChange={e => setFormData({...formData, minLevel: parseInt(e.target.value) || 0})} />
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Standard Cost</label>
                            <input required type="number" step="0.01" min="0" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                            value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} />
                        </div>
                     </div>
                     
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none" rows={3}
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                     </div>

                     {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm animate-shake">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                     )}

                     <div className="flex justify-end gap-3 pt-2">
                         <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                         <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all active:scale-95 disabled:opacity-50">
                             {loading ? 'Saving...' : 'Save Template'}
                         </button>
                     </div>
                </form>
            </div>
        </div>
    );
}