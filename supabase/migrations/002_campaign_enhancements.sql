-- ============================================================
-- AdGenius AI — Migration v2: Campaign Enhancements
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── NEW COLUMNS: campaigns ───────────────────────────────────

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS objective          TEXT DEFAULT 'sales',
  ADD COLUMN IF NOT EXISTS target_languages   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS campaign_score     INTEGER CHECK (campaign_score >= 0 AND campaign_score <= 100),
  ADD COLUMN IF NOT EXISTS ai_generated       BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS ai_score_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS facebook_campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS facebook_adset_id    TEXT,
  ADD COLUMN IF NOT EXISTS facebook_ad_id       TEXT,
  ADD COLUMN IF NOT EXISTS sync_status          TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS error_message        TEXT,
  ADD COLUMN IF NOT EXISTS last_sync            TIMESTAMPTZ;

-- Denormalized product snapshot (for campaigns with inline products)
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS product_name        TEXT,
  ADD COLUMN IF NOT EXISTS product_description TEXT,
  ADD COLUMN IF NOT EXISTS product_price       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS product_currency    TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS product_category    TEXT;

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaigns_score      ON campaigns(campaign_score DESC) WHERE campaign_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_ai_gen     ON campaigns(ai_generated);
CREATE INDEX IF NOT EXISTS idx_campaigns_objective  ON campaigns(objective);

-- ── STORAGE: product images bucket ───────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "product_images_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read of product images
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow users to delete their own images
CREATE POLICY "product_images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── FUNCTION: get_campaign_stats_for_user ───────────────────

CREATE OR REPLACE FUNCTION get_campaign_stats(p_user_id UUID)
RETURNS TABLE (
  draft_count    BIGINT,
  ready_count    BIGINT,
  active_count   BIGINT,
  avg_score      NUMERIC
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'draft')                     AS draft_count,
    COUNT(*) FILTER (WHERE status = 'pending' AND ai_generated)  AS ready_count,
    COUNT(*) FILTER (WHERE status IN ('active', 'paused'))       AS active_count,
    ROUND(AVG(campaign_score) FILTER (WHERE campaign_score IS NOT NULL), 0) AS avg_score
  FROM campaigns
  WHERE user_id = p_user_id;
$$;
