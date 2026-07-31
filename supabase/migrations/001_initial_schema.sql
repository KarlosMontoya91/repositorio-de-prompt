-- Prompt Repo / esquema inicial seguro para Supabase Free.
-- Ejecuta este archivo completo en Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  icon_key text not null default 'sparkles',
  color text not null default '#7c85eb' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 220),
  preview_text text check (preview_text is null or char_length(preview_text) <= 420),
  platform text,
  prompt_type text,
  tags text[] not null default '{}',
  access_level text not null default 'free' check (access_level in ('free', 'premium')),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency char(3) not null default 'MXN',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  copy_count bigint not null default 0 check (copy_count >= 0),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_requires_price check (
    (access_level = 'free' and price_cents = 0)
    or (access_level = 'premium' and price_cents > 0)
  )
);

-- El contenido completo vive separado de los metadatos públicos.
create table public.prompt_contents (
  prompt_id uuid primary key references public.prompts(id) on delete cascade,
  content text not null check (char_length(content) > 0),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

-- Preparada para un webhook futuro. El navegador no puede registrar compras.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete restrict,
  payment_provider text not null,
  provider_reference text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'MXN',
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prompts_category_idx on public.prompts(category_id);
create index prompts_public_list_idx on public.prompts(status, featured desc, created_at desc);
create index prompts_tags_idx on public.prompts using gin(tags);
create index favorites_user_idx on public.favorites(user_id);
create index purchases_access_idx on public.purchases(user_id, prompt_id, status);

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

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger prompts_updated_at before update on public.prompts
for each row execute function public.set_updated_at();
create trigger prompt_contents_updated_at before update on public.prompt_contents
for each row execute function public.set_updated_at();
create trigger purchases_updated_at before update on public.purchases
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select check_user is not null and exists (
    select 1 from public.admin_users where user_id = check_user
  );
$$;

create or replace function public.has_prompt_access(
  target_prompt uuid,
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin(check_user)
    or exists (
      select 1
      from public.prompts p
      where p.id = target_prompt
        and p.status = 'published'
        and p.access_level = 'free'
    )
    or exists (
      select 1
      from public.purchases purchase
      where purchase.prompt_id = target_prompt
        and purchase.user_id = check_user
        and purchase.status = 'paid'
    );
$$;

revoke all on function public.is_admin(uuid) from public;
revoke all on function public.has_prompt_access(uuid, uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;
grant execute on function public.has_prompt_access(uuid, uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_contents enable row level security;
alter table public.favorites enable row level security;
alter table public.purchases enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins_read_admin_list"
on public.admin_users for select
to authenticated
using (public.is_admin());

create policy "categories_public_read"
on public.categories for select
to anon, authenticated
using (is_active or public.is_admin());

create policy "categories_admin_insert"
on public.categories for insert
to authenticated
with check (public.is_admin());

create policy "categories_admin_update"
on public.categories for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "categories_admin_delete"
on public.categories for delete
to authenticated
using (public.is_admin());

create policy "prompts_public_metadata"
on public.prompts for select
to anon, authenticated
using (status = 'published' or public.is_admin());

create policy "prompts_admin_insert"
on public.prompts for insert
to authenticated
with check (public.is_admin());

create policy "prompts_admin_update"
on public.prompts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "prompts_admin_delete"
on public.prompts for delete
to authenticated
using (public.is_admin());

create policy "prompt_content_authorized_read"
on public.prompt_contents for select
to anon, authenticated
using (public.has_prompt_access(prompt_id));

create policy "prompt_content_admin_insert"
on public.prompt_contents for insert
to authenticated
with check (public.is_admin());

create policy "prompt_content_admin_update"
on public.prompt_contents for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "prompt_content_admin_delete"
on public.prompt_contents for delete
to authenticated
using (public.is_admin());

create policy "favorites_select_own"
on public.favorites for select
to authenticated
using (user_id = auth.uid());

create policy "favorites_insert_own"
on public.favorites for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.prompts p
    where p.id = favorites.prompt_id and p.status = 'published'
  )
);

create policy "favorites_delete_own"
on public.favorites for delete
to authenticated
using (user_id = auth.uid());

create policy "purchases_select_own"
on public.purchases for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "purchases_admin_insert"
on public.purchases for insert
to authenticated
with check (public.is_admin());

create policy "purchases_admin_update"
on public.purchases for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "purchases_admin_delete"
on public.purchases for delete
to authenticated
using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.prompts, public.prompt_contents to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.categories, public.prompts, public.prompt_contents to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.purchases to authenticated;
