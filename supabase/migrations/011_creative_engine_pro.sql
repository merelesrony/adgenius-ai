-- FASE 6.4.7 — Creative Engine Pro
-- Adds structured brief, AI score, variant metadata to campaign_creatives

ALTER TABLE campaign_creatives
  ADD COLUMN IF NOT EXISTS creative_brief    jsonb,
  ADD COLUMN IF NOT EXISTS creative_score    jsonb,
  ADD COLUMN IF NOT EXISTS platform_format  text,
  ADD COLUMN IF NOT EXISTS variant_type     text CHECK (variant_type IN ('conversion', 'emotional', 'premium')),
  ADD COLUMN IF NOT EXISTS generation_model text;
