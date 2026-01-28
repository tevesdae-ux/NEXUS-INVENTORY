import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, Product, Transaction, MasterProduct, PurchaseOrder, UserRole 
} from './types';
import { 
  LayoutDashboard, Package, Truck, ShoppingCart, LogOut, 
  Building2, Settings, Tag, Sparkles, Plus, ArrowLeft, Box, ClipboardList,
  Lock, Eye, EyeOff, ArrowRight, UserPlus, CreditCard, RefreshCcw, Layers, ChevronDown,
  Github, Chrome
} from 'lucide-react';
import { dataService } from './services/dataService';
import { Dashboard } from './components/Dashboard';
import { InventoryTable } from './components/InventoryTable';
import { SalesHistory } from './components/SalesHistory';
import { ProductModal } from './components/ProductModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { AddStockModal } from './components/AddStockModal';
import { BranchManagement } from './components/BranchManagement';
import { CategoryManagement } from './components/CategoryManagement';
import { AIAssistant } from './components/AIAssistant';
import { Masterlist } from './components/Masterlist';
import { PurchaseOrderManagement } from './components/PurchaseOrderManagement';
import { SalesReturnModal } from './components/SalesReturnModal';
import { BatchSaleModal } from './components/BatchSaleModal';
import { POS } from './components/POS';
import { BulkAddModal } from './components/BulkAddModal';

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded shadow-lg text-white border border-white/20 animate-fade-in ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {message}
    </div>
  );
};

