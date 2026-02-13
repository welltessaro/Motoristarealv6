import React, { useState, useEffect } from 'react';
import { ViewState, Vehicle, Transaction, User, CategoryItem, Account, DEFAULT_CATEGORIES } from './types.ts';
import { dbService } from './services/dbService.ts';
import { supabase } from './services/supabaseClient.ts';
import AppLayout from './components/AppLayout.tsx';
import Dashboard from './components/Dashboard.tsx';
import TransactionModal from './components/TransactionModal.tsx';
import VehicleManagerModal from './components/VehicleManagerModal.tsx';
import ReportsView from './components/ReportsView.tsx';
import FeaturesModal from './components/FeaturesModal.tsx';
import CategoryManagerModal from './components/CategoryManagerModal.tsx';
import FinancialView from './components/FinancialView.tsx';
import Onboarding from './components/Onboarding.tsx';
import Auth from './components/Auth.tsx';
import Button from './components/Button.tsx';
import { LogOut, Tags, Heart, Copy, Check, Shield, RefreshCw, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [currentView, setCurrentView] = useState<ViewState['currentView']>('DASHBOARD');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        setSession(currentSession);
        if (currentSession) {
          await loadAppData(currentSession.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Erro na inicialização:", err);
        setIsLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadAppData(newSession.user.id);
      } else {
        setIsLoading(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAppData = async (userId: string) => {
    setIsLoading(true);
    try {
      const profile = await dbService.getProfile(userId);
      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: session?.user?.email || '',
          onboardingCompleted: profile.onboarding_completed,
          monthlyGoal: profile.monthly_goal,
          createdAt: profile.created_at
        });

        const [vList, accList, txList] = await Promise.all([
          dbService.getVehicles(userId),
          dbService.getAccounts(userId),
          dbService.getTransactions(userId)
        ]);

        setVehicles(vList);
        setAccounts(accList);
        setTransactions(txList);

        if (vList.length > 0 && !activeVehicleId) {
          setActiveVehicleId(vList[0].id);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: { vehicle: Vehicle, userName: string }) => {
    if (!session) return;
    setIsLoading(true);
    try {
      const newUser: User = {
        id: session.user.id,
        name: data.userName,
        email: session.user.email,
        onboardingCompleted: true,
        createdAt: new Date().toISOString()
      };

      await dbService.updateProfile(session.user.id, newUser);
      await dbService.saveVehicle(data.vehicle, session.user.id);
      await loadAppData(session.user.id);
    } catch (err) {
      console.error("Erro no onboarding:", err);
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!session) return;
    await dbService.updateProfile(session.user.id, updatedUser);
    setUser(updatedUser);
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user || !session) return;
    const txData = { ...newTx, userId: session.user.id };
    const success = await dbService.addTransaction(txData);
    if (success) loadAppData(session.user.id);
  };

  const handleSaveVehicle = async (vehicleData: Vehicle | Omit<Vehicle, 'userId'>) => {
    if (!user || !session) return;
    const success = await dbService.saveVehicle(vehicleData, session.user.id);
    if (success) loadAppData(session.user.id);
    setEditingVehicle(null);
  };

  const handleArchiveVehicle = async (id: string) => {
    if (!session) return;
    const v = vehicles.find(veh => veh.id === id);
    if(v) {
      await dbService.saveVehicle({ ...v, isArchived: true }, session.user.id);
      loadAppData(session.user.id);
    }
    setIsVehicleModalOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setVehicles([]);
    setTransactions([]);
    setSession(null);
    setIsLoading(false);
  };

  const copyPix = () => {
    navigator.clipboard.writeText("contato.wttecnologia@gmail.com");
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-800 font-black text-lg animate-pulse">Sincronizando Nuvem...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Auth onSession={(sess) => setSession(sess)} />;
  if (!user || vehicles.length === 0) return <Onboarding onComplete={handleOnboardingComplete} />;

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || null;
  const dashboardTransactions = transactions.filter(t => t.vehicleId === activeVehicleId);

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={setCurrentView}
      vehicles={vehicles}
      activeVehicleId={activeVehicleId}
      onSwitchVehicle={setActiveVehicleId}
      onAddVehicle={() => { setEditingVehicle(null); setIsVehicleModalOpen(true); }}
    >
      
      {currentView === 'DASHBOARD' && (
        <Dashboard 
          transactions={dashboardTransactions} 
          activeVehicle={activeVehicle}
          onOpenTransaction={() => setIsTransactionModalOpen(true)}
          user={user}
          onUpdateUser={handleUpdateUser}
          categories={categories}
          onAddTransaction={handleAddTransaction}
          onUpdateVehicle={handleSaveVehicle}
        />
      )}

      {currentView === 'FLEET' && (
        <div className="space-y-4 animate-fade-in px-1">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Minha Frota</h2>
            <button onClick={() => setIsFeaturesModalOpen(true)} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full flex items-center gap-1">
              PRO
            </button>
          </div>
          {vehicles.map(v => (
            <div key={v.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex justify-between items-center group">
              <div>
                <h3 className="font-black text-slate-800">{v.model}</h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold">{v.plate}</p>
              </div>
              <Button variant="secondary" className="px-5 py-2.5 text-xs font-black rounded-2xl" onClick={() => { setEditingVehicle(v); setIsVehicleModalOpen(true); }}>
                Detalhes
              </Button>
            </div>
          ))}
          <button onClick={() => { setEditingVehicle(null); setIsVehicleModalOpen(true); }} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-black text-sm flex flex-col items-center justify-center gap-2 active:bg-slate-50 transition-colors">
            <RefreshCw size={20} /> Adicionar Veículo
          </button>
        </div>
      )}

      {currentView === 'FINANCIAL' && (
        <FinancialView 
          accounts={accounts}
          transactions={transactions}
          categories={categories}
          onAddAccount={() => setIsFeaturesModalOpen(true)}
          onOpenTransaction={() => setIsTransactionModalOpen(true)}
        />
      )}

      {currentView === 'REPORTS' && <ReportsView transactions={dashboardTransactions} categories={categories} />}

      {currentView === 'PROFILE' && (
        <div className="space-y-6 animate-fade-in px-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Perfil</h2>
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary-600"></div>
            <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-4 border-4 border-white shadow-xl">
              {user.name.charAt(0)}
            </div>
            <h3 className="font-black text-xl text-slate-800">{user.name}</h3>
            <p className="text-slate-400 text-xs font-bold uppercase">{user.email}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
             <div className="bg-emerald-50 p-5 rounded-[32px] border border-emerald-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl"><Shield size={20} /></div>
              <div>
                <p className="font-black text-emerald-800 text-sm">Nuvem Sincronizada</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">Dados protegidos pelo Supabase</p>
              </div>
            </div>
            <button onClick={() => setIsCategoryModalOpen(true)} className="w-full bg-white p-5 rounded-[32px] border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl"><Tags size={20} /></div>
                <span className="font-black text-slate-700 text-sm">Categorias</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
            <button onClick={() => setIsPixModalOpen(true)} className="w-full bg-white p-5 rounded-[32px] border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Heart size={20} fill="currentColor" /></div>
                <span className="font-black text-slate-700 text-sm">Apoie o Projeto</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </div>
          <button onClick={handleLogout} className="w-full py-4 text-red-500 font-black text-xs flex items-center justify-center gap-2 mt-8 opacity-40 hover:opacity-100 transition-opacity">
            <LogOut size={16} /> SAIR DA CONTA
          </button>
        </div>
      )}

      <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSave={handleAddTransaction} vehicle={activeVehicle} categories={categories} accounts={accounts} />
      <VehicleManagerModal isOpen={isVehicleModalOpen} onClose={() => { setIsVehicleModalOpen(false); setEditingVehicle(null); }} vehicle={editingVehicle} onSave={handleSaveVehicle} onArchive={handleArchiveVehicle} onAddTransaction={handleAddTransaction} />
      <FeaturesModal isOpen={isFeaturesModalOpen} onClose={() => setIsFeaturesModalOpen(false)} />
      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} onAddCategory={() => setIsFeaturesModalOpen(true)} onDeleteCategory={() => {}} />
      
      {isPixModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsPixModalOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Heart size={40} fill="currentColor" /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Gostou do App?</h3>
            <p className="text-slate-500 text-sm mb-8">Ajude a manter o projeto ativo e livre de anúncios com qualquer contribuição via PIX.</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 truncate mr-4">contato.wttecnologia@gmail.com</span>
              <button onClick={copyPix} className="p-2 bg-white text-primary-600 rounded-xl shadow-sm border border-slate-100 active:scale-90 transition-transform">
                {pixCopied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <Button fullWidth onClick={() => setIsPixModalOpen(false)}>Fechar</Button>
          </div>
        </div>
      )}

    </AppLayout>
  );
};

export default App;