-- Campaign Builder Sessions
-- Stores autosaved progress while a user builds a campaign with Smart Builder.

CREATE TABLE IF NOT EXISTS campaign_builder_sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step    integer     NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 6),
  status          text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'abandoned')),
  selected_product jsonb,
  budget          jsonb,
  destination     jsonb,
  platforms       jsonb,
  ai_strategy     jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Dedicated function name to avoid conflicts with other tables
CREATE OR REPLACE FUNCTION update_campaign_builder_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_builder_sessions_updated_at ON campaign_builder_sessions;
CREATE TRIGGER campaign_builder_sessions_updated_at
  BEFORE UPDATE ON campaign_builder_sessions
  FOR EACH ROW EXECUTE FUNCTION update_campaign_builder_sessions_updated_at();

CREATE INDEX IF NOT EXISTS campaign_builder_sessions_user_status_idx
  ON campaign_builder_sessions(user_id, status, updated_at DESC);

ALTER TABLE campaign_builder_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "builder_select_own" ON campaign_builder_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "builder_insert_own" ON campaign_builder_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "builder_update_own" ON campaign_builder_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "builder_delete_own" ON campaign_builder_sessions
  FOR DELETE USING (auth.uid() = user_id);
