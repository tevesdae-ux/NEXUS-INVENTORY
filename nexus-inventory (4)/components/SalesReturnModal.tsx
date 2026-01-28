import React, { useState, useEffect, useMemo } from 'react';
import { Product, Transaction } from '../types';
import { RefreshCcw, Search, X, CheckCircle, AlertCircle, FileText, Tag, ArrowRightLeft, Plus, Trash2 } from 'lucide-react';

interface ReplacementItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  transactions: Transaction[];
  currentBranch: string;
  onConfirm: (
      productId: string, 
      quantity: number, 
      invoice: string, 
      refundAmount: number, 
      reason: string,
      replacement?: { items: ReplacementItem[], invoice: string }
  ) => Promise<void>;
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({ 
  isOpen, onClose, products, transactions, currentBranch, onConfirm 
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  
  // State to hold items belonging to the selected invoice
  const [invoiceItems, setInvoiceItems] = useState<Transaction[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Replacement Items State (Multiple)
  const [replacementCart, setReplacementCart] = useState<ReplacementItem[]>([]);
  const [repSearchTerm, setRepSearchTerm] = useState('');
  const [repQty, setRepQty] = useState(1);
  const [showRepDropdown, setShowRepDropdown] = useState(false);
  const [replacementInvoice, setReplacementInvoice] = useState('');
  
  // New: Pending selection state
  const [pendingReplacement, setPendingReplacement] = useState<Product | null>(null);

  // Store the specific price sold at for accurate refunds
  const [fixedUnitPrice, setFixedUnitPrice] = useState<number | null>(null);
  
  const [returnQty, setReturnQty] = useState(1);
  const [refundAmount, setRefundAmount] = useState(0);
  const [reason, setReason] = useState('Damaged Item');
  const [returnToStock, setReturnToStock] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setInvoiceNumber('');
      setShowInvoiceDropdown(false);
      setInvoiceItems([]);
      setSelectedProductId('');
      setProductSearchTerm('');
      
      setReplacementCart([]);
      setRepSearchTerm('');
      setRepQty(1);
      setReplacementInvoice('');
      setPendingReplacement(null);
      
      setFixedUnitPrice(null);
      setReturnQty(1);
      setRefundAmount(0);
      setReason('Damaged Item');
      setReturnToStock(true);
      setError('');
    }
  }, [isOpen]);

  // Adjust returnToStock based on reason for better UX
  useEffect(() => {
    if (reason === 'Damaged Item') {
        setReturnToStock(false);
    } else {
        setReturnToStock(true);
    }
  }, [reason]);

  const branchProducts = useMemo(() => {
      return products.filter(p => p && (p.branch === currentBranch || currentBranch === 'All Branches'));
  }, [products, currentBranch]);

  // Filter products for the dropdown (Return Item)
  const filteredProductOptions = useMemo(() => {
    const term = (productSearchTerm || '').toLowerCase();
    
    if (invoiceItems.length > 0) {
        return invoiceItems.filter(t => 
            (t.productName || '').toLowerCase().includes(term)
        ).map(t => ({
            type: 'history',
            id: t.productId,
            name: t.productName,
            sku: 'Sold in Invoice', // Visual helper
            price: t.price || 0,
            quantity: t.quantity || 0, // Sold Qty
            originalTransaction: t
        }));
    }

    return branchProducts.filter(p => 
        (p.name || '').toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term)
    ).map(p => ({
        type: 'product',
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price || 0,
        quantity: p.quantity || 0,
        originalTransaction: null
    }));
  }, [branchProducts, productSearchTerm, invoiceItems]);

  // Filter products for Replacement Dropdown (All products in branch)
  const filteredReplacementOptions = useMemo(() => {
      const term = (repSearchTerm || '').toLowerCase();
      if (!term) return [];
      return branchProducts.filter(p => 
          ((p.name || '').toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term))
      );
  }, [branchProducts, repSearchTerm]);

  // Extract unique invoices from transactions for autocomplete
  const filteredInvoices = useMemo(() => {
      const invoices = new Set<string>();
      const term = (invoiceNumber || '').toLowerCase();
      transactions.forEach(t => {
          if (t.type === 'OUT' && t.invoiceNumber) {
              if (!term || t.invoiceNumber.toLowerCase().includes(term)) {
                  invoices.add(t.invoiceNumber);
              }
          }
      });
      return Array.from(invoices).slice(0, 5); 
  }, [transactions, invoiceNumber]);

  const selectedProduct = branchProducts.find(p => p.id === selectedProductId);

  // Auto-set refund amount based on (Historical Price OR Current Price) * Qty
  useEffect(() => {
    const price = fixedUnitPrice !== null ? fixedUnitPrice : (selectedProduct?.price || 0);
    setRefundAmount(Number(((price || 0) * (returnQty || 0)).toFixed(2)));
  }, [selectedProduct, returnQty, fixedUnitPrice]);

  const handleSelectProduct = (option: any) => {
      setSelectedProductId(option.id);
      setProductSearchTerm(option.name);
      
      // If we selected a historical item, lock the price to what it was sold at
      if (option.type === 'history') {
          setFixedUnitPrice(option.price || 0);
      } else {
          setFixedUnitPrice(null); // Revert to current product price
      }
      
      setShowProductDropdown(false);
  };

  const handleSelectInvoice = (inv: string) => {
      setInvoiceNumber(inv);
      setShowInvoiceDropdown(false);
      
      // Find items in this invoice
      const items = transactions.filter(t => t.invoiceNumber === inv && t.type === 'OUT');
      setInvoiceItems(items);
      
      // Reset product field to encourage picking from the new list
      setSelectedProductId('');
      setProductSearchTerm('');
      setFixedUnitPrice(null);
      
      // Auto-show product dropdown to reveal invoice items
      if (items.length > 0) {
          setTimeout(() => setShowProductDropdown(true), 100);
      }
  };

  // Replacement Logic
  const handleSelectReplacement = (p: Product) => {
      setPendingReplacement(p);
      setRepSearchTerm(p.name);
      setShowRepDropdown(false);
  };

  const handleAddToCart = () => {
      if (!pendingReplacement) return;

      const existing = replacementCart.find(i => i.productId === pendingReplacement.id);
      if (existing) {
          setReplacementCart(replacementCart.map(i => i.productId === pendingReplacement.id ? { ...i, quantity: (i.quantity || 0) + (repQty || 0) } : i));
      } else {
          setReplacementCart([...replacementCart, {
              productId: pendingReplacement.id,
              name: pendingReplacement.name,
              price: pendingReplacement.price || 0,
              quantity: repQty || 0
          }]);
      }
      
      // Reset Selection
      setPendingReplacement(null);
      setRepSearchTerm('');
      setRepQty(1);
  };

  const handleRemoveReplacement = (id: string) => {
      setReplacementCart(replacementCart.filter(i => i.productId !== id));
  };

  const totalReplacementCost = replacementCart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  
  const netPayable = totalReplacementCost - refundAmount;

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!invoiceNumber || !selectedProductId) {
          setError("Please provide Invoice Number and Product.");
          return;
      }

      if (replacementCart.length > 0 && !replacementInvoice) {
          setError("Please provide a New SI # for the replacement items.");
          return;
      }

      if (reason === 'Change Item' && replacementCart.length === 0) {
          setError("Please add at least one Replacement Product for Change Item reason.");
          return;
      }
      
      setLoading(true);
      try {
          const replacementData = replacementCart.length > 0 ? {
              items: replacementCart,
              invoice: replacementInvoice
          } : undefined;

          await onConfirm(
              selectedProductId, 
              returnQty, 
              invoiceNumber, 
              refundAmount, 
              `${reason} (Restock: ${returnToStock ? 'Yes' : 'No'})`,
              replacementData
          );
          onClose();
      } catch (err: any) {
          setError(err.message || 'Failed to process return');
      } finally {
          setLoading(false);
      }
  };

  const showReplacementSection = reason === 'Change Item' || reason === 'Damaged Item';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-amber-50">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <RefreshCcw className="text-amber-600" /> Process Return
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
                <form id="return-form" onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Original Invoice (SI) # <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                required
                                type="text" 
                                placeholder="e.g., INV-2024-001"
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                                value={invoiceNumber}
                                onChange={(e) => {
                                    setInvoiceNumber(e.target.value);
                                    setShowInvoiceDropdown(true);
                                    if (invoiceItems.length > 0) setInvoiceItems([]);
                                }}
                                onFocus={() => setShowInvoiceDropdown(true)}
                                onBlur={() => setTimeout(() => setShowInvoiceDropdown(false), 200)}
                            />
                            {invoiceItems.length > 0 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-xs font-bold">
                                    <CheckCircle size={14} /> Found
                                </div>
                            )}
                        </div>
                        {showInvoiceDropdown && filteredInvoices.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {filteredInvoices.map(inv => (
                                    <div 
                                        key={inv} 
                                        className="px-4 py-2 hover:bg-amber-50 cursor-pointer border-b border-slate-50 font-mono text-sm text-slate-700"
                                        onMouseDown={() => handleSelectInvoice(inv)}
                                    >
                                        {inv}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Product <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder={invoiceItems.length > 0 ? "Select item from invoice..." : "Search product to return..."}
                                className={`w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none ${invoiceItems.length > 0 ? 'bg-amber-50/50' : 'bg-white'}`}
                                value={productSearchTerm}
                                onChange={(e) => {
                                    setProductSearchTerm(e.target.value);
                                    setShowProductDropdown(true);
                                    setSelectedProductId('');
                                }}
                                onFocus={() => setShowProductDropdown(true)}
                                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                            />
                        </div>
                        {showProductDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {invoiceItems.length > 0 && (
                                    <div className="px-3 py-1 bg-slate-100 text-xs font-bold text-slate-500 uppercase">
                                        Items in Invoice {invoiceNumber}
                                    </div>
                                )}
                                {filteredProductOptions.map((opt: any) => (
                                    <div 
                                        key={opt.id + (opt.type === 'history' ? '-hist' : '')} 
                                        className="px-4 py-2 hover:bg-amber-50 cursor-pointer border-b border-slate-50"
                                        onMouseDown={() => handleSelectProduct(opt)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="font-medium text-slate-800">{opt.name}</div>
                                            {opt.type === 'history' && (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    Sold: ₱{(opt.price || 0).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <div className="text-xs text-slate-500">{opt.sku}</div>
                                            {opt.type === 'history' && (
                                                <div className="text-xs text-slate-400">Qty Sold: {opt.quantity || 0}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {filteredProductOptions.length === 0 && (
                                    <div className="p-3 text-sm text-slate-400 text-center">No products found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                                value={returnQty}
                                onChange={(e) => setReturnQty(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Refund Amount (₱)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                min="0"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none text-red-600 font-medium"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Reason for Return</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="Damaged Item">Damaged / Defective</option>
                            <option value="Change Item">Change Item</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <input 
                            type="checkbox" 
                            id="returnStock"
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                            checked={returnToStock}
                            onChange={(e) => setReturnToStock(e.target.checked)}
                        />
                        <label htmlFor="returnStock" className="text-sm text-slate-700 cursor-pointer select-none">
                            <span className="font-bold">Return to Inventory?</span>
                            <span className="block text-xs text-slate-500">Uncheck if item is written off/disposed.</span>
                        </label>
                    </div>

                    {showReplacementSection && (
                        <div className="border-2 border-blue-400 bg-white p-4 rounded-lg mt-2 animate-fade-in space-y-4 relative shadow-sm">
                            <div className="flex gap-2 items-end">
                                <div className="relative flex-1">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Select Replacement <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="Search product..."
                                            className="w-full border border-blue-200 rounded-lg pl-3 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            value={repSearchTerm}
                                            onChange={(e) => {
                                                setRepSearchTerm(e.target.value);
                                                setShowRepDropdown(true);
                                                setPendingReplacement(null);
                                            }}
                                            onFocus={() => setShowRepDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowRepDropdown(false), 200)}
                                        />
                                        {showRepDropdown && filteredReplacementOptions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                                {filteredReplacementOptions.map(p => (
                                                    <div 
                                                        key={p.id} 
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-50"
                                                        onMouseDown={() => handleSelectReplacement(p)}
                                                    >
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-slate-800 text-sm">{p.name}</span>
                                                            <span className="text-xs font-bold text-slate-600">₱{(p.price || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-500">Stock: {p.quantity || 0}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-20">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Qty</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="w-full border border-blue-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={repQty}
                                        onChange={(e) => setRepQty(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={!pendingReplacement}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm font-bold"
                                    style={{ height: '38px' }}
                                >
                                    <Plus size={18} /> <span className="hidden sm:inline">Add</span>
                                </button>
                            </div>

                            {replacementCart.length > 0 && (
                                <div className="border border-blue-100 rounded-lg overflow-hidden bg-blue-50/30">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-blue-800 border-b border-blue-100">
                                            <tr>
                                                <th className="px-3 py-2">Item</th>
                                                <th className="px-3 py-2 text-center">Qty</th>
                                                <th className="px-3 py-2 text-right">Price</th>
                                                <th className="px-3 py-2 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-50">
                                            {replacementCart.map(item => (
                                                <tr key={item.productId} className="bg-white">
                                                    <td className="px-3 py-2 font-medium text-slate-700">{item.name}</td>
                                                    <td className="px-3 py-2 text-center text-slate-600">{item.quantity || 0}</td>
                                                    <td className="px-3 py-2 text-right text-slate-600">₱{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveReplacement(item.productId)}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-white font-bold text-slate-800 border-t border-blue-100">
                                            <tr>
                                                <td colSpan={2} className="px-3 py-2 text-right text-slate-600">Total Replacement:</td>
                                                <td className="px-3 py-2 text-right">₱{(totalReplacementCost || 0).toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-2">
                                <div className="text-sm font-bold text-slate-600">Net Balance:</div>
                                <div className={`text-lg font-bold ${netPayable > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {netPayable > 0 
                                        ? `Payable: ₱${(netPayable || 0).toFixed(2)}` 
                                        : `Refund: ₱${Math.abs(netPayable || 0).toFixed(2)}`
                                    }
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">New Invoice (SI) # <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="Enter new Sales Invoice number"
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-white"
                                    value={replacementInvoice}
                                    onChange={(e) => setReplacementInvoice(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                <button 
                    type="submit"
                    form="return-form" 
                    disabled={loading || !invoiceNumber || !selectedProductId}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-lg shadow-amber-200 disabled:opacity-50 font-bold flex items-center gap-2"
                >
                    {loading ? 'Processing...' : <><RefreshCcw size={18} /> Confirm Return</>}
                </button>
            </div>
        </div>
    </div>
  );
};