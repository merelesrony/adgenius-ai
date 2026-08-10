-- Migration 017: Meta Real Publication
-- Adds columns for tracking real Meta publication details.
-- Existing columns already present: meta_campaign_id, meta_adset_id, meta_ad_id,
-- meta_creative_id, sync_status, error_message, last_sync.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS meta_published_at       timestamptz,
  ADD COLUMN IF NOT EXISTS meta_account_id         text,
  ADD COLUMN IF NOT EXISTS meta_page_id            text,
  ADD COLUMN IF NOT EXISTS meta_instagram_actor_id text;

COMMENT ON COLUMN campaigns.meta_published_at       IS 'Timestamp when the campaign was successfully published to Meta Ads (all objects PAUSED)';
COMMENT ON COLUMN campaigns.meta_account_id         IS 'Meta Ads account ID used for publication (act_XXXXX format)';
COMMENT ON COLUMN campaigns.meta_page_id            IS 'Facebook Page ID associated with the ad creative';
COMMENT ON COLUMN campaigns.meta_instagram_actor_id IS 'Instagram actor ID used in the ad creative, if any';
