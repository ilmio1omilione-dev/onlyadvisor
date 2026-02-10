
-- Create trigger function for review reward transactions
CREATE OR REPLACE FUNCTION public.create_review_reward_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create pending wallet transaction
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, status, reference_id, reference_type, description)
  VALUES (NEW.user_id, 0.20, 'review_reward', 'pending', NEW.id, 'review', 'Reward per recensione');

  -- Update pending balance
  UPDATE profiles
  SET pending_balance = COALESCE(pending_balance, 0) + 0.20,
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Create trigger function for creator bonus transactions
CREATE OR REPLACE FUNCTION public.create_creator_bonus_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create bonus if a user added the creator
  IF NEW.added_by_user_id IS NOT NULL THEN
    INSERT INTO wallet_transactions (user_id, amount, transaction_type, status, reference_id, reference_type, description)
    VALUES (NEW.added_by_user_id, 1.00, 'creator_bonus', 'pending', NEW.id, 'creator', 'Bonus per aggiunta creator: ' || NEW.name);

    UPDATE profiles
    SET pending_balance = COALESCE(pending_balance, 0) + 1.00,
        updated_at = now()
    WHERE user_id = NEW.added_by_user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_review_insert_create_reward
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.create_review_reward_transaction();

CREATE TRIGGER on_creator_insert_create_bonus
AFTER INSERT ON public.creators
FOR EACH ROW
EXECUTE FUNCTION public.create_creator_bonus_transaction();
