import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { ShoppingCart, Plus, Trash2, Calendar, FileText, Search, AlertCircle, X, ShieldCheck, Lock } from 'lucide-react';

interface BatchSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[]; // Passed in filtered by branch
  currentBranch: string;
  onConfirm: (items: any[], invoice: string, date: string) => Promise<void>;
  preSelectedProduct?: Product | null;
}

interface CartItem {
  productId: string;
  name: string;
  maxQuantity: number;
  quantity: number;
  soldPrice: number;
  cost: number;
}

export const BatchSaleModal: React.FC<BatchSaleModalProps> = ({ 
  isOpen, onClose, products, currentBranch, onConfirm, preSelectedProduct 
}) => {
  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saleDate, setSaleDate] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Item Adding State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [priceToAdd, setPriceToAdd] = useState<number>(0);

  // Override State
  const ADMIN_OVERRIDE_CODE = "041411121621";
  const [overrideCode, setOverrideCode] = useState('');
  const [isOverrideAuthorized, setIsOverrideAuthorized] = useState(false);

  // Error/Loading State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setInvoiceNumber('');
      setCartItems([]);
      setError('');
      // Default to current local time
      const now = new Date();
      const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setSaleDate(localIso);
      
      setProductSearchTerm('');
      setSelectedProductId('');
      setShowDropdown(false);
      setIsOverrideAuthorized(false);
      setOverrideCode('');

      // Handle pre-selection
      if (preSelectedProduct) {
        setCartItems([{
            productId: preSelectedProduct.id,
            name: preSelectedProduct.name,
            maxQuantity: preSelectedProduct.quantity || 0,
            quantity: 1,
            soldPrice: preSelectedProduct.price || 0,
            cost: preSelectedProduct.cost || 0
        }]);
      }
    }
  }, [isOpen, preSelectedProduct]);

  // Reset override when product selection changes
  useEffect(() => {
      setIsOverrideAuthorized(false);
      setOverrideCode('');
      setError('');
  }, [selectedProductId]);

  // Filter out products already in cart
  const availableProducts = useMemo(() => {
    return products.filter(p => p && !cartItems.some(item => item.productId === p.id));
  }, [products, cartItems]);

  // Filter based on search term for the dropdown
  const filteredSearchProducts = useMemo(() => {
      const term = (productSearchTerm || '').toLowerCase();
      if (!term) return availableProducts;
      return availableProducts.filter(p => 
        (p.name || '').toLowerCase().includes(term) || 
        (p.sku || '').toLowerCase().includes(term)
      );
  }, [availableProducts, productSearchTerm]);

  const selectedProductObj = products.find(p => p.id === selectedProductId);

  // Calculate Margin Validation for UI Feedback
  const currentCost = selectedProductObj ? (selectedProductObj.cost || 0) : 0;
  // Margin = (Price - Cost) / Price >= 0.25 => Price >= Cost / 0.75
  const minPrice = currentCost > 0 ? currentCost / 0.75 : 0;
  const isPriceWarning = selectedProductObj && priceToAdd > 0 && priceToAdd < minPrice;

  // When selected product changes, update the default price
  useEffect(() => {
    if (selectedProductObj) {
        setPriceToAdd(selectedProductObj.price || 0);
        setQtyToAdd(1);
    } else {
        setPriceToAdd(0);
        setQtyToAdd(1);
    }
  }, [selectedProductId, selectedProductObj]);

  const handleOverrideCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const code = e.target.value;
      setOverrideCode(code);
      if (code === ADMIN_OVERRIDE_CODE) {
          setIsOverrideAuthorized(true);
          setOverrideCode(''); 
          setError('');
      }
  };

  if (!isOpen) return null;

  const handleSelectProduct = (product: Product) => {
      setSelectedProductId(product.id);
      setProductSearchTerm(product.name);
      setShowDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedProductId || !selectedProductObj) return;
    
    if (qtyToAdd > (selectedProductObj.quantity || 0)) {
        setError(`Insufficient stock for ${selectedProductObj.name}. Max: ${selectedProductObj.quantity || 0}`);
        return;
    }

    if (qtyToAdd <= 0) return;

    if (priceToAdd < minPrice && !isOverrideAuthorized) {
         setError(`Price too low. Authorization required.`);
         return;
    }

    setCartItems([...cartItems, {
        productId: selectedProductObj.id,
        name: selectedProductObj.name,
        maxQuantity: selectedProductObj.quantity || 0,
        quantity: qtyToAdd,
        soldPrice: priceToAdd,
        cost: selectedProductObj.cost || 0
    }]);

    // Reset selection & override state
    setSelectedProductId('');
    setProductSearchTerm('');
    setQtyToAdd(1);
    setPriceToAdd(0);
    setIsOverrideAuthorized(false);
    setOverrideCode('');
    setError('');
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(i => i.productId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !saleDate || cartItems.length === 0) {
        setError("Please fill in invoice details and add at least one item.");
        return;
    }

    setLoading(true);
    try {
        const dateObj = new Date(saleDate);
        await onConfirm(cartItems, invoiceNumber, dateObj.toISOString());
        onClose();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.soldPrice || 0)), 0);
  const totalProfit = cartItems.reduce((acc, item) => acc + ((item.quantity || 0) * ((item.soldPrice || 0) - (item.cost || 0))), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div>
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="text-blue-600" /> Record New Sale
             </h3>
             <p className="text-sm text-slate-500">Branch: <strong>{currentBranch}</strong></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Step 1: Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            required 
                            type="text" 
                            placeholder="e.g., INV-2024-001"
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            required 
                            type="datetime-local" 
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={saleDate}
                            onChange={(e) => setSaleDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Add Items */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Add Product to Invoice</h4>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    
                    {/* Searchable Product Input */}
                    <div className="flex-1 w-full relative">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Product</label>
                        <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                             <input 
                                type="text"
                                placeholder="Search products..."
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                value={productSearchTerm}
                                onChange={(e) => {
                                    setProductSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                    if(selectedProductId) setSelectedProductId('');
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                             />
                             {productSearchTerm && (
                                <button 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    onClick={() => {
                                        setProductSearchTerm('');
                                        setSelectedProductId('');
                                        setShowDropdown(false);
                                    }}
                                >
                                    <X size={16} />
                                </button>
                             )}
                        </div>
                        
                        {showDropdown && (
                            <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                                {filteredSearchProducts.length === 0 ? (
                                    <div className="p-4 text-sm text-slate-500 text-center">No matches found</div>
                                ) : (
                                    filteredSearchProducts.map(p => (
                                        <div 
                                            key={p.id} 
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                            onClick={() => handleSelectProduct(p)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                                                <span className="text-xs text-slate-400 font-mono">{p.sku}</span>
                                            </div>
                                             <div className="flex justify-between items-center text-[10px] font-black uppercase mt-1">
                                                <span className="text-slate-400">Price: ₱{(p.price || 0).toFixed(2)}</span>
                                                <span className={(p.quantity || 0) < 10 ? 'text-red-500' : 'text-slate-400'}>
                                                    Stock: {p.quantity || 0}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-28">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Qty</label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            value={qtyToAdd}
                            onChange={(e) => setQtyToAdd(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    
                    <div className="w-full md:w-40 relative">
                        <label className={`block text-[11px] font-bold mb-1 ${isPriceWarning && !isOverrideAuthorized ? 'text-red-600' : 'text-slate-500'}`}>
                            Price (Unit)
                        </label>
                        <input 
                            type="number" 
                            step="0.01"
                            className={`w-full border rounded-lg px-4 py-2.5 text-base font-bold focus:ring-2 outline-none transition-all shadow-sm ${
                                isPriceWarning && !isOverrideAuthorized
                                    ? 'border-red-400 focus:ring-red-400 text-red-600 bg-red-50/30' 
                                    : 'border-slate-300 focus:ring-blue-500'
                            }`}
                            value={priceToAdd}
                            onChange={(e) => setPriceToAdd(parseFloat(e.target.value) || 0)}
                        />
                        
                        {isPriceWarning && !isOverrideAuthorized && (
                            <div className="mt-1.5 animate-fade-in-up">
                                <p className="text-[10px] text-red-600 font-black uppercase mb-1">
                                    Min: ₱{(minPrice || 0).toFixed(2)} (25%)
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <input 
                                        type="password" 
                                        placeholder="Code"
                                        className="w-full border border-blue-200 rounded px-2 py-1 text-[11px] font-black focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                        value={overrideCode}
                                        onChange={handleOverrideCodeChange}
                                    />
                                    <X size={14} className="text-slate-300 cursor-pointer" onClick={() => setPriceToAdd(selectedProductObj?.price || 0)} />
                                </div>
                            </div>
                        )}
                        
                        {isPriceWarning && isOverrideAuthorized && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-black uppercase">
                                <ShieldCheck size={12} />
                                <span>Authorized</span>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleAddItem}
                        disabled={!selectedProductId}
                        className="w-full md:w-auto mt-[18px] px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-black transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <Plus size={20} /> Add
                    </button>
                </div>
                {selectedProductObj && (
                    <div className="mt-4 flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <div className="flex items-center gap-1.5">
                            Available Stock: <span className={(selectedProductObj.quantity || 0) < 10 ? 'text-red-500' : 'text-slate-800'}>{selectedProductObj.quantity || 0}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center gap-1.5">
                            Current FIFO Cost: <span className="text-slate-800">₱{(selectedProductObj.cost || 0).toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 3: Cart List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4 text-center">Qty</th>
                            <th className="px-6 py-4 text-right">Unit Price</th>
                            <th className="px-6 py-4 text-right">Subtotal</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cartItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                                    No items added to invoice yet.
                                </td>
                            </tr>
                        )}
                        {cartItems.map((item) => (
                            <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                                <td className="px-6 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                                <td className="px-6 py-4 text-right font-medium text-slate-600">₱{(item.soldPrice || 0).toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-black text-slate-900">₱{((item.quantity || 0) * (item.soldPrice || 0)).toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleRemoveItem(item.productId)}
                                        className="text-slate-300 hover:text-red-500 p-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {cartItems.length > 0 && (
                         <tfoot className="bg-slate-50 font-black border-t border-slate-200">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-[10px] uppercase text-slate-500 tracking-widest">Total Invoice Amount:</td>
                                <td className="px-6 py-4 text-right text-xl text-slate-900 tracking-tighter">₱{(totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100 animate-shake">
                    <AlertCircle size={20} />
                    <span className="uppercase">{error}</span>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-white rounded-b-xl flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-all">Cancel</button>
            <button 
                onClick={handleSubmit} 
                disabled={loading || cartItems.length === 0}
                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-black uppercase text-sm tracking-wider"
            >
                {loading ? 'Processing...' : <><ShoppingCart size={18} /> Confirm Sale</>}
            </button>
        </div>

      </div>
    </div>
  );
};