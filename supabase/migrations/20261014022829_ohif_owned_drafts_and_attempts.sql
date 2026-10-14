create table if not exists public.education_ohif_drafts (
 user_id uuid not null references auth.users(id) on delete cascade,
 case_id text not null check(case_id ~ '^ct-[a-z0-9-]{3,60}$'),
 case_version integer not null check(case_version>0), viewer_version text not null,
 report jsonb not null check(jsonb_typeof(report)='object' and octet_length(report::text)<=65536),
 updated_at timestamptz not null default now(),primary key(user_id,case_id,case_version)
);
alter table public.education_ohif_drafts enable row level security;
revoke all on public.education_ohif_drafts from anon,authenticated;
grant select,insert,update on public.education_ohif_drafts to authenticated;
create policy ohif_drafts_select_own on public.education_ohif_drafts for select to authenticated using((select auth.uid())=user_id);
create policy ohif_drafts_insert_own on public.education_ohif_drafts for insert to authenticated with check((select auth.uid())=user_id);
create policy ohif_drafts_update_own on public.education_ohif_drafts for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create table if not exists public.education_ohif_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 case_id text not null check(case_id ~ '^ct-[a-z0-9-]{3,60}$'),case_version integer not null check(case_version>0),viewer_version text not null,
 report jsonb not null check(jsonb_typeof(report)='object' and octet_length(report::text)<=65536),submitted_at timestamptz not null default now(),clinical_review_status text not null default 'unreviewed' check(clinical_review_status='unreviewed')
);
alter table public.education_ohif_attempts enable row level security;
revoke all on public.education_ohif_attempts from anon,authenticated;
grant select,insert on public.education_ohif_attempts to authenticated;
create policy ohif_attempts_select_own on public.education_ohif_attempts for select to authenticated using((select auth.uid())=user_id);
create policy ohif_attempts_insert_own on public.education_ohif_attempts for insert to authenticated with check((select auth.uid())=user_id);
create index if not exists education_ohif_attempts_owner on public.education_ohif_attempts(user_id,submitted_at desc);
