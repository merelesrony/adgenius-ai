-- Migration 015: Meta Ads Connections
-- Stores encrypted OAuth tokens and selected Meta Ads accounts per user.

CREATE TABLE IF NOT EXISTS meta_connections (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_user_id             text        NOT NULL,
  meta_user_name           text,
  access_token_enc         text        NOT NULL,
  token_type               text        NOT NULL DEFAULT 'bearer',
  expires_at               timestamptz,
  scopes                   text[]      NOT NULL DEFAULT '{}',
  selected_ad_account_id   text,
  selected_ad_account_name text,
  selected_page_id         text,
  selected_page_name       text,
  selected_instagram_id    text,
  business_portfolio       jsonb,
  ad_accounts              jsonb       NOT NULL DEFAULT '[]',
  pages                    jsonb       NOT NULL DEFAULT '[]',
  instagram_accounts       jsonb       NOT NULL DEFAULT '[]',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS meta_connections_user_idx
  ON meta_connections(user_id);

ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_select_own" ON meta_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "meta_insert_own" ON meta_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meta_update_own" ON meta_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meta_delete_own" ON meta_connections
  FOR DELETE USING (auth.uid() = user_id);
