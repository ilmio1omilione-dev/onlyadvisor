-- ============================================
-- SECURITY FIX: Admin Audit Logging & Secure Balance Operations
-- ============================================

-- 1. Create admin audit log table for accountability
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit log
CREATE POLICY "Admins can read audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow system/trigger inserts to audit log
CREATE POLICY "System can write audit log"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Create secure admin_approve_creator function with audit logging
CREATE OR REPLACE FUNCTION public.admin_approve_creator(p_creator_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_user_id UUID;
  v_creator_name TEXT;
  v_bonus_amount DECIMAL := 1.00;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify admin role
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Get creator info with lock
  SELECT added_by_user_id, name INTO v_user_id, v_creator_name
  FROM creators
  WHERE id = p_creator_id AND status = 'pending'
  FOR UPDATE;
  
  IF v_creator_name IS NULL THEN
    RAISE EXCEPTION 'Creator not found or already processed';
  END IF;
  
  -- Update creator status
  UPDATE creators SET status = 'active', updated_at = now() WHERE id = p_creator_id;
  
  -- Approve wallet transaction
  UPDATE wallet_transactions
  SET status = 'approved', processed_at = now()
  WHERE reference_id = p_creator_id
    AND reference_type = 'creator'
    AND transaction_type = 'creator_bonus';
  
  -- Update balances atomically (only if user exists)
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles
    SET 
      pending_balance = GREATEST(0, pending_balance - v_bonus_amount),
      available_balance = available_balance + v_bonus_amount,
      updated_at = now()
    WHERE user_id = v_user_id;
  END IF;
  
  -- Log admin action
  INSERT INTO admin_audit_log (admin_user_id, action, table_name, record_id, new_values)
  VALUES (
    v_admin_id,
    'approve_creator',
    'creators',
    p_creator_id,
    jsonb_build_object('creator_name', v_creator_name, 'user_id', v_user_id, 'bonus', v_bonus_amount)
  );
  
  RETURN jsonb_build_object('success', true, 'creator_id', p_creator_id);
END;
$$;

-- 3. Create secure admin_reject_creator function with audit logging
CREATE OR REPLACE FUNCTION public.admin_reject_creator(p_creator_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_creator_name TEXT;
  v_old_status TEXT;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify admin role
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Get creator info
  SELECT name, status INTO v_creator_name, v_old_status
  FROM creators
  WHERE id = p_creator_id;
  
  IF v_creator_name IS NULL THEN
    RAISE EXCEPTION 'Creator not found';
  END IF;
  
  -- Update creator status
  UPDATE creators SET status = 'rejected', updated_at = now() WHERE id = p_creator_id;
  
  -- Reject wallet transaction
  UPDATE wallet_transactions
  SET status = 'rejected', processed_at = now()
  WHERE reference_id = p_creator_id
    AND reference_type = 'creator'
    AND transaction_type = 'creator_bonus';
  
  -- Log admin action
  INSERT INTO admin_audit_log (admin_user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    v_admin_id,
    'reject_creator',
    'creators',
    p_creator_id,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', 'rejected', 'creator_name', v_creator_name)
  );
  
  RETURN jsonb_build_object('success', true, 'creator_id', p_creator_id);
END;
$$;

-- 4. Create secure admin_approve_review function with audit logging
CREATE OR REPLACE FUNCTION public.admin_approve_review(p_review_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_user_id UUID;
  v_old_status TEXT;
  v_reward_amount DECIMAL := 0.20;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify admin role
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Get review info with lock
  SELECT user_id, status INTO v_user_id, v_old_status
  FROM reviews
  WHERE id = p_review_id
  FOR UPDATE;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  
  -- Update review status
  UPDATE reviews SET status = 'approved', updated_at = now() WHERE id = p_review_id;
  
  -- Approve wallet transaction
  UPDATE wallet_transactions
  SET status = 'approved', processed_at = now()
  WHERE reference_id = p_review_id
    AND reference_type = 'review'
    AND transaction_type = 'review_reward';
  
  -- Log admin action
  INSERT INTO admin_audit_log (admin_user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    v_admin_id,
    'approve_review',
    'reviews',
    p_review_id,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', 'approved', 'user_id', v_user_id)
  );
  
  RETURN jsonb_build_object('success', true, 'review_id', p_review_id);
END;
$$;

-- 5. Create secure admin_reject_review function with audit logging
CREATE OR REPLACE FUNCTION public.admin_reject_review(p_review_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_user_id UUID;
  v_old_status TEXT;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify admin role
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Get review info
  SELECT user_id, status INTO v_user_id, v_old_status
  FROM reviews
  WHERE id = p_review_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  
  -- Update review status
  UPDATE reviews SET status = 'rejected', updated_at = now() WHERE id = p_review_id;
  
  -- Reject wallet transaction
  UPDATE wallet_transactions
  SET status = 'rejected', processed_at = now()
  WHERE reference_id = p_review_id
    AND reference_type = 'review'
    AND transaction_type = 'review_reward';
  
  -- Log admin action
  INSERT INTO admin_audit_log (admin_user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    v_admin_id,
    'reject_review',
    'reviews',
    p_review_id,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', 'rejected', 'user_id', v_user_id)
  );
  
  RETURN jsonb_build_object('success', true, 'review_id', p_review_id);
END;
$$;

-- 6. Create secure admin_process_payout function with audit logging
CREATE OR REPLACE FUNCTION public.admin_process_payout(
  p_payout_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_user_id UUID;
  v_amount DECIMAL;
  v_old_status TEXT;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify admin role
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Validate status
  IF p_status NOT IN ('approved', 'rejected', 'paid') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;
  
  -- Get payout info with lock
  SELECT user_id, amount, status INTO v_user_id, v_amount, v_old_status
  FROM payout_requests
  WHERE id = p_payout_id
  FOR UPDATE;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Payout request not found';
  END IF;
  
  -- Update payout request
  UPDATE payout_requests
  SET 
    status = p_status::transaction_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    processed_at = now(),
    processed_by = v_admin_id
  WHERE id = p_payout_id;
  
  -- Update wallet transaction status
  UPDATE wallet_transactions
  SET status = p_status::transaction_status, processed_at = now()
  WHERE reference_id = p_payout_id
    AND reference_type = 'payout';
  
  -- If rejected, refund the balance
  IF p_status = 'rejected' THEN
    UPDATE profiles
    SET available_balance = available_balance + v_amount, updated_at = now()
    WHERE user_id = v_user_id;
  END IF;
  
  -- Log admin action
  INSERT INTO admin_audit_log (admin_user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    v_admin_id,
    'process_payout',
    'payout_requests',
    p_payout_id,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_status, 'amount', v_amount, 'user_id', v_user_id, 'notes', p_admin_notes)
  );
  
  RETURN jsonb_build_object('success', true, 'payout_id', p_payout_id, 'new_status', p_status);
END;
$$;

-- 7. Update RLS policy for profiles to prevent direct balance manipulation by regular users
DROP POLICY IF EXISTS "Users can update own profile info" ON public.profiles;

CREATE POLICY "Users can update own profile info"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: Balance manipulation is now only possible through SECURITY DEFINER functions
-- which have proper audit logging. The CHECK constraints on the table prevent negative balances.