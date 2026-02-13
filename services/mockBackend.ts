import { Vehicle, Transaction, User, CategoryItem, DEFAULT_CATEGORIES, Account } from '../types';

const KEYS = {
  VEHICLES: 'motoristareal_vehicles_v2',
  TRANSACTIONS: 'motoristareal_transactions_v2',
  USER: 'motoristareal_user_v2',
  CATEGORIES: 'motoristareal_categories_v2',
  ACCOUNTS: 'motoristareal_accounts_v2',
};

/**
 * Service to handle data persistence.
 * Structured to be easily replaced by a Supabase/Firebase client.
 */
class BackendService {
  private memoryCache: Record<string, any> = {};
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Load from LocalStorage
    this.memoryCache[KEYS.USER] = this.safeLoad(KEYS.USER, null);
    this.memoryCache[KEYS.VEHICLES] = this.safeLoad(KEYS.VEHICLES, []);
    this.memoryCache[KEYS.TRANSACTIONS] = this.safeLoad(KEYS.TRANSACTIONS, []);
    this.memoryCache[KEYS.CATEGORIES] = this.safeLoad(KEYS.CATEGORIES, JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)));
    this.memoryCache[KEYS.ACCOUNTS] = this.loadAccountsFromStorage();

    this.isInitialized = true;
  }

  private safeLoad(key: string, fallback: any): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.warn(`Error loading key ${key}, resetting to default.`, e);
      return fallback;
    }
  }

  private loadAccountsFromStorage(): Account[] {
    const data = this.safeLoad(KEYS.ACCOUNTS, null);
    if (!data) {
      const user = this.getUser();
      const defaultAccounts: Account[] = [
        { id: 'acc_prof', userId: user?.id || 'guest', name: 'Conta Profissional', type: 'CHECKING', balance: 0, isDefault: true, color: 'blue' },
        { id: 'acc_pers', userId: user?.id || 'guest', name: 'Conta Pessoal', type: 'CHECKING', balance: 0, isDefault: false, color: 'purple' },
      ];
      this.persist(KEYS.ACCOUNTS, defaultAccounts);
      return defaultAccounts;
    }
    return data;
  }

  private persist(key: string, data: any) {
    this.memoryCache[key] = data;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- USER ---
  getUser(): User | null {
    return this.memoryCache[KEYS.USER];
  }

  async saveUser(user: User): Promise<void> {
    this.persist(KEYS.USER, user);
  }

  // --- ACCOUNTS ---
  getAccounts(): Account[] {
    return this.memoryCache[KEYS.ACCOUNTS] || [];
  }

  async saveAccount(account: Account): Promise<void> {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    if (index >= 0) {
      accounts[index] = account;
    } else {
      accounts.push(account);
    }
    this.persist(KEYS.ACCOUNTS, accounts);
  }

  async updateAccountBalance(accountId: string, amount: number, type: 'INCOME' | 'EXPENSE'): Promise<void> {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      if (type === 'INCOME') {
        account.balance += amount;
      } else {
        account.balance -= amount;
      }
      await this.saveAccount(account);
    }
  }

  // --- CATEGORIES ---
  getCategories(): CategoryItem[] {
    return this.memoryCache[KEYS.CATEGORIES] || DEFAULT_CATEGORIES;
  }

  async saveCategory(category: CategoryItem): Promise<void> {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    this.persist(KEYS.CATEGORIES, categories);
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = this.getCategories().filter(c => c.id !== id);
    this.persist(KEYS.CATEGORIES, categories);
  }

  // --- VEHICLES ---
  getVehicles(): Vehicle[] {
    return this.memoryCache[KEYS.VEHICLES] || [];
  }

  async addVehicle(vehicle: Vehicle): Promise<void> {
    const vehicles = this.getVehicles();
    vehicles.push(vehicle);
    this.persist(KEYS.VEHICLES, vehicles);
  }

  async updateVehicle(updatedVehicle: Vehicle): Promise<void> {
    const vehicles = this.getVehicles().map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
    this.persist(KEYS.VEHICLES, vehicles);
  }

  // --- TRANSACTIONS ---
  getTransactions(vehicleId?: string): Transaction[] {
    const transactions: Transaction[] = this.memoryCache[KEYS.TRANSACTIONS] || [];
    if (vehicleId) {
      return transactions.filter(t => t.vehicleId === vehicleId);
    }
    return transactions;
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    this.persist(KEYS.TRANSACTIONS, transactions);

    if (transaction.accountId) {
      await this.updateAccountBalance(transaction.accountId, transaction.amount, transaction.type);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const transactions = this.getTransactions();
    const tx = transactions.find(t => t.id === id);
    
    if (tx && tx.accountId) {
      const reverseType = tx.type === 'INCOME' ? 'EXPENSE' : 'INCOME';
      await this.updateAccountBalance(tx.accountId, tx.amount, reverseType);
    }
    
    const newTransactions = transactions.filter(t => t.id !== id);
    this.persist(KEYS.TRANSACTIONS, newTransactions);
  }

  // --- UTILS ---
  async clearData(): Promise<void> {
    localStorage.clear();
    this.memoryCache = {};
  }
}

export const mockBackend = new BackendService();
