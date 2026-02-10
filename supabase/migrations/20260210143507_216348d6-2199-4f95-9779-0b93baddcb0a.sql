
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption helper functions
CREATE OR REPLACE FUNCTION public.encrypt_payment_details(p_details jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key text;
BEGIN
  -- Use a server-side encryption key from Supabase secrets
  v_key := current_setting('app.settings.payment_encryption_key', true);
  IF v_key IS NULL OR v_key = '' THEN
    -- Fallback: generate a deterministic key from the service role 
    v_key := encode(digest(current_setting('request.jwt.claims', true), 'sha256'), 'hex');
  END IF;
  
  RETURN encode(
    pgp_sym_encrypt(p_details::text, v_key),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_payment_details(p_encrypted text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key text;
  v_decrypted text;
BEGIN
  v_key := current_setting('app.settings.payment_encryption_key', true);
  IF v_key IS NULL OR v_key = '' THEN
    v_key := encode(digest(current_setting('request.jwt.claims', true), 'sha256'), 'hex');
  END IF;
  
  v_decrypted := pgp_sym_decrypt(
    decode(p_encrypted, 'base64'),
    v_key
  );
  
  RETURN v_decrypted::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails (e.g. old unencrypted data), return raw
    RETURN p_encrypted::jsonb;
END;
$$;

-- Add encrypted column
ALTER TABLE public.payout_requests 
ADD COLUMN IF NOT EXISTS payment_details_encrypted text;

-- Migrate existing data (encrypt any existing payment_details)
UPDATE public.payout_requests 
SET payment_details_encrypted = encode(
  pgp_sym_encrypt(payment_details::text, 'onlyadvisor-payment-key-v1'),
  'base64'
)
WHERE payment_details IS NOT NULL AND payment_details_encrypted IS NULL;

-- Update request_payout to encrypt payment details
CREATE OR REPLACE FUNCTION public.request_payout(p_amount numeric, p_payment_method text, p_payment_details jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_payout_id UUID;
  v_current_balance DECIMAL;
  v_user_id UUID;
  v_encrypted text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT available_balance INTO v_current_balance
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: % available, % requested', v_current_balance, p_amount;
  END IF;
  
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Encrypt payment details
  v_encrypted := encode(
    pgp_sym_encrypt(p_payment_details::text, 'onlyadvisor-payment-key-v1'),
    'base64'
  );
  
  INSERT INTO payout_requests (user_id, amount, payment_method, payment_details_encrypted, status)
  VALUES (v_user_id, p_amount, p_payment_method, v_encrypted, 'pending')
  RETURNING id INTO v_payout_id;
  
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, status, reference_id, reference_type, description)
  VALUES (v_user_id, -p_amount, 'payout', 'pending', v_payout_id, 'payout', 'Richiesta payout');
  
  UPDATE profiles
  SET available_balance = available_balance - p_amount
  WHERE user_id = v_user_id;
  
  RETURN jsonb_build_object('payout_id', v_payout_id, 'success', true, 'new_balance', v_current_balance - p_amount);
END;
$$;
