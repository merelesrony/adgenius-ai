-- Migration: marketing_strategies
-- Stores AI-generated marketing strategies.
-- Run in Supabase SQL editor or via: supabase db push

create table if not exists marketing_strategies (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references profiles(id) on delete cascade,
  product_name        text        not null,
  product_description text,
  product_price       decimal,
  product_currency    text        not null default 'USD',
  product_category    text,
  strategy_json       jsonb       not null,
  created_at          timestamptz not null default now()
);

alter table marketing_strategies enable row level security;

create policy "Users manage their own strategies"
  on marketing_strategies
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists marketing_strategies_user_id_idx
  on marketing_strategies (user_id);

create index if not exists marketing_strategies_created_at_idx
  on marketing_strategies (created_at desc);
