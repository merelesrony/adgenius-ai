-- ============================================================
-- AdGenius AI — Migration v3: Campaign missing columns
-- Adds columns from migration 002 that were not applied to the live DB.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS objective          TEXT DEFAULT 'sales',
  ADD COLUMN IF NOT EXISTS target_languages   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS product_name        TEXT,
  ADD COLUMN IF NOT EXISTS product_description TEXT,
  ADD COLUMN IF NOT EXISTS product_price       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS product_currency    TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS product_category    TEXT;

-- Index for common objective filter
CREATE INDEX IF NOT EXISTS idx_campaigns_objective ON public.campaigns(objective);
