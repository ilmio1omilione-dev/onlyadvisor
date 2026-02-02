-- Fix search_path for anti-fraud functions

-- 1. Fix normalize_username
CREATE OR REPLACE FUNCTION public.normalize_username(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(input_text, '[._\-\s]', '', 'g'),
      '[^a-z0-9]', '', 'g'
    )
  );
END;
$$;

-- 2. Fix name_similarity
CREATE OR REPLACE FUNCTION public.name_similarity(name1 TEXT, name2 TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
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
  
  distance := levenshtein(norm1, norm2);
  
  RETURN 1.0 - (distance::NUMERIC / max_len::NUMERIC);
EXCEPTION
  WHEN undefined_function THEN
    IF norm1 = norm2 THEN RETURN 1.0; END IF;
    IF POSITION(norm1 IN norm2) > 0 OR POSITION(norm2 IN norm1) > 0 THEN RETURN 0.7; END IF;
    RETURN 0.0;
END;
$$;

-- 3. Fix check_duplicate_platform_link
CREATE OR REPLACE FUNCTION public.check_duplicate_platform_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_normalized_username TEXT;
  v_existing_count INT;
BEGIN
  v_normalized_username := normalize_username(NEW.username);
  
  SELECT COUNT(*) INTO v_existing_count
  FROM platform_links pl
  INNER JOIN creators c ON c.id = pl.creator_id
  WHERE pl.url = NEW.url
    AND pl.id IS DISTINCT FROM NEW.id
    AND c.status != 'rejected';
  
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Duplicate platform link detected: this URL already exists';
  END IF;
  
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

-- 4. Fix find_similar_creators
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
SET search_path TO 'public'
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

-- 5. Move fuzzystrmatch extension to extensions schema
DROP EXTENSION IF EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch SCHEMA extensions;