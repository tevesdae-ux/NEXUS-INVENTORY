
import React, { useState } from 'react';
import { Tag, Plus, Edit2, Save, X, AlertTriangle, Trash2 } from 'lucide-react';

interface CategoryManagementProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      await onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat: string) => {
    setEditingCategory(cat);
    setEditValue(cat);
    setError('');
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editValue.trim() || editValue === editingCategory) {
        cancelEdit();
        return;
    }
    
    setLoading(true);
    setError('');
    try {
      await onUpdateCategory(editingCategory!, editValue.trim());
      setEditingCategory(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: string) => {
      if(!confirm(`Are you sure you want to delete category "${cat}"? Products in this category may need to be updated manually.`)) return;

      setLoading(true);
      setError('');
      try {
          await onDeleteCategory(cat);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Tag className="text-purple-600" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Manage Categories</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Category */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="text" 
              placeholder="New Category Name..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={!newCategoryName.trim() || loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={20} />
            </button>
          </form>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* List Categories */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
             <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Existing Categories ({categories.length})</h4>
             {categories.map((cat) => (
               <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-300 transition-all">
                 {editingCategory === cat ? (
                   <div className="flex flex-1 items-center gap-2">
                     <input 
                       type="text" 
                       className="flex-1 border border-purple-300 rounded px-2 py-1 text-sm outline-none"
                       value={editValue}
                       onChange={(e) => setEditValue(e.target.value)}
                       autoFocus
                     />
                     <button onClick={saveEdit} disabled={loading} className="text-emerald-600 hover:bg-emerald-100 p-1 rounded">
                       <Save size={16} />
                     </button>
                     <button onClick={cancelEdit} disabled={loading} className="text-slate-400 hover:bg-slate-200 p-1 rounded">
                       <X size={16} />
                     </button>
                   </div>
                 ) : (
                   <>
                     <span className="font-medium text-slate-800">{cat}</span>
                     <div className="flex items-center gap-1">
                        <button 
                            onClick={() => startEdit(cat)}
                            className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors"
                            title="Rename Category"
                        >
                        <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => handleDelete(cat)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Delete Category"
                        >
                        <Trash2 size={16} />
                        </button>
                     </div>
                   </>
                 )}
               </div>
             ))}
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-xs text-purple-900 border border-purple-100">
            <strong>Tip:</strong> Renaming a category will update all linked products automatically.
          </div>
        </div>
      </div>
    </div>
  );
};
