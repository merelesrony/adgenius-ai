-- Add creative engine columns to campaign_builder_sessions
-- Applied after 007_campaign_builder_sessions.sql

ALTER TABLE campaign_builder_sessions
  ADD COLUMN IF NOT EXISTS creatives           jsonb,
  ADD COLUMN IF NOT EXISTS brand_kit           jsonb,
  ADD COLUMN IF NOT EXISTS selected_creative_id text;
