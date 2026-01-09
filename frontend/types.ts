
// Define the structure for a category configuration
export interface CategoryConfig {
  name: string;
  unit: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number; // Unit depends on category config
  costPerUnit: number;
  minThreshold: number;
  batchNumber?: string;
  expiryDate?: string;
  vendorId: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadTime: number; // in days
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
}

export interface RecipeIngredient {
  oilId: string;
  amountMl: number;
}

export interface ProductPackaging {
  itemId: string;
  quantity: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  ingredients: RecipeIngredient[];
  packaging: ProductPackaging[];
  sellingPrice: number;
  totalCost: number;
  currentStock: number; // Items ready for sale
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  date: string;
  status: 'COMPLETED' | 'VOIDED';
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface Wastage {
  id: string;
  inventoryItemId: string;
  amount: number;
  reason: string;
  cost: number;
  date: string;
}

export interface PurchaseItem {
  inventoryItemId: string;
  quantity: number;
  costPerUnit: number;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  items: PurchaseItem[];
  totalAmount: number;
  date: string;
  referenceNumber: string;
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
}

export interface BusinessSettings {
  name: string;
  caption?: string;
  email: string;
  logoUrl?: string;
  categories: CategoryConfig[];
}
