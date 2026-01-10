import {
  InventoryItem, Product, Sale, Vendor, Customer, Expense, Wastage,
  User, BusinessSettings, PurchaseOrder
} from '../types.ts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken) this.token = savedToken;
    if (savedUser) this.user = JSON.parse(savedUser);
  }

  private getHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || res.statusText);
    }

    // Handle 204 No Content
    if (res.status === 204) return {} as T;

    return res.json();
  }

  // --- AUTH ---
  login = async (email: string, pass: string): Promise<User | null> => {
    try {
      const data = await this.fetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      this.token = data.token;
      this.user = { id: data._id, email: data.email, role: data.role, name: data.name };

      localStorage.setItem('token', this.token || '');
      localStorage.setItem('user', JSON.stringify(this.user));

      return this.user;
    } catch (error) {
      console.error('Login failed', error);
      return null;
    }
  }

  logout = () => {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // --- INVENTORY ---
  getInventory = async () => this.fetch<InventoryItem[]>('/inventory');

  addInventory = async (item: Omit<InventoryItem, 'id'>) => {
    // Backend handles IDs, so we just send the item
    // Frontend expects the item back with ID
    return this.fetch<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  updateInventory = async (id: string, updates: Partial<InventoryItem>) => {
    await this.fetch(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  deleteInventory = async (id: string) => {
    await this.fetch(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // --- VENDORS ---
  getVendors = async () => this.fetch<Vendor[]>('/vendors');

  addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    return this.fetch<Vendor>('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
  }

  updateVendor = async (id: string, updates: Partial<Vendor>) => {
    await this.fetch(`/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  deleteVendor = async (id: string) => {
    await this.fetch(`/vendors/${id}`, {
      method: 'DELETE',
    });
  }

  // --- PRODUCTS (THE LAB) ---
  getProducts = async () => this.fetch<Product[]>('/products');

  addProduct = async (product: Omit<Product, 'id' | 'currentStock'>) => {
    return this.fetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  updateProduct = async (id: string, updates: Partial<Product>) => {
    await this.fetch(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  deleteProduct = async (id: string) => {
    await this.fetch(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Special Action: Produce Batch
  produceProduct = async (pid: string, quantity: number) => {
    // This replaces adjustProductStock logic for production
    if (quantity <= 0) return;

    // Call the dedicated produce endpoint
    const res = await this.fetch<any>(`/products/${pid}/produce`, {
      method: 'POST',
      body: JSON.stringify({ quantity })
    });

    return res.product; // Return updated product
  }

  // Shim for manual adjustment if needed (UI uses adjustProductStock)
  adjustProductStock = async (productId: string, amount: number) => {
    // If amount > 0, it's production. If amount < 0, it's manual removal?
    // The backend 'produce' only supports addition with deduction.
    // If the UI allows manual "Correction", we might need a separate endpoint or PATCH.
    // For now, mapping positive to produce logic roughly, or using PATCH for direct stock edit if allowed.

    if (amount > 0) {
      return this.produceProduct(productId, amount);
    } else {
      // Direct stock patch for now (Admin override)
      // We need to fetch current product first to know total? No, backend patch updates fields.
      // But patch replaces value, doesn't increment.
      // We'll need to fetch, calc, and patch. OR just use produce for all? 
      // Real backend usually distinguishes.
      // For prototype speed:
      const product = await this.fetch<Product>(`/products/${productId}`);
      const newStock = (product.currentStock || 0) + amount;
      await this.fetch(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ currentStock: newStock })
      });
      return { ...product, currentStock: newStock };
    }
  }

  // --- SALES ---
  getSales = async () => this.fetch<Sale[]>('/sales');

  createSale = async (sale: Omit<Sale, 'id' | 'receiptNumber'>) => {
    return this.fetch<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  deleteSale = async (id: string) => {
    // Backend 'void' is essentially soft delete or reverse.
    // Mapped to delete endpoint which calls void logic in backend routes (alias)
    await this.fetch(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  voidSale = async (id: string) => {
    await this.fetch(`/sales/${id}/void`, {
      method: 'POST',
    });
  }

  // --- CUSTOMERS ---
  getCustomers = async () => this.fetch<Customer[]>('/customers');

  addCustomer = async (customer: Omit<Customer, 'id' | 'totalSpent'>) => {
    return this.fetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  updateCustomer = async (id: string, updates: Partial<Customer>) => {
    await this.fetch(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  deleteCustomer = async (id: string) => {
    await this.fetch(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // --- MISSING ENDPOINTS (Mocks or Todo) ---
  // Purchases, Expenses, Wastage, Settings - Not implemented in backend yet or partial.
  // I will keep these as MOCKS or Empty for now to verify main flow, or throw simple errors.

  getPurchases = async () => this.fetch<PurchaseOrder[]>('/purchases');

  createPurchase = async (purchase: unknown) => {
    return this.fetch<PurchaseOrder>('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  }

  deletePurchase = async (id: string) => {
    await this.fetch(`/purchases/${id}`, {
      method: 'DELETE',
    });
  }

  getExpenses = async () => this.fetch<Expense[]>('/expenses');

  addExpense = async (expense: Omit<Expense, 'id'>) => {
    return this.fetch<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  deleteExpense = async (id: string) => {
    await this.fetch(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  getWastage = async () => this.fetch<Wastage[]>('/wastage');

  addWastage = async (wastage: unknown) => {
    return this.fetch<Wastage>('/wastage', {
      method: 'POST',
      body: JSON.stringify(wastage),
    });
  }

  deleteWastage = async (id: string) => {
    await this.fetch(`/wastage/${id}`, {
      method: 'DELETE',
    });
  }

  getSettings = async () => this.fetch<BusinessSettings>('/settings');

  updateSettings = async (settings: Partial<BusinessSettings>) => {
    return this.fetch<BusinessSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // --- BACKUP ---
  getBackup = async () => this.fetch<any>('/backup');

  restoreBackup = async (data: any) => {
    return this.fetch<any>('/backup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
