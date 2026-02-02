-- =============================================
-- ADVANCED ANTI-FRAUD SYSTEM
-- =============================================

-- 1. Function to normalize usernames (remove special chars, lowercase, trim)
CREATE OR REPLACE FUNCTION public.normalize_username(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove common variations: underscores, dots, dashes, spaces
  -- Convert to lowercase, remove special characters
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(input_text, '[._\-\s]', '', 'g'),
      '[^a-z0-9]', '', 'g'
    )
  );
END;
$$;

-- 2. Function to calculate similarity between two strings (Levenshtein-based)
CREATE OR REPLACE FUNCTION public.name_similarity(name1 TEXT, name2 TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  norm1 TEXT;
  norm2 TEXT;
  len1 INT;
  len2 INT;
  max_len INT;
  distance INT;
BEGIN
  norm1 := normalize_username(name1);
  norm2 := normalize_username(name2);
  
  IF norm1 = norm2 THEN
    RETURN 1.0;
  END IF;
  
  len1 := LENGTH(norm1);
  len2 := LENGTH(norm2);
  max_len := GREATEST(len1, len2);
  
  IF max_len = 0 THEN
    RETURN 1.0;
  END IF;
  
  -- Use pg_trgm similarity if available, fallback to simple comparison
  -- Calculate basic similarity based on common prefix/suffix
  distance := levenshtein(norm1, norm2);
  
  RETURN 1.0 - (distance::NUMERIC / max_len::NUMERIC);
EXCEPTION
  WHEN undefined_function THEN
    -- Fallback if levenshtein not available
    IF norm1 = norm2 THEN RETURN 1.0; END IF;
    IF POSITION(norm1 IN norm2) > 0 OR POSITION(norm2 IN norm1) > 0 THEN RETURN 0.7; END IF;
    RETURN 0.0;
END;
$$;

-- 3. Function to check for duplicate platform links
CREATE OR REPLACE FUNCTION public.check_duplicate_platform_link()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_normalized_username TEXT;
  v_existing_count INT;
BEGIN
  v_normalized_username := normalize_username(NEW.username);
  
  -- Check for exact URL duplicate
  SELECT COUNT(*) INTO v_existing_count
  FROM platform_links pl
  INNER JOIN creators c ON c.id = pl.creator_id
  WHERE pl.url = NEW.url
    AND pl.id IS DISTINCT FROM NEW.id
    AND c.status != 'rejected';
  
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Duplicate platform link detected: this URL already exists';
  END IF;
  
  -- Check for same platform + normalized username duplicate
  SELECT COUNT(*) INTO v_existing_count
  FROM platform_links pl
  INNER JOIN creators c ON c.id = pl.creator_id
  WHERE pl.platform = NEW.platform
    AND normalize_username(pl.username) = v_normalized_username
    AND pl.id IS DISTINCT FROM NEW.id
    AND c.status != 'rejected';
  
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Duplicate platform link detected: this username already exists on this platform';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger to check duplicate links on insert
DROP TRIGGER IF EXISTS check_duplicate_link_trigger ON platform_links;
CREATE TRIGGER check_duplicate_link_trigger
BEFORE INSERT OR UPDATE ON platform_links
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_platform_link();

-- 5. Function to find similar creators (for admin review)
CREATE OR REPLACE FUNCTION public.find_similar_creators(p_creator_name TEXT, p_threshold NUMERIC DEFAULT 0.7)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  status TEXT,
  similarity_score NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.status::TEXT,
    name_similarity(c.name, p_creator_name) AS similarity_score
  FROM creators c
  WHERE c.status != 'rejected'
    AND name_similarity(c.name, p_creator_name) >= p_threshold
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$;

-- 6. Enhanced fraud check function for payout requests
CREATE OR REPLACE FUNCTION public.calculate_user_fraud_indicators(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_profile_age_days INT;
  v_total_reviews INT;
  v_approved_reviews INT;
  v_rejected_reviews INT;
  v_total_creators INT;
  v_approved_creators INT;
  v_rejected_creators INT;
  v_avg_review_interval INTERVAL;
  v_risk_indicators JSONB := '[]'::JSONB;
  v_risk_level TEXT := 'low';
  v_risk_score INT := 0;
BEGIN
  -- Get profile age
  SELECT EXTRACT(DAY FROM (NOW() - created_at))::INT INTO v_profile_age_days
  FROM profiles WHERE user_id = p_user_id;
  
  -- Get review stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO v_total_reviews, v_approved_reviews, v_rejected_reviews
  FROM reviews WHERE user_id = p_user_id;
  
  -- Get creator stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO v_total_creators, v_approved_creators, v_rejected_creators
  FROM creators WHERE added_by_user_id = p_user_id;
  
  -- Calculate average review interval
  SELECT AVG(interval_val) INTO v_avg_review_interval
  FROM (
    SELECT created_at - LAG(created_at) OVER (ORDER BY created_at) AS interval_val
    FROM reviews WHERE user_id = p_user_id
  ) intervals
  WHERE interval_val IS NOT NULL;

  -- Risk indicators calculation
  
  -- 1. New account with high earnings attempt
  IF v_profile_age_days < 7 THEN
    v_risk_score := v_risk_score + 20;
    v_risk_indicators := v_risk_indicators || '["account_nuovo_7gg"]'::JSONB;
  ELSIF v_profile_age_days < 30 THEN
    v_risk_score := v_risk_score + 10;
    v_risk_indicators := v_risk_indicators || '["account_nuovo_30gg"]'::JSONB;
  END IF;
  
  -- 2. High rejection rate
  IF v_total_reviews > 3 AND (v_rejected_reviews::NUMERIC / v_total_reviews::NUMERIC) > 0.3 THEN
    v_risk_score := v_risk_score + 25;
    v_risk_indicators := v_risk_indicators || '["alto_tasso_rifiuto_review"]'::JSONB;
  END IF;
  
  IF v_total_creators > 2 AND (v_rejected_creators::NUMERIC / v_total_creators::NUMERIC) > 0.3 THEN
    v_risk_score := v_risk_score + 25;
    v_risk_indicators := v_risk_indicators || '["alto_tasso_rifiuto_creator"]'::JSONB;
  END IF;
  
  -- 3. Review velocity too fast (less than 10 minutes average)
  IF v_avg_review_interval IS NOT NULL AND v_avg_review_interval < INTERVAL '10 minutes' AND v_total_reviews > 5 THEN
    v_risk_score := v_risk_score + 30;
    v_risk_indicators := v_risk_indicators || '["velocita_review_sospetta"]'::JSONB;
  END IF;
  
  -- 4. Suspiciously regular patterns (exactly same interval between activities)
  -- This would require more complex analysis
  
  -- 5. Only reviews, no real engagement pattern
  IF v_total_creators = 0 AND v_total_reviews > 20 THEN
    v_risk_score := v_risk_score + 15;
    v_risk_indicators := v_risk_indicators || '["solo_review_no_creator"]'::JSONB;
  END IF;
  
  -- Determine risk level
  IF v_risk_score >= 50 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 25 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;
  
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'profile_age_days', v_profile_age_days,
    'total_reviews', v_total_reviews,
    'approved_reviews', v_approved_reviews,
    'rejected_reviews', v_rejected_reviews,
    'review_approval_rate', CASE WHEN v_total_reviews > 0 THEN ROUND((v_approved_reviews::NUMERIC / v_total_reviews::NUMERIC) * 100, 1) ELSE 0 END,
    'total_creators', v_total_creators,
    'approved_creators', v_approved_creators,
    'rejected_creators', v_rejected_creators,
    'creator_approval_rate', CASE WHEN v_total_creators > 0 THEN ROUND((v_approved_creators::NUMERIC / v_total_creators::NUMERIC) * 100, 1) ELSE 0 END,
    'avg_review_interval_minutes', CASE WHEN v_avg_review_interval IS NOT NULL THEN EXTRACT(EPOCH FROM v_avg_review_interval) / 60 ELSE NULL END,
    'risk_score', v_risk_score,
    'risk_level', v_risk_level,
    'risk_indicators', v_risk_indicators
  );
  
  RETURN v_result;
END;
$$;

-- 7. Enable fuzzystrmatch extension for levenshtein function
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;