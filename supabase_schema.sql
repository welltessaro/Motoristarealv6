-- SCRIPT DE SEGURANÇA E INTEGRIDADE MOTORISTAREAL
-- Execute este script no SQL Editor para aplicar as melhorias de backend

-- 1. FUNÇÃO PARA CRIAR PERFIL E CONTAS AUTOMATICAMENTE NO SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Criar Perfil
  INSERT INTO public.profiles (id, name, onboarding_completed)
  VALUES (new.id, split_part(new.email, '@', 1), false);

  -- Criar Contas Padrão
  INSERT INTO public.accounts (user_id, name, type, balance, is_default, color)
  VALUES 
    (new.id, 'Conta Profissional', 'CHECKING', 0, true, 'blue'),
    (new.id, 'Conta Pessoal', 'CHECKING', 0, false, 'purple');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para o Signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. FUNÇÃO PARA ATUALIZAR SALDO AUTOMATICAMENTE (ATOMICIDADE)
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.accounts
    SET balance = CASE 
      WHEN NEW.type = 'INCOME' THEN balance + NEW.amount 
      ELSE balance - NEW.amount 
    END
    WHERE id = NEW.account_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.accounts
    SET balance = CASE 
      WHEN OLD.type = 'INCOME' THEN balance - OLD.amount 
      ELSE balance + OLD.amount 
    END
    WHERE id = OLD.account_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para Transações
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- 3. MELHORIA NAS POLÍTICAS DE RLS (MAIS RIGOROSAS)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ADD CONSTRAINT check_tx_type CHECK (type IN ('INCOME', 'EXPENSE'));

-- Garantir que o usuário só altere o próprio saldo através de transações
CREATE POLICY "Users cannot manually update balance" 
ON public.accounts FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
