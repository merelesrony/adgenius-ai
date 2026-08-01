-- Migration: campaign_creatives
-- Stores AI-generated creative images per user/campaign.
-- Run this in the Supabase SQL editor or via supabase db push.

create table if not exists campaign_creatives (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  campaign_id uuid        references campaigns(id) on delete set null,
  image_url   text        not null,
  prompt      text        not null,
  model       text        not null default 'flux',
  format      text        not null default 'square',
  preset_id   text,
  created_at  timestamptz not null default now()
);

-- Row-level security
alter table campaign_creatives enable row level security;

create policy "Users manage their own creatives"
  on campaign_creatives
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index if not exists campaign_creatives_user_id_idx
  on campaign_creatives (user_id);

create index if not exists campaign_creatives_campaign_id_idx
  on campaign_creatives (campaign_id);
