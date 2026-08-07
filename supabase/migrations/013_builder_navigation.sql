-- Migration 013: Builder Navigation Persistence
-- Persists maxUnlockedStep, lastCompletedStep, hasPendingRegeneration, builderMode,
-- productMode, and productImageMode so users resume exactly where they left off.

-- 1. Fix current_step constraint: was limited to 1-6, builder now has 8 steps.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'campaign_builder_sessions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%current_step%';
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE campaign_builder_sessions DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE campaign_builder_sessions
  ADD CONSTRAINT campaign_builder_sessions_current_step_check
  CHECK (current_step BETWEEN 1 AND 8);

-- 2. Fix status constraint: add 'paused' (already used in code but missing from DB).
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'campaign_builder_sessions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE campaign_builder_sessions DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE campaign_builder_sessions
  ADD CONSTRAINT campaign_builder_sessions_status_check
  CHECK (status IN ('draft', 'completed', 'abandoned', 'paused'));

-- 3. Add navigation state columns.
--    All default to their zero/false values so existing rows remain valid.
ALTER TABLE campaign_builder_sessions
  ADD COLUMN IF NOT EXISTS max_unlocked_step       integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_completed_step     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_pending_regeneration boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS builder_mode            text,
  ADD COLUMN IF NOT EXISTS product_mode            text,
  ADD COLUMN IF NOT EXISTS product_image_mode      text;

-- 4. Backfill existing rows so the navigation bar opens correctly after upgrade.
--    max_unlocked_step = at least current_step for rows that were already in progress.
UPDATE campaign_builder_sessions
  SET max_unlocked_step = GREATEST(max_unlocked_step, current_step)
  WHERE current_step > 1;

-- Sessions that had a strategy generated should unlock up to step 6.
UPDATE campaign_builder_sessions
  SET max_unlocked_step = GREATEST(max_unlocked_step, 6)
  WHERE ai_strategy IS NOT NULL;

-- Sessions with generated creatives should unlock up to step 7.
UPDATE campaign_builder_sessions
  SET max_unlocked_step = GREATEST(max_unlocked_step, 7)
  WHERE creatives IS NOT NULL AND jsonb_array_length(creatives) > 0;

-- Sessions with a selected creative should unlock up to step 8.
UPDATE campaign_builder_sessions
  SET max_unlocked_step = GREATEST(max_unlocked_step, 8)
  WHERE selected_creative_id IS NOT NULL;

-- Backfill last_completed_step = max_unlocked_step - 1 (best estimate).
UPDATE campaign_builder_sessions
  SET last_completed_step = GREATEST(0, max_unlocked_step - 1)
  WHERE last_completed_step = 0 AND max_unlocked_step > 1;
