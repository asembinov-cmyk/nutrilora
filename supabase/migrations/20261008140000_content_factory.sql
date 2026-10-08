-- Контент-завод Nutrilora.
-- Схема для нового проекта Supabase. Демо-строки не вставляются.
-- Браузер потом ходит с ключом anon и сессией пользователя.
-- service_role в этот скрипт для клиента не закладывается.

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Профиль вошедшего пользователя. Строка создаётся при регистрации.';

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  handle text not null,
  niche text not null default '',
  language text not null,
  per_day integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_language_check check (language in ('ru', 'kk')),
  constraint accounts_per_day_check check (per_day between 0 and 6),
  constraint accounts_name_check check (char_length(btrim(name)) > 0),
  constraint accounts_handle_check check (char_length(btrim(handle)) > 0),
  constraint accounts_owner_handle_unique unique (owner_id, handle)
);

comment on table public.accounts is
  'Аккаунты TikTok: название, @handle, ниша, язык ru/kk и план роликов в день.';

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  title text not null,
  language text not null,
  stage text not null default 'topic',
  script text not null default '',
  gloss text,
  duration text not null default '0:30',
  cost_voice integer,
  cost_avatar integer,
  cost_assembly integer,
  views integer,
  likes integer,
  comments integer,
  shares integer,
  issue_title text,
  issue_detail text,
  issue_dismissed boolean not null default false,
  scheduled_on date,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_title_check check (char_length(btrim(title)) > 0),
  constraint content_language_check check (language in ('ru', 'kk')),
  constraint content_stage_check check (stage in ('topic', 'script', 'generation', 'review', 'ready')),
  constraint content_cost_check check (
    (cost_voice is null and cost_avatar is null and cost_assembly is null)
    or (
      cost_voice is not null and cost_avatar is not null and cost_assembly is not null
      and cost_voice >= 0 and cost_avatar >= 0 and cost_assembly >= 0
    )
  ),
  constraint content_stats_check check (
    (views is null and likes is null and comments is null and shares is null)
    or (
      views is not null and likes is not null and comments is not null and shares is not null
      and views >= 0 and likes >= 0 and comments >= 0 and shares >= 0
    )
  ),
  constraint content_issue_check check (
    (issue_title is null and issue_detail is null)
    or (issue_title is not null and issue_detail is not null)
  ),
  constraint content_calendar_check check (
    (scheduled_on is null and not published)
    or (stage = 'ready' and scheduled_on is not null)
  )
);

comment on table public.content_items is
  'Ролик на линии: тема, сценарий, генерация, проверка, готово. Календарь — scheduled_on и published.';
comment on column public.content_items.gloss is
  'Учебный подстрочник для казахского сценария. В ролик не попадает.';
comment on column public.content_items.cost_voice is
  'Оценка озвучки в тенге. Все три поля стоимости пустые, пока расход не начислен.';
comment on column public.content_items.scheduled_on is
  'Дата слота в календаре публикаций. Пусто, пока ролик не поставлен в слот.';

create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  position integer not null default 0,
  title text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint content_sources_title_check check (char_length(btrim(title)) > 0),
  constraint content_sources_position_check check (position >= 0)
);

comment on table public.content_sources is
  'Источники сценария, которые редактор видит рядом с текстом.';

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  decision text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint approvals_decision_check check (decision in ('approved', 'revision')),
  constraint approvals_note_check check (
    decision = 'approved'
    or (note is not null and char_length(btrim(note)) >= 8)
  )
);

comment on table public.approvals is
  'Решения редактора: approved — «Согласовать», revision — «На доработку».';

create index accounts_owner_idx on public.accounts (owner_id);
create index content_owner_stage_idx on public.content_items (owner_id, stage);
create index content_account_idx on public.content_items (account_id);
create index content_calendar_idx on public.content_items (owner_id, scheduled_on)
  where scheduled_on is not null;
create index content_sources_content_idx on public.content_sources (content_id, position);
create index approvals_content_idx on public.approvals (content_id, created_at desc);

