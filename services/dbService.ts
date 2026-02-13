import { supabase } from './supabaseClient';
import { Vehicle, Transaction, User, Account } from '../types';

export const dbService = {
  // --- AUTH & PROFILE ---
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        monthly_goal: updates.monthlyGoal,
        onboarding_completed: updates.onboardingCompleted
      })
      .eq('id', userId);
    return !error;
  },

  // Nota: createProfile e createDefaultAccounts não são mais necessários no front
  // pois a Trigger handle_new_user() já faz isso no banco de dados.

  // --- VEHICLES ---
  async getVehicles(userId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false);
    
    if (error) return [];
    
    return (data || []).map(v => ({
      id: v.id,
      userId: v.user_id,
      model: v.model,
      plate: v.plate,
      ownershipType: v.ownership_type,
      rentAmount: v.rent_amount,
      rentFrequency: v.rent_frequency,
      rentDueDay: v.rent_due_day,
      financingInstallment: v.financing_installment,
      financingDueDay: v.financing_due_day,
      financingTotalMonths: v.financing_total_months,
      financingPaidMonths: v.financing_paid_months,
      vehicleValue: v.vehicle_value,
      insuranceRenewalDate: v.insurance_renewal_date,
      insuranceInstallmentValue: v.insurance_installment_value,
      insuranceDueDay: v.insurance_due_day,
      insuranceTotalInstallments: v.insurance_total_installments,
      isArchived: v.is_archived,
      createdAt: v.created_at
    }));
  },

  async saveVehicle(vehicle: Omit<Vehicle, 'userId'>, userId: string) {
    const v = vehicle as any;
    const payload = {
      user_id: userId,
      model: v.model,
      plate: v.plate,
      ownership_type: v.ownershipType,
      rent_amount: v.rentAmount || 0,
      rent_frequency: v.rentFrequency,
      rent_due_day: v.rentDueDay,
      financing_installment: v.financingInstallment || 0,
      financing_due_day: v.financingDueDay,
      financing_total_months: v.financingTotalMonths,
      financing_paid_months: v.financingPaidMonths || 0,
      vehicle_value: v.vehicleValue || 0,
      insurance_renewal_date: v.insuranceRenewalDate,
      insurance_installment_value: v.insuranceInstallmentValue || 0,
      insurance_due_day: v.insuranceDueDay,
      insurance_total_installments: v.insuranceTotalInstallments,
      is_archived: v.isArchived || false
    };

    if (v.id && v.id.length > 30) { 
      const { error } = await supabase
        .from('vehicles')
        .update(payload)
        .eq('id', v.id);
      return !error;
    } else {
      const { error } = await supabase
        .from('vehicles')
        .insert(payload);
      return !error;
    }
  },

  // --- ACCOUNTS ---
  async getAccounts(userId: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) return [];
    
    return (data || []).map(acc => ({
      id: acc.id,
      userId: acc.user_id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      isDefault: acc.is_default,
      color: acc.color
    }));
  },

  // --- TRANSACTIONS ---
  async getTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) return [];
    
    return (data || []).map(t => ({
      id: t.id,
      userId: t.user_id,
      vehicleId: t.vehicle_id,
      accountId: t.account_id,
      type: t.type,
      category: t.category,
      amount: t.amount,
      date: t.date,
      description: t.description,
      fuelType: t.fuel_type,
      unitPrice: t.unit_price,
      volume: t.volume
    }));
  },

  async addTransaction(tx: Omit<Transaction, 'id'>) {
    const t = tx as any;
    // Agora só precisamos inserir a transação. 
    // O saldo da conta será atualizado automaticamente pela TRIGGER on_transaction_change.
    const { error } = await supabase.from('transactions').insert({
      user_id: t.userId,
      vehicle_id: t.vehicleId,
      account_id: t.accountId,
      type: t.type,
      category: t.category,
      amount: t.amount,
      date: t.date,
      description: t.description,
      fuel_type: t.fuelType,
      unit_price: t.unitPrice,
      volume: t.volume
    });

    return !error;
  }
};