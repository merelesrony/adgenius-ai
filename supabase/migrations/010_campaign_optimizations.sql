-- Migration 010: AI Campaign Optimizer
-- Stores per-improvement suggestions from the AI optimizer

CREATE TABLE IF NOT EXISTS campaign_optimizations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  type         text        NOT NULL CHECK (type IN ('copy', 'audience', 'creative', 'budget', 'cta')),
  priority     text        NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  problem      text        NOT NULL,
  recommendation text      NOT NULL,
  before_value text,
  after_value  text,
  status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaign_optimizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own optimizations"
  ON campaign_optimizations FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optimizer analysis metadata stored on the campaign row
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS optimizer_score    integer,
  ADD COLUMN IF NOT EXISTS optimizer_summary  text,
  ADD COLUMN IF NOT EXISTS optimizer_strengths jsonb,
  ADD COLUMN IF NOT EXISTS optimizer_run_at   timestamptz;
