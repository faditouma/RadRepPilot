create table public.education_editor_roles(user_id uuid primary key references auth.users(id), role text not null check(role in ('author','reviewer','administrator')));
alter table public.education_editor_roles enable row level security;
revoke all on public.education_editor_roles from anon,authenticated;
grant select on public.education_editor_roles to authenticated;
create policy editor_role_self on public.education_editor_roles for select to authenticated using(user_id=(select auth.uid()));
create function public.education_is_editor() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.education_editor_roles where user_id=auth.uid())$$;
revoke all on function public.education_is_editor() from public; grant execute on function public.education_is_editor() to authenticated;
create table public.education_teaching_cases (
 case_id text not null, case_version integer not null check(case_version>0), primary key(case_id,case_version),
 purpose text not null check(purpose in ('demonstration','diagnostic_candidate')),
 clinical_status text not null default 'draft' check(clinical_status in ('draft','clinical_review','approved','retired')),
 rights_status text not null default 'verified' check(rights_status in ('verified','unknown','prohibited')),
 privacy_status text not null default 'pending' check(privacy_status in ('pending','approved')),
 reference_report jsonb not null default '{}', expected_findings jsonb not null default '[]', acceptable_alternatives jsonb not null default '[]', key_negatives jsonb not null default '[]', critical_errors jsonb not null default '[]',
 source_interpretation jsonb not null default '{}', teaching_notes text not null default '', review_comment text not null default '',
 submitted_by uuid references auth.users(id), submitted_at timestamptz, reviewer_id uuid references auth.users(id), reviewed_at timestamptz,
 updated_at timestamptz not null default now(), check(octet_length(reference_report::text)+octet_length(expected_findings::text)+octet_length(source_interpretation::text)<65536)
);
alter table public.education_teaching_cases enable row level security;
revoke all on public.education_teaching_cases from anon,authenticated;
grant select on public.education_teaching_cases to authenticated;
create policy references_editor_only on public.education_teaching_cases for select to authenticated using((select public.education_is_editor()));
alter table public.education_ohif_drafts add column structured_answers jsonb not null default '{}', add column generated_report jsonb not null default '{}', add column workflow_id text, add column workflow_version text;
alter table public.education_ohif_attempts add column structured_answers jsonb not null default '{}', add column generated_report jsonb not null default '{}', add column workflow_id text, add column workflow_version text;
create table public.education_self_assessments(attempt_id uuid primary key references public.education_ohif_attempts(id),user_id uuid not null references auth.users(id),ratings jsonb not null,reflection text not null default '',updated_at timestamptz not null default now(),check(octet_length(ratings::text)<32768 and length(reflection)<=8000));
alter table public.education_self_assessments enable row level security;
revoke all on public.education_self_assessments from anon,authenticated;grant select,insert,update on public.education_self_assessments to authenticated;
create policy self_assessment_owner on public.education_self_assessments for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.education_ohif_attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
create function public.education_save_reference(p_case text,p_version integer,p_fields jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.education_is_editor() then raise exception 'Editorial permission required';end if;
 if octet_length(p_fields::text)>60000 then raise exception 'Reference too large';end if;
 if exists(select 1 from public.education_teaching_cases where case_id=p_case and case_version=p_version and clinical_status in ('approved','retired')) then raise exception 'Immutable version: create a revision';end if;
 if jsonb_typeof(p_fields->'expected_findings')<>'array' or jsonb_typeof(p_fields->'acceptable_alternatives')<>'array' or jsonb_typeof(p_fields->'key_negatives')<>'array' or jsonb_typeof(p_fields->'critical_errors')<>'array' or jsonb_typeof(p_fields->'reference_report')<>'object' then raise exception 'Invalid reference schema';end if;
 update public.education_teaching_cases set reference_report=p_fields->'reference_report',expected_findings=p_fields->'expected_findings',acceptable_alternatives=p_fields->'acceptable_alternatives',key_negatives=p_fields->'key_negatives',critical_errors=p_fields->'critical_errors',teaching_notes=coalesce(p_fields->>'teaching_notes',''),clinical_status='draft',reviewer_id=null,reviewed_at=null,updated_at=now() where case_id=p_case and case_version=p_version;
 if not found then raise exception 'Unknown imported case version';end if;
end $$;
create function public.education_review_case(p_case text,p_version integer,p_action text,p_comment text) returns void language plpgsql security definer set search_path='' as $$
declare c public.education_teaching_cases; r text;
begin
 select role into r from public.education_editor_roles where user_id=auth.uid(); if r is null then raise exception 'Editorial permission required';end if;
 select * into c from public.education_teaching_cases where case_id=p_case and case_version=p_version for update;
 if not found then raise exception 'Case unavailable';end if;
 if p_action='submit_review' and c.clinical_status='draft' then update public.education_teaching_cases set clinical_status='clinical_review',submitted_by=auth.uid(),submitted_at=now(),review_comment=p_comment where case_id=p_case and case_version=p_version;
 elsif p_action='approve' and r='reviewer' and c.clinical_status='clinical_review' then
  if c.purpose='demonstration' or c.rights_status<>'verified' or c.privacy_status<>'approved' or length(trim(coalesce(c.reference_report->>'findings','')))=0 or length(trim(coalesce(c.reference_report->>'impression','')))=0 or jsonb_array_length(c.expected_findings)=0 or c.source_interpretation='{}'::jsonb then raise exception 'Clinical, privacy, source evidence and reference gates not satisfied';end if;
  update public.education_teaching_cases set clinical_status='approved',reviewer_id=auth.uid(),reviewed_at=now(),review_comment=p_comment where case_id=p_case and case_version=p_version;
 elsif p_action='privacy_approve' and r='reviewer' and c.clinical_status not in ('approved','retired') and length(trim(p_comment))>20 then update public.education_teaching_cases set privacy_status='approved',review_comment=p_comment where case_id=p_case and case_version=p_version;
 elsif p_action='return_draft' and r in ('reviewer','administrator') and c.clinical_status='clinical_review' then update public.education_teaching_cases set clinical_status='draft',review_comment=p_comment where case_id=p_case and case_version=p_version;
 elsif p_action='retire' and r in ('reviewer','administrator') then update public.education_teaching_cases set clinical_status='retired',review_comment=p_comment where case_id=p_case and case_version=p_version;
 else raise exception 'Role or workflow transition not permitted';end if;
end $$;
create function public.education_case_status(p_case text,p_version integer) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('clinical_status',clinical_status,'privacy_status',privacy_status,'purpose',purpose,'rights_status',rights_status) from public.education_teaching_cases where case_id=p_case and case_version=p_version$$;
create function public.education_feedback(p_attempt uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.education_ohif_attempts; c public.education_teaching_cases;
begin
 select * into a from public.education_ohif_attempts where id=p_attempt and user_id=auth.uid();if not found then raise exception 'Owned submitted attempt required';end if;
 select * into c from public.education_teaching_cases where case_id=a.case_id and case_version=a.case_version;
 if not found or c.clinical_status<>'approved' then return jsonb_build_object('status','pending_clinical_review','case_version',a.case_version,'automated_grading',false);end if;
 return jsonb_build_object('status','approved','case_version',c.case_version,'reference_report',c.reference_report,'expected_findings',c.expected_findings,'acceptable_alternatives',c.acceptable_alternatives,'key_negatives',c.key_negatives,'critical_errors',c.critical_errors,'teaching_notes',c.teaching_notes,'reviewer_id',c.reviewer_id,'reviewed_at',c.reviewed_at,'automated_grading',false);
end $$;
revoke all on function public.education_save_reference(text,integer,jsonb), public.education_review_case(text,integer,text,text), public.education_case_status(text,integer), public.education_feedback(uuid) from public;
grant execute on function public.education_save_reference(text,integer,jsonb), public.education_review_case(text,integer,text,text), public.education_case_status(text,integer), public.education_feedback(uuid) to authenticated;
insert into public.education_teaching_cases(case_id,case_version,purpose) values('ct-001',2,'demonstration'),('ct-002',1,'diagnostic_candidate');
