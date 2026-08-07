-- Migration 014: Campaign AI Reviews
-- Stores complete AI intelligence analyses so users can track improvement over time.

CREATE TABLE IF NOT EXISTS campaign_ai_reviews (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score           integer     NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  sub_scores      jsonb       NOT NULL DEFAULT '{}',
  findings        jsonb       NOT NULL DEFAULT '[]',
  recommendations jsonb       NOT NULL DEFAULT '[]',
  prediction      jsonb,
  risks           jsonb       NOT NULL DEFAULT '[]',
  coach_advice    text,
  quick_wins      jsonb       NOT NULL DEFAULT '[]',
  summary         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_ai_reviews_campaign_idx
  ON campaign_ai_reviews(campaign_id, created_at DESC);

ALTER TABLE campaign_ai_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intelligence_select_own" ON campaign_ai_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "intelligence_insert_own" ON campaign_ai_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "intelligence_delete_own" ON campaign_ai_reviews
  FOR DELETE USING (auth.uid() = user_id);
