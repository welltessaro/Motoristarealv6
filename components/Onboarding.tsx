import React, { useState, useRef } from 'react';
import { Vehicle, OwnershipType, User } from '../types';
import Button from './Button';
import { formatPlate, handlePriceChange, formatCurrency, isValidPlate, formatDateForInput } from '../utils';
import { Car, ChevronRight, ChevronLeft, CheckCircle, Search, ChevronDown, AlertCircle, ShieldCheck, Calendar, CreditCard, Layers, User as UserIcon } from 'lucide-react';
import { mockBackend } from '../services/mockBackend';

const CAR_DATA: Record<string, string[]> = {
  "Chevrolet": ["Onix", "Onix Plus", "Tracker", "Spin", "Cruze", "Montana", "S10"],
  "Fiat": ["Strada", "Argo", "Mobi", "Toro", "Pulse", "Fastback", "Cronos", "Fiorino", "Titano"],
  "Volkswagen": ["Polo", "Polo Track", "T-Cross", "Nivus", "Saveiro", "Virtus", "Taos", "Amarok", "Jetta"],
  "Hyundai": ["HB20", "HB20S", "Creta", "Tucson", "Santa Fe"],
  "Toyota": ["Hilux", "Corolla", "Corolla Cross", "Yaris Hatch", "Yaris Sedan", "SW4", "RAV4"],
  "Jeep": ["Compass", "Renegade", "Commander", "Wrangler", "Gladiator"],
  "Renault": ["Kwid", "Duster", "Oroch", "Master", "Logan", "Stepway", "Megane E-Tech", "Sandero"],
  "Honda": ["HR-V", "City Hatch", "City Sedan", "ZR-V", "Civic", "CR-V"],
  "Nissan": ["Kicks", "Versa", "Sentra", "Frontier"],
  "BYD": ["Song Plus", "Dolphin", "Dolphin Mini", "Yuan Plus", "Seal", "Tan", "Han"],
  "Caoa Chery": ["Tiggo 5x", "Tiggo 7", "Tiggo 8", "iCar", "Arrizo 6"],
  "Ford": ["Ranger", "Territory", "Maverick", "Mustang", "Transit"],
  "Citroën": ["C3", "C3 Aircross", "C4 Cactus", "Jumpy"],
  "Peugeot": ["208", "2008", "3008", "Expert"],
  "Mitsubishi": ["L200 Triton", "Pajero Sport", "Eclipse Cross"],
  "Ram": ["Rampage", "1500", "2500", "3500"],
  "BMW": ["X1", "320i", "X3", "X5"],
  "Mercedes-Benz": ["C-Class", "GLA", "GLC"],
  "Audi": ["A3", "Q3", "Q5"],
  "GWM": ["Haval H6", "Ora 03"]
};

const WEEK_DAYS = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

interface OnboardingProps {
  onComplete: (data: { vehicle: Vehicle, userName: string }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Step 1: User Name
  const [userName, setUserName] = useState('');

  // Form State (Vehicle)
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [ownershipType, setOwnershipType] = useState<OwnershipType>('OWNED');
  
  // Financial State
  const [costValue, setCostValue] = useState(0); 
  const [rentFrequency, setRentFrequency] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [rentDueDay, setRentDueDay] = useState<number>(5);
  const [financingTotalMonths, setFinancingTotalMonths] = useState<string>('');
  const [financingPaidMonths, setFinancingPaidMonths] = useState<string>('');
  const [financingDueDay, setFinancingDueDay] = useState<number>(10);
  const [vehicleValue, setVehicleValue] = useState(0);
  
  // Insurance State
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceDate, setInsuranceDate] = useState(formatDateForInput(new Date()));
  const [insuranceInstallmentValue, setInsuranceInstallmentValue] = useState(0);
  const [insuranceTotalInstallments, setInsuranceTotalInstallments] = useState('');

