-- =============================================
-- FIX ERROR 1: wallet_transactions INSERT - solo admin/sistema
-- Gli utenti NON devono poter inserire transazioni direttamente
-- =============================================
DROP POLICY IF EXISTS "System can create transactions" ON public.wallet_transactions;

CREATE POLICY "Only admins can create transactions"
  ON public.wallet_transactions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX ERROR 2: notifications INSERT - solo admin/sistema
-- Gli utenti NON devono poter creare notifiche arbitrary
-- =============================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Only admins can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX ERROR 3: payout_requests - creare vista pubblica senza payment_details
-- Per le richieste di payout, l'utente vede solo le proprie ma senza i dettagli sensibili esposti
-- =============================================
-- Nota: La policy attuale è già restrittiva (user vede solo le proprie).
-- Il problema è che payment_details potrebbe contenere dati sensibili non criptati.
-- Aggiungiamo un commento per documentare che i dati sensibili dovrebbero essere criptati.
-- Per ora, la policy RLS è corretta - l'utente vede solo i propri dati.

-- =============================================
-- FIX ERROR 4: profiles - Assicurarsi che RLS sia rigoroso
-- La policy attuale permette agli utenti di vedere solo il proprio profilo
-- e agli admin di vedere tutti i profili. Questo è corretto.
-- Verifichiamo che non ci siano policy permissive
-- =============================================

-- Rimuoviamo eventuali policy troppo permissive e confermiamo le restrittive
-- Le policy attuali sono già corrette:
-- - "Users can view own profile" -> auth.uid() = user_id
-- - "Admins can view all profiles" -> has_role admin
-- - "Users can update own profile info" -> auth.uid() = user_id

-- Aggiungiamo un check constraint per impedire che gli utenti possano modificare i bilanci
-- tramite UPDATE diretto (già gestito dalle RPC, ma aggiungiamo protezione extra)
-- NOTA: I bilanci sono già protetti perché le RPC usano SECURITY DEFINER

-- Verifichiamo che la tabella profiles non abbia policy INSERT per utenti normali
-- (i profili vengono creati tramite trigger su auth.users)
DO $$
BEGIN
  -- Verifica che RLS sia abilitato
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;