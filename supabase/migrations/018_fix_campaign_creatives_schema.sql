-- Migration 018: Fix campaign_creatives schema
-- Root cause: 006_creative_library.sql ran before 20240731_campaign_creatives.sql
-- (alphabetical sort, "0" < "2") so the ALTER TABLE failed silently on the remote
-- because the table did not exist yet. This migration re-applies those four columns
-- idempotently using ADD COLUMN IF NOT EXISTS.

ALTER TABLE campaign_creatives
  ADD COLUMN IF NOT EXISTS product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS category    TEXT,
  ADD COLUMN IF NOT EXISTS is_primary  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_campaign_creatives_product_id
  ON campaign_creatives(product_id);

CREATE INDEX IF NOT EXISTS idx_campaign_creatives_user_favorite
  ON campaign_creatives(user_id, is_favorite);