create or replace function public.content_matches_account_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  account_owner uuid;
begin
  select owner_id into account_owner
  from public.accounts
  where id = new.account_id;

  if account_owner is null or account_owner is distinct from new.owner_id then
    raise exception 'Ролик и аккаунт должны принадлежать одному владельцу';
  end if;

  return new;
end;
$$;

create trigger content_items_owner_match
  before insert or update of account_id, owner_id on public.content_items
  for each row execute function public.content_matches_account_owner();

create or replace function public.child_matches_content_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  content_owner uuid;
begin
  select owner_id into content_owner
  from public.content_items
  where id = new.content_id;

  if content_owner is null or content_owner is distinct from new.owner_id then
    raise exception 'Запись и ролик должны принадлежать одному владельцу';
  end if;

  return new;
end;
$$;

create trigger content_sources_owner_match
  before insert or update of content_id, owner_id on public.content_sources
  for each row execute function public.child_matches_content_owner();

create trigger approvals_owner_match
  before insert or update of content_id, owner_id on public.approvals
  for each row execute function public.child_matches_content_owner();

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.approve_content(p_content_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  update public.content_items
  set stage = 'ready'
  where id = p_content_id
    and owner_id = auth.uid()
    and stage = 'review'
    and (issue_title is null or issue_dismissed)
  returning id into updated_id;

  if updated_id is null then
    raise exception 'Согласование доступно на этапе «Проверка», когда учебная ошибка снята';
  end if;

  insert into public.approvals (owner_id, content_id, decision)
  values (auth.uid(), p_content_id, 'approved');
end;
$$;

create or replace function public.request_revision(p_content_id uuid, p_note text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  if p_note is null or char_length(btrim(p_note)) < 8 then
    raise exception 'Комментарий к доработке должен быть не короче 8 символов';
  end if;

  update public.content_items
  set
    stage = 'script',
    scheduled_on = null,
    published = false
  where id = p_content_id
    and owner_id = auth.uid()
    and stage <> 'topic'
    and not published
  returning id into updated_id;

  if updated_id is null then
    raise exception 'На доработку возвращается неопубликованный ролик после этапа «Темы»';
  end if;

  insert into public.approvals (owner_id, content_id, decision, note)
  values (auth.uid(), p_content_id, 'revision', btrim(p_note));
end;
$$;

revoke all on function public.approve_content(uuid) from public, anon;
revoke all on function public.request_revision(uuid, text) from public, anon;
revoke all on function public.content_matches_account_owner() from public, anon, authenticated;
revoke all on function public.child_matches_content_owner() from public, anon, authenticated;
grant execute on function public.approve_content(uuid) to authenticated;
grant execute on function public.request_revision(uuid, text) to authenticated;

create view public.publication_calendar
with (security_invoker = true) as
select
  id as content_id,
  owner_id,
  account_id,
  title,
  language,
  stage,
  scheduled_on,
  published
from public.content_items
where scheduled_on is not null;

comment on view public.publication_calendar is
  'Слоты календаря. Видны только строки владельца, потому что запрос идёт от его имени.';

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.content_items enable row level security;
alter table public.content_sources enable row level security;
alter table public.approvals enable row level security;

revoke all on table public.profiles from anon, public;
revoke all on table public.accounts from anon, public;
revoke all on table public.content_items from anon, public;
revoke all on table public.content_sources from anon, public;
revoke all on table public.approvals from anon, public;
revoke all on table public.publication_calendar from anon, public;

grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.accounts to authenticated;
grant select, insert, update, delete on table public.content_items to authenticated;
grant select, insert, update, delete on table public.content_sources to authenticated;
grant select, insert, update, delete on table public.approvals to authenticated;
grant select on table public.publication_calendar to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy accounts_own
  on public.accounts
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy content_items_own
  on public.content_items
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.accounts
      where accounts.id = content_items.account_id
        and accounts.owner_id = auth.uid()
    )
  );

create policy content_sources_own
  on public.content_sources
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.content_items
      where content_items.id = content_sources.content_id
        and content_items.owner_id = auth.uid()
    )
  );

create policy approvals_own
  on public.approvals
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.content_items
      where content_items.id = approvals.content_id
        and content_items.owner_id = auth.uid()
    )
  );

commit;