  const [plateError, setPlateError] = useState<string | null>(null);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const getBrandSuggestions = () => {
    const allBrands = Object.keys(CAR_DATA).sort();
    if (!brand) return allBrands;
    return allBrands.filter(b => b.toLowerCase().includes(brand.toLowerCase()));
  };

  const getModelSuggestions = () => {
    const availableModels = CAR_DATA[brand] || [];
    if (!model) return availableModels;
    return availableModels.filter(m => m.toLowerCase().includes(model.toLowerCase()));
  };

  const handleSelectBrand = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setShowBrandSuggestions(false);
    setModel('');
    setTimeout(() => modelInputRef.current?.focus(), 100);
  };

  const handleSelectModel = (selectedModel: string) => {
    setModel(selectedModel);
    setShowModelSuggestions(false);
  };

  const validateStep2 = () => {
    setPlateError(null);
    if (!isValidPlate(plate)) {
      setPlateError('Placa inválida. Use o formato AAA-0000 ou Mercosul.');
      return;
    }
    const existingVehicles = mockBackend.getVehicles();
    const isDuplicate = existingVehicles.some(v => v.plate === plate);
    if (isDuplicate) {
      setPlateError('Esta placa já está cadastrada no sistema.');
      return;
    }
    nextStep();
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleFinish = () => {
    const userId = crypto.randomUUID();
    const fullModelName = `${brand} ${model}`.trim();

    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      userId,
      model: fullModelName,
      plate,
      ownershipType,
      rentAmount: ownershipType === 'RENTED' ? costValue : 0,
      rentFrequency: ownershipType === 'RENTED' ? rentFrequency : undefined,
      rentDueDay: ownershipType === 'RENTED' ? rentDueDay : undefined,
      financingInstallment: ownershipType === 'FINANCED' ? costValue : 0,
      financingDueDay: ownershipType === 'FINANCED' ? financingDueDay : undefined,
      financingTotalMonths: ownershipType === 'FINANCED' ? parseInt(financingTotalMonths) || 0 : undefined,
      financingPaidMonths: ownershipType === 'FINANCED' ? parseInt(financingPaidMonths) || 0 : undefined,
      vehicleValue: ownershipType === 'OWNED' ? vehicleValue : undefined,
      insuranceRenewalDate: hasInsurance ? insuranceDate : undefined,
      insuranceInstallmentValue: hasInsurance ? insuranceInstallmentValue : undefined,
      insuranceTotalInstallments: hasInsurance ? parseInt(insuranceTotalInstallments) || 0 : undefined,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    
    onComplete({ vehicle, userName });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto p-6 justify-center">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
          {step === 1 ? <UserIcon size={32} /> : <Car size={32} />}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">MotoristaReal</h1>
        <p className="text-slate-500 mt-2 text-sm">Simplificando sua gestão financeira.</p>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i + 1 <= step ? 'bg-primary-500' : 'bg-slate-100'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-black text-slate-800">Como você quer ser chamado?</h2>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Nome Completo</label>
              <input 
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 text-lg font-bold text-slate-800"
                placeholder="Ex: João Silva"
                autoFocus
              />
            </div>
            <Button fullWidth onClick={nextStep} disabled={!userName.trim()}>
              Próximo <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-black text-slate-800">Seu Carro de Trabalho</h2>
            
            <div className="relative">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Marca</label>
              <div className="relative">
                <input 
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); setShowBrandSuggestions(true); }}
                  onFocus={() => setShowBrandSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                  placeholder="Ex: Fiat, Chevrolet..."
                />
              </div>
              {showBrandSuggestions && (
                <ul className="absolute z-30 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                  {getBrandSuggestions().map((b) => (
                    <li key={b} onMouseDown={() => handleSelectBrand(b)} className="px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer">{b}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Modelo</label>
              <input 
                ref={modelInputRef}
                value={model}
                onChange={(e) => { setModel(e.target.value); setShowModelSuggestions(true); }}
                onFocus={() => setShowModelSuggestions(true)}
                onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                disabled={!brand}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold disabled:opacity-50"
                placeholder={!brand ? "Selecione a marca" : "Ex: Argo, Onix..."}
              />
              {showModelSuggestions && brand && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                  {getModelSuggestions().map((m) => (
                    <li key={m} onMouseDown={() => handleSelectModel(m)} className="px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer">{m}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Placa</label>
              <input 
                value={plate}
                onChange={e => { setPlate(formatPlate(e.target.value)); setPlateError(null); }}
                className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none uppercase font-mono text-xl font-bold ${plateError ? 'border-red-500' : 'border-slate-200'}`}
                placeholder="ABC-1234"
                maxLength={7}
              />
              {plateError && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{plateError}</p>}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={prevStep} className="px-3">
                 <ChevronLeft size={20} />
              </Button>
              <Button fullWidth onClick={validateStep2} disabled={!brand || !model || !plate}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-black text-slate-800">O carro é...</h2>
            <div className="grid gap-3">
              {(['OWNED', 'FINANCED', 'RENTED'] as OwnershipType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setOwnershipType(type)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${ownershipType === type ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-white'}`}
                >
                  <span className="font-black text-slate-800 block">{type === 'OWNED' ? 'Próprio' : type === 'FINANCED' ? 'Financiado' : 'Alugado'}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Clique para selecionar</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={prevStep} className="px-3">
                 <ChevronLeft size={20} />
              </Button>
              <Button fullWidth onClick={nextStep}>
                 Próximo
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-black text-slate-800">Informações Financeiras</h2>
            
            {ownershipType === 'RENTED' && (
              <div className="space-y-4">
                <div className="bg-slate-100 p-1 rounded-2xl flex">
                  <button onClick={() => setRentFrequency('MONTHLY')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${rentFrequency === 'MONTHLY' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}>MENSAL</button>
                  <button onClick={() => setRentFrequency('WEEKLY')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${rentFrequency === 'WEEKLY' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}>SEMANAL</button>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Valor do Aluguel</label>
                  <input value={formatCurrency(costValue).replace('R$', '').trim()} onChange={e => setCostValue(handlePriceChange(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none" placeholder="0,00" />
                </div>
              </div>
            )}

            {ownershipType === 'FINANCED' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div className="col-span-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Valor Parcela</label>
                    <input value={formatCurrency(costValue).replace('R$', '').trim()} onChange={e => setCostValue(handlePriceChange(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none" />
                   </div>
                   <div className="col-span-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Total Meses</label>
                    <input type="number" value={financingTotalMonths} onChange={e => setFinancingTotalMonths(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none" />
                   </div>
                </div>
              </div>
            )}

             {ownershipType === 'OWNED' && (
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase block mb-1">Valor Fipe (Aprox.)</label>
                <input value={formatCurrency(vehicleValue).replace('R$', '').trim()} onChange={e => setVehicleValue(handlePriceChange(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none" />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Usado para cálculo de depreciação automática.</p>
              </div>
            )}

            <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={hasInsurance} onChange={(e) => setHasInsurance(e.target.checked)} className="w-5 h-5 accent-primary-500 rounded-lg" />
                  <span className="font-bold text-slate-700 text-sm">Possui Seguro?</span>
              </label>

              {hasInsurance && (
                  <div className="mt-4 space-y-3 animate-fade-in border-t border-slate-200 pt-4">
                       <label className="text-[10px] text-slate-400 font-black uppercase block">Valor da Parcela Mensal</label>
                       <input value={formatCurrency(insuranceInstallmentValue).replace('R$', '').trim()} onChange={e => setInsuranceInstallmentValue(handlePriceChange(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                  </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={prevStep} className="px-3">
                 <ChevronLeft size={20} />
              </Button>
              <Button fullWidth onClick={handleFinish}>
                <CheckCircle size={18} /> Finalizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;