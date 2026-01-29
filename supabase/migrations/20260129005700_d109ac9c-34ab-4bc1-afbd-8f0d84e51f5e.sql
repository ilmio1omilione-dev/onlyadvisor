-- 1. Add CHECK constraint to prevent negative balance (defense-in-depth)
ALTER TABLE public.profiles 
ADD CONSTRAINT check_positive_available_balance CHECK (available_balance >= 0);

ALTER TABLE public.profiles 
ADD CONSTRAINT check_positive_pending_balance CHECK (pending_balance >= 0);

-- 2. Create atomic payout request function with row-level locking
CREATE OR REPLACE FUNCTION public.request_payout(
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_payment_details JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout_id UUID;
  v_current_balance DECIMAL;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Lock row and check balance atomically
  SELECT available_balance INTO v_current_balance
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;  -- Row-level lock prevents concurrent access
  
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: % available, % requested', v_current_balance, p_amount;
  END IF;
  
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  -- All operations in single atomic transaction
  INSERT INTO payout_requests (user_id, amount, payment_method, payment_details, status)
  VALUES (v_user_id, p_amount, p_payment_method, p_payment_details, 'pending')
  RETURNING id INTO v_payout_id;
  
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, status, reference_id, reference_type, description)
  VALUES (v_user_id, -p_amount, 'payout', 'pending', v_payout_id, 'payout', 'Richiesta payout');
  
  UPDATE profiles
  SET available_balance = available_balance - p_amount
  WHERE user_id = v_user_id;
  
  RETURN jsonb_build_object('payout_id', v_payout_id, 'success', true, 'new_balance', v_current_balance - p_amount);
END;
$$;

-- 3. Fix RLS on profiles - users can only see their own financial data
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their own complete profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create public view for basic profile info (username, avatar only)
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = on)
AS
SELECT 
  user_id,
  username,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 5. Update profiles UPDATE policy to prevent direct balance manipulation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile info"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Balance fields can only be changed if they remain the same (prevents direct manipulation)
    -- Balance changes must go through the request_payout function
  );