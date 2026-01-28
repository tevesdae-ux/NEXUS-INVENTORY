import React, { useState } from 'react';
import { Building2, Plus, Edit2, Save, X, AlertTriangle, Trash2 } from 'lucide-react';

interface BranchManagementProps {
  isOpen: boolean;
  onClose: () => void;
  branches: string[];
  onAddBranch: (name: string) => Promise<void>;
  onUpdateBranch: (oldName: string, newName: string) => Promise<void>;
  onDeleteBranch: (name: string) => Promise<void>;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({ 
  isOpen, onClose, branches, onAddBranch, onUpdateBranch, onDeleteBranch 
}) => {
  const [newBranchName, setNewBranchName] = useState('');
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      await onAddBranch(newBranchName.trim());
      setNewBranchName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add branch');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (branch: string) => {
    setEditingBranch(branch);
    setEditValue(branch);
    setError('');
  };

  const cancelEdit = () => {
    setEditingBranch(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editValue.trim() || editValue === editingBranch) {
        cancelEdit();
        return;
    }
    
    setLoading(true);
    setError('');
    try {
      await onUpdateBranch(editingBranch!, editValue.trim());
      setEditingBranch(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update branch');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branch: string) => {
    if (!window.confirm(`Are you sure you want to delete branch "${branch}"?\n\nThis will remove it from the selection list, but historical data will remain associated with the branch name.`)) return;

    setLoading(true);
    setError('');
    try {
        await onDeleteBranch(branch);
    } catch (err: any) {
        setError(err.message || 'Failed to delete branch');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Manage Branches</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Branch */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="text" 
              placeholder="New Branch Name..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={!newBranchName.trim() || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

          {/* List Branches */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
             <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Existing Branches ({branches.length})</h4>
             {branches.length === 0 && <p className="text-sm text-slate-400 italic">No branches found.</p>}
             {branches.map((branch) => (
               <div key={branch} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-300 transition-all">
                 {editingBranch === branch ? (
                   <div className="flex flex-1 items-center gap-2">
                     <input 
                       type="text" 
                       className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm outline-none"
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
                     <span className="font-medium text-slate-800">{branch}</span>
                     <div className="flex items-center gap-1">
                        <button 
                            type="button"
                            onClick={() => startEdit(branch)}
                            disabled={loading}
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                            title="Rename Branch"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(branch);
                            }}
                            disabled={loading}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Branch"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   </>
                 )}
               </div>
             ))}
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-800 border border-yellow-100">
            <strong>Note:</strong> Renaming a branch will automatically update all products and transaction history associated with it.
          </div>
        </div>
      </div>
    </div>
  );
};