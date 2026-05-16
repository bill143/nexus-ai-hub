-- ============================================================
-- NEXUS AI Hub — Initial Schema
-- Phase 1: Foundation
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('admin', 'editor', 'viewer');
create type asset_priority as enum ('HIGH', 'MED', 'LOW');
create type asset_stage as enum ('BACKLOG', 'EVAL', 'PILOT', 'LIVE');
create type asset_category as enum (
  'RAG / Pipeline',
  'MCP',
  'LLM',
  'Agentic',
  'Eval',
  'Utility'
);
create type audit_action as enum (
  'asset.created',
  'asset.updated',
  'asset.deleted',
  'user.invited',
  'user.role_changed',
  'user.removed',
  'org.updated',
  'org.created'
);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  plan        text not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_organizations_slug on organizations(slug);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid references organizations(id) on delete set null,
  full_name   text,
  avatar_url  text,
  role        user_role not null default 'viewer',
  theme       text not null default 'dark',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_profiles_org_id on profiles(org_id);

-- ============================================================
-- ORG INVITES
-- ============================================================
create table org_invites (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  email       text not null,
  role        user_role not null default 'viewer',
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid references profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

create index idx_org_invites_token on org_invites(token);
create index idx_org_invites_org_id on org_invites(org_id);
create unique index idx_org_invites_email_org on org_invites(email, org_id) where accepted_at is null;

-- ============================================================
-- ASSETS
-- ============================================================
create table assets (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  name            text not null,
  category        asset_category not null,
  priority        asset_priority not null default 'LOW',
  stage           asset_stage not null default 'BACKLOG',
  fit             text,
  project         text,
  owner_id        uuid references profiles(id) on delete set null,
  repo_url        text,
  training_docs   text,
  requirements    text,
  notes           text,
  last_reviewed   date,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_assets_org_id on assets(org_id);
create index idx_assets_category on assets(category);
create index idx_assets_priority on assets(priority);
create index idx_assets_stage on assets(stage);
create index idx_assets_owner_id on assets(owner_id);

-- ============================================================
-- ASSET TAGS (many-to-many)
-- ============================================================
create table tags (
  id      uuid primary key default uuid_generate_v4(),
  org_id  uuid not null references organizations(id) on delete cascade,
  name    text not null,
  color   text not null default '#3B82F6',
  unique (org_id, name)
);

create table asset_tags (
  asset_id  uuid not null references assets(id) on delete cascade,
  tag_id    uuid not null references tags(id) on delete cascade,
  primary key (asset_id, tag_id)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  action      audit_action not null,
  entity_type text not null,
  entity_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index idx_audit_logs_org_id on audit_logs(org_id);
create index idx_audit_logs_user_id on audit_logs(user_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_created_at on audit_logs(created_at desc);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger trg_assets_updated_at
  before update on assets
  for each row execute function update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY — ENABLED ON ALL TABLES
-- ============================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table org_invites enable row level security;
alter table assets enable row level security;
alter table tags enable row level security;
alter table asset_tags enable row level security;
alter table audit_logs enable row level security;

-- ============================================================
-- RLS HELPER: get current user's org_id
-- ============================================================
create or replace function auth_org_id()
returns uuid language sql stable security definer as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function auth_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

-- ============================================================
-- RLS POLICIES: organizations
-- ============================================================
create policy "org_select_own" on organizations
  for select using (id = auth_org_id());

create policy "org_update_admin" on organizations
  for update using (id = auth_org_id() and auth_role() = 'admin');

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
create policy "profile_select_same_org" on profiles
  for select using (org_id = auth_org_id());

create policy "profile_update_own" on profiles
  for update using (id = auth.uid());

create policy "profile_update_admin" on profiles
  for update using (org_id = auth_org_id() and auth_role() = 'admin');

-- ============================================================
-- RLS POLICIES: org_invites
-- ============================================================
create policy "invite_select_admin" on org_invites
  for select using (org_id = auth_org_id() and auth_role() = 'admin');

create policy "invite_insert_admin" on org_invites
  for insert with check (org_id = auth_org_id() and auth_role() = 'admin');

create policy "invite_delete_admin" on org_invites
  for delete using (org_id = auth_org_id() and auth_role() = 'admin');

-- ============================================================
-- RLS POLICIES: assets
-- ============================================================
create policy "asset_select_org" on assets
  for select using (org_id = auth_org_id());

create policy "asset_insert_editor" on assets
  for insert with check (
    org_id = auth_org_id()
    and auth_role() in ('admin', 'editor')
  );

create policy "asset_update_editor" on assets
  for update using (
    org_id = auth_org_id()
    and auth_role() in ('admin', 'editor')
  );

create policy "asset_delete_admin" on assets
  for delete using (
    org_id = auth_org_id()
    and auth_role() = 'admin'
  );

-- ============================================================
-- RLS POLICIES: tags
-- ============================================================
create policy "tags_select_org" on tags
  for select using (org_id = auth_org_id());

create policy "tags_insert_editor" on tags
  for insert with check (org_id = auth_org_id() and auth_role() in ('admin', 'editor'));

create policy "tags_delete_admin" on tags
  for delete using (org_id = auth_org_id() and auth_role() = 'admin');

-- ============================================================
-- RLS POLICIES: asset_tags
-- ============================================================
create policy "asset_tags_select_org" on asset_tags
  for select using (
    exists (select 1 from assets where id = asset_id and org_id = auth_org_id())
  );

create policy "asset_tags_insert_editor" on asset_tags
  for insert with check (
    exists (select 1 from assets where id = asset_id and org_id = auth_org_id())
    and auth_role() in ('admin', 'editor')
  );

create policy "asset_tags_delete_editor" on asset_tags
  for delete using (
    exists (select 1 from assets where id = asset_id and org_id = auth_org_id())
    and auth_role() in ('admin', 'editor')
  );

-- ============================================================
-- RLS POLICIES: audit_logs
-- ============================================================
create policy "audit_select_admin" on audit_logs
  for select using (org_id = auth_org_id() and auth_role() = 'admin');

-- Only server-side inserts allowed (service_role key bypasses RLS)
-- No client-side insert policy intentionally
