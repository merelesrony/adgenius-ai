-- ============================================================
-- AdGenius AI — Database Migration v1
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUM TYPES ───────────────────────────────────────────────
CREATE TYPE user_role           AS ENUM ('admin', 'client');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'trial', 'cancelled');
CREATE TYPE subscription_plan   AS ENUM ('starter', 'professional', 'agency');
CREATE TYPE campaign_status     AS ENUM ('draft', 'pending', 'active', 'paused', 'completed', 'failed');
CREATE TYPE audience_mode       AS ENUM ('manual', 'ai');
CREATE TYPE gender_target       AS ENUM ('all', 'male', 'female');

-- ── TABLES ───────────────────────────────────────────────────

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role       user_role DEFAULT 'client' NOT NULL,
  is_active  BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- businesses (1:1 with profiles, separate for scalability)
CREATE TABLE businesses (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  website     TEXT,
  phone       TEXT,
  country     TEXT,
  city        TEXT,
  address     TEXT,
  logo_url    TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- plans (catalog — seeded below)
CREATE TABLE plans (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                 subscription_plan NOT NULL UNIQUE,
  display_name         TEXT NOT NULL,
  price_monthly        DECIMAL(10,2) NOT NULL,
  campaign_limit       INTEGER NOT NULL,   -- -1 = unlimited
  product_limit        INTEGER NOT NULL,
  ai_generations_limit INTEGER NOT NULL,
  meta_accounts_limit  INTEGER NOT NULL,
  features             JSONB DEFAULT '[]'::jsonb,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- subscriptions
CREATE TABLE subscriptions (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id                UUID REFERENCES plans(id) NOT NULL,
  status                 subscription_status DEFAULT 'trial' NOT NULL,
  price_paid             DECIMAL(10,2),
  currency               TEXT DEFAULT 'USD',
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  trial_ends_at          TIMESTAMPTZ,
  cancelled_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at             TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- products
CREATE TABLE products (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10,2),
  currency    TEXT DEFAULT 'USD',
  category    TEXT,
  images      JSONB DEFAULT '[]'::jsonb,
  is_active   BOOLEAN DEFAULT true NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- campaigns
CREATE TABLE campaigns (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  status           campaign_status DEFAULT 'draft' NOT NULL,
  target_country   TEXT,
  target_city      TEXT,
  target_radius_km INTEGER DEFAULT 20,
  audience_mode    audience_mode DEFAULT 'manual' NOT NULL,
  target_age_min   INTEGER DEFAULT 18,
  target_age_max   INTEGER DEFAULT 65,
  target_gender    gender_target DEFAULT 'all' NOT NULL,
  target_interests JSONB DEFAULT '[]'::jsonb,
  daily_budget     DECIMAL(10,2),
  total_budget     DECIMAL(10,2),
  currency         TEXT DEFAULT 'USD',
  start_date       DATE,
  end_date         DATE,
  meta_campaign_id TEXT,
  meta_adset_id    TEXT,
  meta_ad_id       TEXT,
  ai_copy          JSONB,     -- {headline, body, description, cta}
  ai_audience      JSONB,
  flyer_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- campaign_stats (daily metrics from Meta)
CREATE TABLE campaign_stats (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks      INTEGER DEFAULT 0,
  spend       DECIMAL(10,2) DEFAULT 0,
  reach       INTEGER DEFAULT 0,
  ctr         DECIMAL(5,4),
  cpc         DECIMAL(10,2),
  cpm         DECIMAL(10,2),
  conversions INTEGER DEFAULT 0,
  UNIQUE(campaign_id, date),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- meta_accounts (connected Facebook accounts)
CREATE TABLE meta_accounts (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id            UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meta_user_id       TEXT NOT NULL,
  meta_ad_account_id TEXT NOT NULL,
  page_id            TEXT,
  access_token       TEXT NOT NULL,   -- should be encrypted at rest in production
  token_expires_at   TIMESTAMPTZ,
  account_name       TEXT,
  currency           TEXT,
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ai_usage (tracks API consumption per user)
CREATE TABLE ai_usage (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('copy', 'audience', 'flyer')),
  tokens_used INTEGER,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs (immutable action trail)
CREATE TABLE audit_logs (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}'::jsonb,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX idx_businesses_user_id    ON businesses(user_id);
CREATE INDEX idx_sub_user_id           ON subscriptions(user_id);
CREATE INDEX idx_sub_status            ON subscriptions(status);
CREATE INDEX idx_products_user_id      ON products(user_id);
CREATE INDEX idx_products_is_active    ON products(is_active);
CREATE INDEX idx_campaigns_user_id     ON campaigns(user_id);
CREATE INDEX idx_campaigns_status      ON campaigns(status);
CREATE INDEX idx_campaigns_product_id  ON campaigns(product_id);
CREATE INDEX idx_stats_campaign_date   ON campaign_stats(campaign_id, date);
CREATE INDEX idx_ai_usage_user_date    ON ai_usage(user_id, created_at);
CREATE INDEX idx_audit_user_id         ON audit_logs(user_id);
CREATE INDEX idx_audit_entity          ON audit_logs(entity_type, entity_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;

-- Helper function: check if caller is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- profiles
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all"    ON profiles FOR ALL    USING (is_admin());

-- businesses
CREATE POLICY "businesses_own"        ON businesses FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "businesses_admin_read" ON businesses FOR SELECT USING (is_admin());

-- subscriptions
CREATE POLICY "sub_own"               ON subscriptions FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "sub_admin"             ON subscriptions FOR ALL    USING (is_admin());

-- products
CREATE POLICY "products_own"          ON products FOR ALL USING (auth.uid() = user_id);

-- campaigns
CREATE POLICY "campaigns_own"         ON campaigns FOR ALL USING (auth.uid() = user_id);

-- campaign_stats (read-only for campaign owners)
CREATE POLICY "stats_via_campaign"    ON campaign_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
);

-- meta_accounts
CREATE POLICY "meta_own"              ON meta_accounts FOR ALL USING (auth.uid() = user_id);

-- ai_usage
CREATE POLICY "ai_own"                ON ai_usage FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "ai_admin"              ON ai_usage FOR SELECT USING (is_admin());

-- audit_logs (append-only for admins)
CREATE POLICY "audit_admin_read"      ON audit_logs FOR SELECT USING (is_admin());

-- plans table is public read
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read"     ON plans FOR SELECT USING (true);

-- ── FUNCTIONS & TRIGGERS ────────────────────────────────────

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, role) VALUES (NEW.id, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER t_profiles_upd    BEFORE UPDATE ON profiles       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_businesses_upd  BEFORE UPDATE ON businesses     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_sub_upd         BEFORE UPDATE ON subscriptions  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_products_upd    BEFORE UPDATE ON products       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_campaigns_upd   BEFORE UPDATE ON campaigns      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_meta_upd        BEFORE UPDATE ON meta_accounts  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Function to check if user is within their plan limits
CREATE OR REPLACE FUNCTION check_campaign_limit(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  SELECT p.campaign_limit INTO v_limit
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_limit = -1 THEN RETURN true; END IF;
  IF v_limit IS NULL THEN RETURN false; END IF;

  SELECT COUNT(*) INTO v_count
  FROM campaigns
  WHERE user_id = p_user_id AND status NOT IN ('completed', 'failed');

  RETURN v_count < v_limit;
END;
$$;

-- ── SEED: Plans ─────────────────────────────────────────────

INSERT INTO plans (name, display_name, price_monthly, campaign_limit, product_limit, ai_generations_limit, meta_accounts_limit, features) VALUES
('starter', 'Starter', 29.00, 5, 10, 20, 1,
  '["5 campañas activas","10 productos","20 generaciones IA/mes","1 cuenta Meta Ads","Soporte por email"]'::jsonb),
('professional', 'Professional', 79.00, 20, 50, 100, 3,
  '["20 campañas activas","50 productos","100 generaciones IA/mes","3 cuentas Meta Ads","Estadísticas avanzadas","Soporte prioritario"]'::jsonb),
('agency', 'Agency', 199.00, -1, -1, 500, 10,
  '["Campañas ilimitadas","Productos ilimitados","500 generaciones IA/mes","10 cuentas Meta Ads","API access","White label","Soporte dedicado"]'::jsonb);

-- ── SEED: Admin user (update email after running) ────────────
-- After running this migration, go to Supabase Auth, find your
-- user UUID, and run:
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR-USER-UUID';
