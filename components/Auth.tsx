import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Button from './Button';
import { Mail, Lock, LogIn, UserPlus, Car } from 'lucide-react';

interface AuthProps {
  onSession: (session: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onSession }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) onSession(data.session);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro na autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-primary-600 shadow-inner">
            <Car size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">MotoristaReal</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
            {isSignUp ? 'Crie sua conta na nuvem' : 'Sua gestão, em qualquer lugar'}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 transition-all"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            fullWidth 
            type="submit" 
            isLoading={loading}
            className="py-5 text-lg font-black mt-4 shadow-xl shadow-primary-500/20"
          >
            {isSignUp ? <><UserPlus size={20} /> Cadastrar</> : <><LogIn size={20} /> Entrar</>}
          </Button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-6 text-sm font-bold text-slate-400 hover:text-primary-600 transition-colors py-2"
        >
          {isSignUp ? 'Já tem conta? Faça login' : 'Ainda não tem conta? Comece agora'}
        </button>
      </div>
      
      <p className="mt-8 text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
        Cloud Integrated via Supabase
      </p>
    </div>
  );
};

export default Auth;
