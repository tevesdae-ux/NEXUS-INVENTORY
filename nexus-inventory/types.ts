export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface StockBatch {
  id: string;
  dateAdded: string; // ISO Date
  quantity: number;
  unitCost: number; // Cost per item in this batch
  originalQuantity: number; // To track history
}

export interface MasterProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  minLevel: number;
  cost: number;
  supplier: string;
  description: string;
  lastUpdated: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minLevel: number;
  price: number;
  cost: number; // This will now represent Weighted Average Cost or Current Valuation
  supplier: string;
  description: string;
  branch: string; 
  lastUpdated: string; 
  lastRestockDate?: string; 
  lastRestockQuantity?: number;
  batches?: StockBatch[]; // FIFO Layers
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'RETURN';
  quantity: number;
  date: string; 
  user: string;
  branch: string; 
  unitCost?: number; 
  totalCost?: number; 
  price?: number; 
  invoiceNumber?: string;
  notes?: string; 
  paymentMethod?: string;
  referenceNo?: string;
}

// --- Purchase Order Types ---

export type POStatus = 'Pending Receipt' | 'Partially Received' | 'Closed';

export interface POItem {
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityDamaged?: number; // Track damaged items separately
  unitCost: number;
  unit?: string;
}

export interface ReceivingRecord {
  id: string;
  dateReceived: string;
  invoiceReference: string;
  receivedBy: string;
  items: { productId: string; quantity: number }[]; // Good items
  damagedItems?: { productId: string; quantity: number; reason?: string }[]; // Damaged items
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: POStatus;
  supplier: string;
  branch: string;
  dateCreated: string;
  createdBy: string;
  preparedBy: string;
  notedBy: string;
  items: POItem[];
  notes?: string;
  receivingHistory: ReceivingRecord[];
}

export const DEFAULT_BRANCHES = ['Oslob', 'Dalaguete', 'Toledo','Danao','Kabankalan','Siquijor','Bogo'];

export const DEFAULT_CATEGORIES = [
  'Hardware', 
  'Electrical Supplies', 
  'Paints & Coatings', 
  'Plumbing', 
  'Tools', 
  'Machinery', 
  'Office Supplies', 
  'Construction', 
  'Safety Gear', 
  'Outdoor',
  'Plumbing Supplies'
];

// Initial Mock Data - Reset with actual hardware products from PDF OCR
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '(SMI) ADVANCE BARREL BOLT 1 1/2',
    sku: '2000042952600',
    category: 'Hardware',
    quantity: 120,
    minLevel: 10,
    price: 65.00,
    cost: 32.50,
    supplier: 'Advance',
    description: 'Heavy duty barrel bolt 1.5 inch.',
    branch: 'Oslob',
    lastUpdated: new Date().toISOString(),
    lastRestockDate: new Date().toISOString(), 
    lastRestockQuantity: 120,
    batches: [
      { id: 'b1', dateAdded: new Date().toISOString(), quantity: 120, unitCost: 32.50, originalQuantity: 120 }
    ]
  },
  {
    id: 'p2',
    name: '(SMI) ALPHA CHROMA ACRYLIC LATEX CON. PRIMER WHITE 16L',
    sku: '440516001594',
    category: 'Paints & Coatings',
    quantity: 15,
    minLevel: 5,
    price: 3450.00, 
    cost: 2150.00,
    supplier: 'Alpha Chroma',
    description: 'Premium acrylic latex primer 16L pail.',
    branch: 'Toledo',
    lastUpdated: new Date().toISOString(),
    lastRestockDate: new Date().toISOString(),
    lastRestockQuantity: 15,
    batches: [
      { id: 'b2', dateAdded: new Date().toISOString(), quantity: 15, unitCost: 2150.00, originalQuantity: 15 }
    ]
  },
  {
    id: 'p3',
    name: '(SMI) GREENFIELD ANGLE GRINDER 540W',
    sku: '2000810600016',
    category: 'Tools',
    quantity: 6, 
    minLevel: 5,
    price: 2850.00,
    cost: 1750.00,
    supplier: 'Greenfield',
    description: 'Powerful 540W angle grinder for DIY and professional use.',
    branch: 'Danao',
    lastUpdated: new Date().toISOString(),
    lastRestockDate: '2024-02-01T00:00:00.000Z', 
    lastRestockQuantity: 10,
    batches: [
      { id: 'b3', dateAdded: '2024-02-01T00:00:00.000Z', quantity: 6, unitCost: 1750.00, originalQuantity: 10 }
    ]
  },
  {
    id: 'p4',
    name: '(SMI) AEGIS AVR LC 500W',
    sku: '2000035528478',
    category: 'Electrical Supplies',
    quantity: 12,
    minLevel: 5,
    price: 1150.00,
    cost: 650.00,
    supplier: 'Aegis',
    description: 'Automatic Voltage Regulator 500W.',
    branch: 'Oslob',
    lastUpdated: new Date().toISOString(),
    lastRestockDate: new Date().toISOString(),
    lastRestockQuantity: 12,
    batches: [
       { id: 'b4', dateAdded: new Date().toISOString(), quantity: 12, unitCost: 650.00, originalQuantity: 12 }
    ]
  },
  {
    id: 'p5',
    name: '(SMI) PPR PIPE 1',
    sku: '2000787400116',
    category: 'Plumbing Supplies',
    quantity: 250,
    minLevel: 50,
    price: 345.00,
    cost: 195.00,
    supplier: 'General',
    description: 'High quality PPR pipe 1 inch.',
    branch: 'Dalaguete',
    lastUpdated: new Date().toISOString(),
    lastRestockDate: new Date().toISOString(),
    lastRestockQuantity: 250,
    batches: [
       { id: 'b5', dateAdded: new Date().toISOString(), quantity: 250, unitCost: 195.00, originalQuantity: 250 }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    productId: 'p1',
    productName: '(SMI) ADVANCE BARREL BOLT 1 1/2',
    type: 'IN',
    quantity: 120,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    user: 'Admin',
    branch: 'Oslob',
    unitCost: 32.50,
    totalCost: 3900.00
  },
  {
    id: 't2',
    productId: 'p2',
    productName: '(SMI) ALPHA CHROMA ACRYLIC LATEX CON. PRIMER WHITE 16L',
    type: 'OUT',
    quantity: 1,
    date: new Date(Date.now() - 86400000).toISOString(),
    user: 'Staff',
    branch: 'Toledo',
    unitCost: 2150.00,
    price: 3450.00,
    totalCost: 3450.00,
    invoiceNumber: 'SI-5001'
  }
];