const AuthView = ({ onLogin, onRegister, loading }: any) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STAFF);
  const [regPassword, setRegPassword] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (isRegister) {
          if (!regUsername || !fullName || !regPassword || !confirmPassword) {
              setError("All fields are required");
              return;
          }
          if (regPassword.length < 6) {
              setError("Password must be at least 6 characters");
              return;
          }
          if (regPassword !== confirmPassword) {
              setError("Passwords do not match");
              return;
          }
          try {
            await onRegister({ username: regUsername, name: fullName, role, password: regPassword, id: Date.now().toString() });
            setIsRegister(false); 
          } catch (err: any) {
            setError(err.message);
          }
      } else {
          if (!loginUsername || !loginPassword) {
              setError("Please enter username and password");
              return;
          }
          try {
            await onLogin(loginUsername, loginPassword);
          } catch (err: any) {
            setError(err.message);
          }
      }
  };

  const handleOAuthMock = (provider: string) => {
      setError(`${provider} login is currently in simulation mode. Please use the form to Create an Account first.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[450px] overflow-hidden relative z-10 border border-slate-200">
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-lg shadow-blue-200">N</div>
           <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Nexus Inventory</h1>
           <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Enterprise Portal</p>
        </div>

        <div className="p-8">
           {isRegister ? (
               <div className="animate-fade-in">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <UserPlus size={20} />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800">Create Account</h2>
                   </div>
                   <form onSubmit={handleSubmit} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                               <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
                           </div>
                           <div className="col-span-2">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                               <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium" placeholder="johndoe123" value={regUsername} onChange={e => setRegUsername(e.target.value)} />
                           </div>
                       </div>
                       
                       <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Access Level</label>
                           <div className="flex bg-slate-50 p-1.5 rounded-xl border-2 border-slate-100">
                               <button type="button" onClick={() => setRole(UserRole.STAFF)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${role === UserRole.STAFF ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Staff</button>
                               <button type="button" onClick={() => setRole(UserRole.ADMIN)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${role === UserRole.ADMIN ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Admin</button>
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                               <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium" type="password" placeholder="••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                           </div>
                           <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm</label>
                               <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium" type="password" placeholder="••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                           </div>
                       </div>

                       {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">{error}</p>}
                       
                       <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-blue-200 active:scale-95" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Register Account'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                   </form>
                   <div className="mt-6 text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Already have an account? <button type="button" className="text-blue-600 hover:underline" onClick={() => { setIsRegister(false); setError(''); }}>Sign In</button></p>
                   </div>
               </div>
           ) : (
               <div className="animate-fade-in">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Lock size={20} />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800">Secure Sign In</h2>
                   </div>
                   <form onSubmit={handleSubmit} className="space-y-5">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                          <input className="w-full border-2 border-slate-100 bg-white rounded-xl px-4 py-3.5 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-bold" placeholder="Username" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
                      </div>
                      <div>
                          <div className="flex justify-between items-center mb-1.5 ml-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                            <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">Forgot?</button>
                          </div>
                          <div className="relative">
                            <input className="w-full border-2 border-slate-100 bg-white rounded-xl px-4 py-3.5 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all pr-12 placeholder:text-slate-300 font-bold" type={showPassword ? "text" : "password"} placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                          </div>
                      </div>
                      
                      {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">{error}</p>}
                      
                      <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-2 shadow-xl shadow-slate-200 active:scale-95" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                        {!loading && <ArrowRight size={18} />}
                      </button>

                      <div className="relative my-8">
                         <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                         <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 bg-white px-4">Or continue with</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <button type="button" onClick={() => handleOAuthMock('Google')} className="flex items-center justify-center gap-2 border-2 border-slate-100 py-3 rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600">
                            <Chrome size={16} className="text-red-500" /> Google
                         </button>
                         <button type="button" onClick={() => handleOAuthMock('GitHub')} className="flex items-center justify-center gap-2 border-2 border-slate-100 py-3 rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600">
                            <Github size={16} /> GitHub
                         </button>
                      </div>
                   </form>
                   <div className="mt-8 text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Don't have an account? <button type="button" className="text-blue-600 hover:underline" onClick={() => { setIsRegister(true); setError(''); }}>Create Account</button></p>
                   </div>
               </div>
           )}
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
        Secure Infrastructure Layer • v2.4.0
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'supply_chain' | 'sales' | 'pos'>('dashboard');
  const [supplyChainSubView, setSupplyChainSubView] = useState<'masterlist' | 'purchases' | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  const [currentBranch, setCurrentBranch] = useState<string>('All Branches');
  const [showLowStockFilter, setShowLowStockFilter] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isSalesReturnOpen, setIsSalesReturnOpen] = useState(false);
  const [isBatchSaleOpen, setIsBatchSaleOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  
  const [isBranchManagerOpen, setIsBranchManagerOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshData = async () => {
    const [p, t, b, c, mp, pos] = await Promise.all([
      dataService.getProducts(),
      dataService.getTransactions(),
      dataService.getBranches(),
      dataService.getCategories(),
      dataService.getMasterProducts(),
      dataService.getPurchaseOrders()
    ]);
    setProducts(p);
    setTransactions(t);
    setBranches(b);
    setCategories(c);
    setMasterProducts(mp);
    setPurchaseOrders(pos);
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    const existingUsers = await dataService.getUsers();
    const foundUser = existingUsers.find(u => u.username === username && u.password === password);
    setLoading(false);

    if (foundUser) {
      setUser(foundUser);
      setToast({ message: `Welcome back, ${foundUser.name}`, type: 'success' });
    } else {
      throw new Error("No matching account found. Please check your credentials or Create an Account.");
    }
  };

  const handleRegister = async (userData: User) => {
    setLoading(true);
    const existingUsers = await dataService.getUsers();
    if (existingUsers.some(u => u.username === userData.username)) {
      setLoading(false);
      throw new Error("This username is already taken. Please choose another.");
    }
    await dataService.saveUser(userData);
    await refreshData();
    setLoading(false);
    setToast({ message: "Registration successful! You can now sign in.", type: 'success' });
  };

  const handleLogout = () => { setUser(null); setView('dashboard'); };

  const filteredProducts = useMemo(() => {
      return currentBranch === 'All Branches' 
          ? products 
          : products.filter(p => p.branch === currentBranch);
  }, [products, currentBranch]);

  const filteredTransactions = useMemo(() => {
      return currentBranch === 'All Branches' 
          ? transactions 
          : transactions.filter(t => t.branch === currentBranch);
  }, [transactions, currentBranch]);

  const filteredPOs = useMemo(() => {
      return currentBranch === 'All Branches'
        ? purchaseOrders
        : purchaseOrders.filter(po => po.branch === currentBranch);
  }, [purchaseOrders, currentBranch]);

  const handleSaveProduct = async (p: Product, damageQty: number = 0) => {
      await dataService.saveProduct(p, damageQty);
      await refreshData();
      setToast({ message: "Product saved successfully", type: 'success' });
  };

  const handleBulkAdd = async (newProducts: Product[]) => {
      await dataService.bulkSaveProducts(newProducts);
      await refreshData();
      setToast({ message: `${newProducts.length} products added successfully`, type: 'success' });
  };

  const handleDeleteProduct = async (id: string) => {
      if (confirm('Delete this product?')) {
          await dataService.deleteProduct(id);
          await refreshData();
          setToast({ message: "Product deleted", type: 'success' });
      }
  };

  const handleAddStockConfirm = async (qty: number, cost: number) => {
      if (viewingProduct) {
          const products = await dataService.getProducts();
          const pIndex = products.findIndex(p => p.id === viewingProduct.id);
          if (pIndex !== -1) {
              const p = products[pIndex];
              p.quantity += qty;
              p.lastRestockDate = new Date().toISOString();
              p.lastRestockQuantity = qty;
              if (!p.batches) p.batches = [];
              p.batches.push({
                  id: `manual-${Date.now()}`,
                  dateAdded: new Date().toISOString(),
                  quantity: qty,
                  originalQuantity: qty,
                  unitCost: cost
              });
              await dataService.saveProduct(p);
              
              await dataService.recordTransaction({
                  id: `tx-${Date.now()}`,
                  productId: p.id,
                  productName: p.name,
                  type: 'IN',
                  quantity: qty,
                  date: new Date().toISOString(),
                  user: user?.name || 'Admin',
                  branch: p.branch,
                  unitCost: cost,
                  totalCost: qty * cost
              });
              
              await refreshData();
              setToast({ message: "Stock added successfully", type: 'success' });
              setIsAddStockOpen(false);
          }
      }
  };

  const handleBatchSaleConfirm = async (items: any[], invoice: string, date: string, paymentMethod?: string, referenceNo?: string) => {
      await dataService.recordBatchSale(items, invoice, date, paymentMethod, referenceNo);
      await refreshData();
      setToast({ message: "Sale recorded successfully", type: 'success' });
  };

  const handleSalesReturnConfirm = async (
      productId: string, 
      quantity: number, 
      invoice: string, 
      refundAmount: number, 
      reason: string,
      replacement?: { items: any[], invoice: string }
  ) => {
      const shouldRestock = reason.includes("Restock: Yes");
      await dataService.recordSalesReturn(productId, quantity, invoice, refundAmount, reason, shouldRestock);
      if (replacement && replacement.items.length > 0) {
          const itemsToSell = replacement.items.map(item => ({
                 productId: item.productId,
                 quantity: item.quantity,
                 soldPrice: item.price,
                 cost: products.find(p => p.id === item.productId)?.cost || 0
          }));
          await dataService.recordBatchSale(itemsToSell, replacement.invoice, new Date().toISOString());
      }
      await refreshData();
      setToast({ message: "Return processed successfully", type: 'success' });
  };

  const handleDeleteInvoice = async (invoiceNo: string) => {
    await dataService.deleteInvoice(invoiceNo);
    await refreshData();
    setToast({ message: `Invoice ${invoiceNo} deleted`, type: 'success' });
  };

  const handleAddBranch = async (name: string) => {
    await dataService.addBranch(name);
    await refreshData();
    setToast({ message: `Branch "${name}" added`, type: 'success' });
  };

  const handleUpdateBranch = async (oldName: string, newName: string) => {
    await dataService.updateBranch(oldName, newName);
    if (currentBranch === oldName) setCurrentBranch(newName);
    await refreshData();
    setToast({ message: "Branch updated", type: 'success' });
  };

  const handleDeleteBranch = async (name: string) => {
    await dataService.deleteBranch(name);
    if (currentBranch === name) setCurrentBranch('All Branches');
    await refreshData();
    setToast({ message: "Branch deleted", type: 'success' });
  };

  const handleAddCategory = async (name: string) => {
    await dataService.addCategory(name);
    await refreshData();
    setToast({ message: `Category "${name}" added`, type: 'success' });
  };

  const handleUpdateCategory = async (oldName: string, newName: string) => {
    await dataService.updateCategory(oldName, newName);
    await refreshData();
    setToast({ message: "Category updated", type: 'success' });
  };

  const handleDeleteCategory = async (name: string) => {
    await dataService.deleteCategory(name);
    await refreshData();
    setToast({ message: "Category deleted", type: 'success' });
  };

  const handleCreatePO = async (po: any) => {
      if(user) {
          const newPO = await dataService.createPurchaseOrder(po, user);
          await refreshData();
          setToast({ message: "Purchase Order created", type: 'success' });
          return newPO;
      }
  }

  const handleReceivePO = async (poId: string, invoiceRef: string, items: any[], damagedItems: any[]) => {
      if (user) {
          await dataService.receivePurchaseOrderItems(poId, invoiceRef, items, damagedItems, user);
          await refreshData();
          setToast({ message: "Items processed", type: 'success' });
      }
  }

  const handleAddMasterProduct = async (mp: MasterProduct) => {
      await dataService.saveMasterProduct(mp);
      await refreshData();
      setToast({ message: "Template added to Masterlist", type: 'success' });
  };

  const handleEditMasterProduct = async (mp: MasterProduct) => {
      await dataService.saveMasterProduct(mp);
      await refreshData();
      setToast({ message: "Masterlist template updated", type: 'success' });
  };

  const handleDeleteMasterProduct = async (id: string) => {
      await dataService.deleteMasterProduct(id);
      await refreshData();
      setToast({ message: "Template removed from Masterlist", type: 'success' });
  };
  
  if (!user) {
    return <AuthView onLogin={handleLogin} onRegister={handleRegister} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col fixed h-full z-20 transition-all duration-300 print:hidden">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">N</div>
          <span className="ml-3 font-bold text-white text-lg hidden lg:block">Nexus Inventory</span>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-3">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} />
            <span className="hidden lg:block font-medium">Dashboard</span>
          </button>
          
          <button onClick={() => setView('pos')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${view === 'pos' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800'}`}>
            <CreditCard size={20} />
            <span className="hidden lg:block font-medium">Checkout (POS)</span>
          </button>

          <button onClick={() => setView('inventory')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${view === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}>
            <Package size={20} />
            <span className="hidden lg:block font-medium">Inventory</span>
          </button>
          <button onClick={() => setView('supply_chain')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${view === 'supply_chain' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}>
            <Truck size={20} />
            <span className="hidden lg:block font-medium">Supply Chain</span>
          </button>
          <button onClick={() => setView('sales')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${view === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}>
            <ShoppingCart size={20} />
            <span className="hidden lg:block font-medium">Daily Sales Log</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">{user.username.charAt(0)}</div>
            <div className="hidden lg:block min-w-0 flex-1">
              <p className="text-sm text-white font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize font-black uppercase tracking-tighter">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-2">
            <LogOut size={18} />
            <span className="hidden lg:block text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex justify-between px-6 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={24} /><span className="text-[10px] font-medium">Home</span></button>
        <button onClick={() => setView('pos')} className={`flex flex-col items-center gap-1 ${view === 'pos' ? 'text-emerald-600' : 'text-slate-400'}`}><CreditCard size={24} /><span className="text-[10px] font-medium">POS</span></button>
        <button onClick={() => setView('inventory')} className={`flex flex-col items-center gap-1 ${view === 'inventory' ? 'text-blue-600' : 'text-slate-400'}`}><Package size={24} /><span className="text-[10px] font-medium">Stock</span></button>
        <button onClick={() => setView('sales')} className={`flex flex-col items-center gap-1 ${view === 'sales' ? 'text-blue-600' : 'text-slate-400'}`}><ShoppingCart size={24} /><span className="text-[10px] font-medium">Sales</span></button>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-slate-400"><LogOut size={24} /><span className="text-[10px] font-medium">Logout</span></button>
      </nav>

      <main className={`flex-1 ml-0 md:ml-20 lg:ml-64 ${view === 'pos' ? 'p-0' : 'p-4 lg:p-8'} min-h-screen pb-24 md:pb-8 print:ml-0 print:p-0 print:bg-white transition-all duration-300`}>
        {view !== 'pos' && view !== 'sales' && (
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
            <div className="flex w-full md:w-auto justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {view === 'supply_chain' ? 'Supply Chain' : view}
                    </h1>
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-200">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                        <span className="hidden sm:inline">System Active</span>
                    </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <div className="flex items-center gap-2 flex-1 md:flex-none">
                  <div className="relative flex-1 md:flex-none">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <select value={currentBranch} onChange={(e) => setCurrentBranch(e.target.value)} className="w-full md:w-auto pl-10 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer font-bold">
                          {branches.map(b => <option key={b} value={b}>{b}</option>)}
                          <option value="All Branches">All Branches</option>
                      </select>
                  </div>
              </div>
              
              {view === 'inventory' && (
                <div className="flex gap-2 w-full md:w-auto relative" ref={addMenuRef}>
                  <div className="flex-1 md:flex-none flex items-stretch">
                    <button 
                      onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 font-black transition-all active:scale-95 border-r border-blue-500/50"
                    >
                      <Plus size={18} /> New Product
                    </button>
                    <button 
                      onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                      className="px-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all border-l border-blue-500/50"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  
                  {isAddMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 py-2 animate-fade-in-up">
                       <button 
                          onClick={() => { setIsBulkAddOpen(true); setIsAddMenuOpen(false); }} 
                          className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                       >
                         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <Layers size={16} />
                         </div>
                         <span>Batch Add from Master</span>
                       </button>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setIsAIChatOpen(!isAIChatOpen)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"><Sparkles size={18} />AI Assistant</button>
            </div>
          </header>
        )}

        {view === 'dashboard' && <Dashboard products={filteredProducts} transactions={filteredTransactions} onViewLowStock={() => { setShowLowStockFilter(true); setView('inventory'); }} />}
        {view === 'pos' && (
            <POS 
                products={filteredProducts} 
                currentBranch={currentBranch === 'All Branches' ? (branches[0] || 'Default') : currentBranch} 
                onConfirm={handleBatchSaleConfirm} 
            />
        )}
        {view === 'inventory' && (
          <InventoryTable 
            products={filteredProducts} 
            role={user.role} 
            onEdit={(p) => { setEditingProduct(p); setIsModalOpen(true); }} 
            onDelete={handleDeleteProduct} 
            onViewDetails={(p) => { setViewingProduct(p); setIsDetailsOpen(true); }} 
            onAddStock={(p) => { setViewingProduct(p); setIsAddStockOpen(true); }}
            highlightedProductId={highlightedProductId} 
            categories={categories} 
            currentBranch={currentBranch} 
            showLowStockOnly={showLowStockFilter} 
            setShowLowStockOnly={setShowLowStockFilter} 
          />
        )}
        {view === 'supply_chain' && (
            <div className="h-full flex flex-col">
                {supplyChainSubView === null ? (
                    <div className="flex flex-col items-center justify-center flex-1 p-8 animate-fade-in">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-8">Supply Chain Management</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                            <button onClick={() => setSupplyChainSubView('masterlist')} className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-purple-300 transition-all group text-left flex flex-col h-full"><div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Box size={24} /></div><h3 className="text-xl font-black text-slate-800 uppercase mb-2">Masterlist</h3><p className="text-slate-500 text-sm font-medium">Manage global product templates for all store locations.</p></button>
                            <button onClick={() => setSupplyChainSubView('purchases')} className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group text-left flex flex-col h-full"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ClipboardList size={24} /></div><h3 className="text-xl font-black text-slate-800 uppercase mb-2">Purchase Orders</h3><p className="text-slate-500 text-sm font-medium">Track supplier orders, logistics, and incoming branch inventory.</p></button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full animate-fade-in p-4 sm:p-0">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setSupplyChainSubView(null)} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors"><ArrowLeft size={16} /> Back</button>
                            <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                <button onClick={() => setSupplyChainSubView('masterlist')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md transition-all ${supplyChainSubView === 'masterlist' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Masterlist</button>
                                <button onClick={() => setSupplyChainSubView('purchases')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md transition-all ${supplyChainSubView === 'purchases' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Purchase Orders</button>
                            </div>
                        </div>
                        {supplyChainSubView === 'masterlist' && <Masterlist masterProducts={masterProducts} categories={categories} onAdd={handleAddMasterProduct} onEdit={handleEditMasterProduct} onDelete={handleDeleteMasterProduct} />}
                        {supplyChainSubView === 'purchases' && <PurchaseOrderManagement purchaseOrders={filteredPOs} products={filteredProducts} masterProducts={masterProducts} currentUser={user} branches={branches} onCreatePO={handleCreatePO} onReceivePO={handleReceivePO} />}
                    </div>
                )}
            </div>
        )}
        {view === 'sales' && (
          <SalesHistory 
            transactions={filteredTransactions} 
            branchName={currentBranch} 
            onOpenReturn={() => setIsSalesReturnOpen(true)} 
            onOpenRecordSale={() => setIsBatchSaleOpen(true)}
            onOpenAIAssistant={() => setIsAIChatOpen(true)}
            onDeleteInvoice={handleDeleteInvoice} 
            branches={branches}
            currentBranch={currentBranch}
            onBranchChange={setCurrentBranch}
          />
        )}
      </main>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={editingProduct} onSave={handleSaveProduct} currentBranch={currentBranch} branches={branches} categories={categories} masterProducts={masterProducts} />
      <ProductDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} product={viewingProduct} />
      <AddStockModal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} product={viewingProduct} onConfirm={handleAddStockConfirm} />
      <BatchSaleModal isOpen={isBatchSaleOpen} onClose={() => setIsBatchSaleOpen(false)} products={filteredProducts} currentBranch={currentBranch} onConfirm={handleBatchSaleConfirm} />
      <SalesReturnModal isOpen={isSalesReturnOpen} onClose={() => setIsSalesReturnOpen(false)} products={filteredProducts} transactions={filteredTransactions} currentBranch={currentBranch} onConfirm={handleSalesReturnConfirm} />
      <BulkAddModal isOpen={isBulkAddOpen} onClose={() => setIsBulkAddOpen(false)} masterProducts={masterProducts} branches={branches} currentBranch={currentBranch} onConfirm={handleBulkAdd} />
      <BranchManagement isOpen={isBranchManagerOpen} onClose={() => setIsBranchManagerOpen(false)} branches={branches} onAddBranch={handleAddBranch} onUpdateBranch={handleUpdateBranch} onDeleteBranch={handleDeleteBranch} />
      <CategoryManagement isOpen={isCategoryManagerOpen} onClose={() => setIsCategoryManagerOpen(false)} categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />
      <div className="print:hidden"><AIAssistant isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} /></div>
      {!isAIChatOpen && view !== 'pos' && <button onClick={() => setIsAIChatOpen(true)} className="fixed bottom-24 right-4 md:bottom-6 md:right-6 p-4 bg-indigo-600 text-white rounded-full shadow-xl z-40 md:hidden hover:bg-indigo-700 print:hidden transition-all active:scale-95"><Sparkles size={24} /></button>}
    </div>
  );
}
