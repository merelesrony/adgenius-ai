-- Migration 009: Campaign Assembly
-- Adds columns needed for assembling a real campaign from the Smart Builder

-- 1. New columns for campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS platforms jsonb,
  ADD COLUMN IF NOT EXISTS brand_kit  jsonb,
  ADD COLUMN IF NOT EXISTS ai_strategy jsonb;

-- 2. Track which campaign was created from a builder session
ALTER TABLE campaign_builder_sessions
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;

-- 3. Copy and variant metadata in campaign_creatives
ALTER TABLE campaign_creatives
  ADD COLUMN IF NOT EXISTS headline     text,
  ADD COLUMN IF NOT EXISTS primary_text text,
  ADD COLUMN IF NOT EXISTS description  text,
  ADD COLUMN IF NOT EXISTS cta          text,
  ADD COLUMN IF NOT EXISTS variant      text,
  ADD COLUMN IF NOT EXISTS variant_label text;
