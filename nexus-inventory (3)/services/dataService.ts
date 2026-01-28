import { 
  Product, Transaction, MasterProduct, PurchaseOrder, User, 
  INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, DEFAULT_BRANCHES, DEFAULT_CATEGORIES 
} from '../types';
import { INITIAL_MASTER_PRODUCTS } from '../data/initialMasterData';

const KEYS = {
  PRODUCTS: 'nexus_products',
  TRANSACTIONS: 'nexus_transactions',
  BRANCHES: 'nexus_branches',
  CATEGORIES: 'nexus_categories',
  MASTERLIST: 'nexus_masterlist',
  POS: 'nexus_pos',
  USERS: 'nexus_users',
  NEXT_INVOICE: 'nexus_next_invoice_no'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dataService = {
  // Helpers
  getLocalStorage: <T>(key: string, defaultVal: T): T => {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultVal;
    try {
      return JSON.parse(stored);
    } catch {
      return defaultVal;
    }
  },

  broadcast: (event: string) => {
    window.dispatchEvent(new Event(event));
  },

  // Invoice Sequencing
  getNextInvoiceNo: (): string => {
    return localStorage.getItem(KEYS.NEXT_INVOICE) || '1001';
  },

  setNextInvoiceNo: (val: string) => {
    localStorage.setItem(KEYS.NEXT_INVOICE, val);
  },

  incrementInvoiceNo: (current: string): string => {
    const next = current.replace(/(\d+)(?=\D*$)/, (match) => {
      const num = parseInt(match, 10) + 1;
      return num.toString().padStart(match.length, '0');
    });
    const final = next === current ? current + "-1" : next;
    localStorage.setItem(KEYS.NEXT_INVOICE, final);
    return final;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    await delay(100);
    return dataService.getLocalStorage<User[]>(KEYS.USERS, []);
  },

  saveUser: async (user: User): Promise<void> => {
    await delay(300);
    const users = await dataService.getUsers();
    localStorage.setItem(KEYS.USERS, JSON.stringify([...users, user]));
  },

  // Getters
  getBranches: async (): Promise<string[]> => {
    await delay(100);
    return dataService.getLocalStorage(KEYS.BRANCHES, DEFAULT_BRANCHES);
  },

  getCategories: async (): Promise<string[]> => {
    await delay(100);
    const hardcodedCats = Array.from(new Set(INITIAL_MASTER_PRODUCTS.map(p => p.category)));
    const stored = dataService.getLocalStorage(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    const combined = Array.from(new Set([...stored, ...hardcodedCats]));
    return combined;
  },

  getProducts: async (): Promise<Product[]> => {
    await delay(100);
    return dataService.getLocalStorage(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  getTransactions: async (): Promise<Transaction[]> => {
    await delay(100);
    return dataService.getLocalStorage(KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  },

  getMasterProducts: async (): Promise<MasterProduct[]> => {
    await delay(100);
    const stored = dataService.getLocalStorage<MasterProduct[]>(KEYS.MASTERLIST, []);
    const storedSkus = new Set(stored.map(s => s.sku));
    const missingFromLocal = INITIAL_MASTER_PRODUCTS.filter(p => !storedSkus.has(p.sku));
    
    if (missingFromLocal.length > 0) {
        const updatedMasterList = [...stored, ...missingFromLocal];
        localStorage.setItem(KEYS.MASTERLIST, JSON.stringify(updatedMasterList));
        return updatedMasterList;
    }
    
    return stored.length > 0 ? stored : INITIAL_MASTER_PRODUCTS;
  },

  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    await delay(100);
    return dataService.getLocalStorage(KEYS.POS, []);
  },
  
  getRawDataForAI: (): string => {
    const products = localStorage.getItem(KEYS.PRODUCTS) || '[]';
    const pList = JSON.parse(products).map((p: Product) => `${p.name} (${p.quantity} units)`);
    return JSON.stringify(pList.slice(0, 100));
  },

  // State Modifiers
  addBranch: async (name: string): Promise<string[]> => {
      await delay(500);
      const branches = await dataService.getBranches();
      if (branches.includes(name)) throw new Error("Branch already exists");
      const updated = [...branches, name];
      localStorage.setItem(KEYS.BRANCHES, JSON.stringify(updated));
      dataService.broadcast('BRANCH_UPDATE');
      return updated;
  },

  updateBranch: async (oldName: string, newName: string): Promise<string[]> => {
    await delay(500); 
    const branches = await dataService.getBranches();
    const index = branches.indexOf(oldName);
    if (index === -1) throw new Error("Branch not found");
    
    const updatedBranches = [...branches];
    updatedBranches[index] = newName;
    localStorage.setItem(KEYS.BRANCHES, JSON.stringify(updatedBranches));

    const products = await dataService.getProducts();
    const updatedProducts = products.map(p => p.branch === oldName ? { ...p, branch: newName } : p);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updatedProducts));

    const transactions = await dataService.getTransactions();
    const updatedTransactions = transactions.map(t => t.branch === oldName ? { ...t, branch: newName } : t);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));

    dataService.broadcast('BRANCH_UPDATE');
    return updatedBranches;
  },

  deleteBranch: async (name: string): Promise<string[]> => {
    await delay(300);
    const branches = await dataService.getBranches();
    const updated = branches.filter(b => b !== name);
    localStorage.setItem(KEYS.BRANCHES, JSON.stringify(updated));
    dataService.broadcast('BRANCH_UPDATE');
    return updated;
  },

  addCategory: async (name: string): Promise<string[]> => {
      await delay(300);
      const categories = await dataService.getCategories();
      if (categories.includes(name)) throw new Error("Category already exists");
      const updated = [...categories, name];
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(updated));
      dataService.broadcast('CATEGORY_UPDATE');
      return updated;
  },

  updateCategory: async (oldName: string, newName: string): Promise<string[]> => {
      await delay(300);
      const categories = await dataService.getCategories();
      const index = categories.indexOf(oldName);
      if (index === -1) throw new Error("Category not found");
      const updated = [...categories];
      updated[index] = newName;
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(updated));

      const products = await dataService.getProducts();
      const updatedProducts = products.map(p => p.category === oldName ? { ...p, category: newName } : p);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      
      dataService.broadcast('CATEGORY_UPDATE');
      return updated;
  },

  deleteCategory: async (name: string): Promise<string[]> => {
      await delay(300);
      const categories = await dataService.getCategories();
      const updated = categories.filter(c => c !== name);
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(updated));
      dataService.broadcast('CATEGORY_UPDATE');
      return updated;
  },

  saveProduct: async (product: Product, damageQty: number = 0): Promise<Product> => {
      await delay(300);
      const products = await dataService.getProducts();
      const now = new Date().toISOString();
      let updatedProducts = [...products];
      let savedProduct;

      const existingIndex = products.findIndex(p => p.id === product.id);
      if (existingIndex >= 0) {
          const existingBatches = products[existingIndex].batches || [];
          updatedProducts[existingIndex] = { ...product, batches: existingBatches, lastUpdated: now };
          savedProduct = updatedProducts[existingIndex];
      } else {
          savedProduct = { ...product, id: Date.now().toString(), lastUpdated: now };
          if (savedProduct.quantity > 0) {
             savedProduct.batches = [{
                 id: `b-${Date.now()}`,
                 dateAdded: now,
                 quantity: savedProduct.quantity,
                 originalQuantity: savedProduct.quantity,
                 unitCost: savedProduct.cost
             }];
          } else {
             savedProduct.batches = [];
          }
          updatedProducts.push(savedProduct);

          // Handle initial damage creation if requested
          if (damageQty > 0) {
              const damagedProductName = `(DAMAGE) ${savedProduct.name}`;
              const damagedProduct: Product = {
                  ...savedProduct,
                  id: `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  name: damagedProductName,
                  sku: `${savedProduct.sku}-DMG`,
                  quantity: damageQty,
                  price: 0, // Damaged items usually have no price
                  lastUpdated: now,
                  batches: [{
                      id: `b-dmg-${Date.now()}`,
                      dateAdded: now,
                      quantity: damageQty,
                      originalQuantity: damageQty,
                      unitCost: savedProduct.cost
                  }]
              };
              updatedProducts.push(damagedProduct);
          }
      }
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      return savedProduct;
  },

  bulkSaveProducts: async (newProducts: Product[]): Promise<void> => {
      await delay(500);
      const products = await dataService.getProducts();
      const transactions = await dataService.getTransactions();
      const now = new Date().toISOString();

      const preparedProducts = newProducts.map(p => {
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
          return {
              ...p,
              id,
              lastUpdated: now,
              batches: p.quantity > 0 ? [{
                  id: `b-${id}`,
                  dateAdded: now,
                  quantity: p.quantity,
                  originalQuantity: p.quantity,
                  unitCost: p.cost
              }] : []
          };
      });

      const newTransactions: Transaction[] = preparedProducts.filter(p => p.quantity > 0).map(p => ({
          id: `tx-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: 'IN',
          quantity: p.quantity,
          date: now,
          user: 'Admin (Bulk)',
          branch: p.branch,
          unitCost: p.cost,
          totalCost: p.quantity * p.cost
      }));

      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([...products, ...preparedProducts]));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([...newTransactions, ...transactions]));
  },

  deleteProduct: async (id: string): Promise<void> => {
      await delay(300);
      const products = await dataService.getProducts();
      const updated = products.filter(p => p.id !== id);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updated));
  },

  recordTransaction: async (transaction: Transaction): Promise<void> => {
       const transactions = await dataService.getTransactions();
       const updated = [transaction, ...transactions];
       localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
  },

  recordBatchSale: async (items: any[], invoice: string, date: string, paymentMethod?: string, referenceNo?: string): Promise<void> => {
      await delay(500);
      const products = await dataService.getProducts();
      const transactions = await dataService.getTransactions();
      const newTransactions: Transaction[] = [];

      const updatedProducts = products.map(p => {
          const item = items.find((i: any) => i.productId === p.id);
          if (item) {
              p.quantity -= item.quantity;
              if (p.batches && p.batches.length > 0) {
                  p.batches.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
                  let qtyToDeduct = item.quantity;
                  for (const batch of p.batches) {
                       if (qtyToDeduct <= 0) break;
                       if (batch.quantity > 0) {
                           const take = Math.min(batch.quantity, qtyToDeduct);
                           batch.quantity -= take;
                           qtyToDeduct -= take;
                       }
                  }
              }
              newTransactions.push({
                  id: Date.now() + Math.random().toString(),
                  productId: p.id,
                  productName: p.name,
                  type: 'OUT',
                  quantity: item.quantity,
                  date: date,
                  user: 'Staff',
                  branch: p.branch,
                  unitCost: p.cost,
                  price: item.soldPrice,
                  totalCost: item.quantity * item.soldPrice,
                  invoiceNumber: invoice,
                  paymentMethod: paymentMethod,
                  referenceNo: referenceNo
              });
          }
          return p;
      });

      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([...newTransactions, ...transactions]));
  },

  recordSalesReturn: async (
      productId: string, 
      quantity: number, 
      invoiceNumber: string, 
      refundAmount: number, 
      reason: string,
      returnToInventory: boolean
  ): Promise<void> => {
      await delay(500);
      const products = await dataService.getProducts();
      const transactions = await dataService.getTransactions();
      const pIndex = products.findIndex(p => p.id === productId);
      if (pIndex === -1) throw new Error("Product not found");
      const originalProduct = products[pIndex];
      let updatedProducts = [...products];

      if (returnToInventory) {
          // If the reason is specific to damage, route it to the (DAMAGE) counterpart
          if (reason.toLowerCase().includes("damaged")) {
              const damagedProductName = `(DAMAGE) ${originalProduct.name}`;
              const dIndex = updatedProducts.findIndex(p => p.name === damagedProductName && p.branch === originalProduct.branch);
              
              if (dIndex !== -1) {
                  const damagedProduct = updatedProducts[dIndex];
                  damagedProduct.quantity += quantity;
                  if (!damagedProduct.batches) damagedProduct.batches = [];
                  damagedProduct.batches.push({
                      id: `ret-dmg-${Date.now()}`,
                      dateAdded: new Date().toISOString(),
                      quantity: quantity,
                      originalQuantity: quantity,
                      unitCost: originalProduct.cost
                  });
              } else {
                  const newDamagedProduct: Product = {
                      ...originalProduct,
                      id: `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      name: damagedProductName,
                      sku: `${originalProduct.sku}-DMG`,
                      quantity: quantity,
                      price: 0,
                      lastUpdated: new Date().toISOString(),
                      lastRestockDate: new Date().toISOString(),
                      lastRestockQuantity: quantity,
                      batches: [{
                          id: `b-dmg-${Date.now()}`,
                          dateAdded: new Date().toISOString(),
                          quantity: quantity,
                          originalQuantity: quantity,
                          unitCost: originalProduct.cost
                      }]
                  };
                  updatedProducts.push(newDamagedProduct);
              }
          } else {
              // Standard non-damage return (e.g. Change Item) goes back to main stock
              const product = updatedProducts[pIndex];
              product.quantity += quantity;
              if (!product.batches) product.batches = [];
              product.batches.push({
                  id: `ret-${Date.now()}`,
                  dateAdded: new Date().toISOString(),
                  quantity: quantity,
                  originalQuantity: quantity,
                  unitCost: product.cost
              });
          }
      }

      const returnTransaction: Transaction = {
          id: `ret-tx-${Date.now()}`,
          productId: originalProduct.id,
          productName: originalProduct.name,
          type: 'RETURN',
          quantity: quantity,
          date: new Date().toISOString(),
          user: 'Staff',
          branch: originalProduct.branch,
          unitCost: originalProduct.cost,
          totalCost: refundAmount,
          invoiceNumber: invoiceNumber,
          notes: reason
      };

      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([returnTransaction, ...transactions]));
  },

  deleteInvoice: async (invoiceNumber: string): Promise<void> => {
      await delay(300);
      const transactions = await dataService.getTransactions();
      const updated = transactions.filter(t => t.invoiceNumber !== invoiceNumber);
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
      dataService.broadcast('TRANSACTION_UPDATE');
  },

  createPurchaseOrder: async (po: any, user: User): Promise<PurchaseOrder> => {
      await delay(500);
      const pos = await dataService.getPurchaseOrders();
      const newPO = { ...po, id: Date.now().toString(), status: 'Pending Receipt' };
      localStorage.setItem(KEYS.POS, JSON.stringify([newPO, ...pos]));
      return newPO;
  },

  receivePurchaseOrderItems: async (poId: string, invoiceRef: string, items: any[], damagedItems: any[], user: User): Promise<void> => {
      await delay(500);
      const pos = await dataService.getPurchaseOrders();
      const poIndex = pos.findIndex(p => p.id === poId);
      if (poIndex === -1) throw new Error("PO not found");
      const po = pos[poIndex];
      items.forEach((item: any) => {
          const poItem = po.items.find(i => i.productId === item.productId);
          if (poItem) poItem.quantityReceived = (poItem.quantityReceived || 0) + item.quantity;
      });
      damagedItems.forEach((item: any) => {
          const poItem = po.items.find(i => i.productId === item.productId);
          if (poItem) poItem.quantityDamaged = (poItem.quantityDamaged || 0) + item.quantity;
      });
      const allReceived = po.items.every(i => (i.quantityReceived || 0) + (i.quantityDamaged || 0) >= i.quantityOrdered);
      po.status = allReceived ? 'Closed' : 'Partially Received';
      const updatedPOs = [...pos];
      updatedPOs[poIndex] = po;
      localStorage.setItem(KEYS.POS, JSON.stringify(updatedPOs));
      const products = await dataService.getProducts();
      let updatedProducts = [...products];

      // Process good items
      items.forEach((receivedItem: any) => {
          const pIndex = updatedProducts.findIndex(p => p.id === receivedItem.productId);
          if (pIndex !== -1) {
              const p = { ...updatedProducts[pIndex] };
              p.quantity += receivedItem.quantity;
              p.lastRestockDate = new Date().toISOString();
              p.lastRestockQuantity = receivedItem.quantity;
              const poItem = po.items.find(i => i.productId === p.id);
              const unitCost = poItem ? poItem.unitCost : p.cost;
              if (!p.batches) p.batches = [];
              p.batches.push({
                  id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  dateAdded: new Date().toISOString(),
                  quantity: receivedItem.quantity,
                  originalQuantity: receivedItem.quantity,
                  unitCost: unitCost
              });
              updatedProducts[pIndex] = p;
          }
      });

      // Process damaged items - adding to (DAMAGE) products
      damagedItems.forEach((damagedItem: any) => {
          const originalProduct = products.find(p => p.id === damagedItem.productId);
          if (originalProduct) {
              const damagedProductName = `(DAMAGE) ${originalProduct.name}`;
              const dIndex = updatedProducts.findIndex(p => p.name === damagedProductName && p.branch === originalProduct.branch);
              
              if (dIndex !== -1) {
                  const dp = { ...updatedProducts[dIndex] };
                  dp.quantity += damagedItem.quantity;
                  if (!dp.batches) dp.batches = [];
                  dp.batches.push({
                      id: `batch-dmg-${Date.now()}`,
                      dateAdded: new Date().toISOString(),
                      quantity: damagedItem.quantity,
                      originalQuantity: damagedItem.quantity,
                      unitCost: originalProduct.cost
                  });
                  updatedProducts[dIndex] = dp;
              } else {
                  const newDamagedProduct: Product = {
                      ...originalProduct,
                      id: `dmg-po-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      name: damagedProductName,
                      sku: `${originalProduct.sku}-DMG`,
                      quantity: damagedItem.quantity,
                      price: 0,
                      lastUpdated: new Date().toISOString(),
                      lastRestockDate: new Date().toISOString(),
                      lastRestockQuantity: damagedItem.quantity,
                      batches: [{
                          id: `b-dmg-po-${Date.now()}`,
                          dateAdded: new Date().toISOString(),
                          quantity: damagedItem.quantity,
                          originalQuantity: damagedItem.quantity,
                          unitCost: originalProduct.cost
                      }]
                  };
                  updatedProducts.push(newDamagedProduct);
              }
          }
      });

      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      const transactions = await dataService.getTransactions();
      const newTransactions = items.map((item: any) => {
          const p = products.find(prod => prod.id === item.productId);
          return {
              id: Date.now() + Math.random().toString(),
              productId: item.productId,
              productName: p?.name || 'Unknown',
              type: 'IN',
              quantity: item.quantity,
              date: new Date().toISOString(),
              user: user.name,
              branch: po.branch,
              unitCost: p?.cost || 0,
              totalCost: (p?.cost || 0) * item.quantity,
              invoiceNumber: invoiceRef
          } as Transaction;
      });
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([...newTransactions, ...transactions]));
  },

  saveMasterProduct: async (mp: MasterProduct): Promise<void> => {
      await delay(300);
      const list = await dataService.getMasterProducts();
      let updated;
      if (mp.id) {
          updated = list.map(item => item.id === mp.id ? mp : item);
      } else {
          updated = [...list, { ...mp, id: Date.now().toString(), lastUpdated: new Date().toISOString() }];
      }
      localStorage.setItem(KEYS.MASTERLIST, JSON.stringify(updated));
  },

  deleteMasterProduct: async (id: string): Promise<void> => {
      await delay(300);
      const list = await dataService.getMasterProducts();
      localStorage.setItem(KEYS.MASTERLIST, JSON.stringify(list.filter(i => i.id !== id)));
  }
};