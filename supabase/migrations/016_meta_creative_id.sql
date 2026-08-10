-- Migration 016: Add meta_creative_id to campaigns
-- Stores the Meta Ad Creative ID returned by the Marketing API after publishing.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS meta_creative_id TEXT;
