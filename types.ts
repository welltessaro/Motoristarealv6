export type OwnershipType = 'OWNED' | 'FINANCED' | 'RENTED';

export type TransactionType = 'INCOME' | 'EXPENSE';

export enum Category {
  UBER = 'UBER',
  NINE_NINE = '99',
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  INSURANCE = 'INSURANCE',
  RENT = 'RENT',
  FINANCING = 'FINANCING',
  OTHER = 'OTHER'
}

export interface CategoryItem {
  id: string;
  userId?: string; // Null for system categories
  label: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  color: string;
  isSystem: boolean;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'UBER', label: 'Uber', type: 'INCOME', color: '#10b981', isSystem: true },
  { id: '99', label: '99', type: 'INCOME', color: '#f59e0b', isSystem: true },
  { id: 'FUEL', label: 'Combustível', type: 'EXPENSE', color: '#ef4444', isSystem: true },
  { id: 'MAINTENANCE', label: 'Manutenção', type: 'EXPENSE', color: '#6366f1', isSystem: true },
  { id: 'INSURANCE', label: 'Seguro', type: 'EXPENSE', color: '#8b5cf6', isSystem: true },
  { id: 'RENT', label: 'Aluguel', type: 'EXPENSE', color: '#ec4899', isSystem: true },
  { id: 'FINANCING', label: 'Parcela', type: 'EXPENSE', color: '#14b8a6', isSystem: true },
  { id: 'OTHER', label: 'Outros', type: 'BOTH', color: '#94a3b8', isSystem: true },
];

export type FuelType = 'GASOLINE' | 'ETHANOL' | 'GNV' | 'ELECTRIC';

export interface Vehicle {
  id: string;
  userId: string;
  model: string;
  plate: string;
  ownershipType: OwnershipType;
  
  // Rent
  rentAmount?: number;
  rentFrequency?: 'WEEKLY' | 'MONTHLY';
  rentDueDay?: number;

  // Financing
  financingInstallment?: number;
  financingDueDay?: number;
  financingTotalMonths?: number;
  financingPaidMonths?: number;
  vehicleValue?: number;
  
  // Insurance
  insuranceRenewalDate?: string;
  insuranceInstallmentValue?: number;
  insuranceDueDay?: number;
  insuranceTotalInstallments?: number;

  isArchived: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CASH';
  balance: number;
  isDefault: boolean;
  color: string;
}

export interface Transaction {
  id: string;
  userId: string;
  vehicleId: string;
  accountId?: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description?: string;
  
  // Fuel Specific
  fuelType?: FuelType;
  unitPrice?: number;
  volume?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  monthlyGoal?: number;
  createdAt: string;
}

export interface AppVersionInfo {
  version: string;
  build: number;
}

export interface ViewState {
  currentView: 'DASHBOARD' | 'FLEET' | 'FINANCIAL' | 'REPORTS' | 'PROFILE';
}

export const FUEL_LABELS: Record<FuelType, string> = {
  'GASOLINE': 'Gasolina',
  'ETHANOL': 'Etanol',
  'GNV': 'GNV',
  'ELECTRIC': 'Elétrico (kWh)'
};
