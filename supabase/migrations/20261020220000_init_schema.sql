-- Minnie Design schema.
-- Access model:
--   anon/authenticated  read the active catalog and store settings
--   authenticated       read their own profile, orders and custom requests
--   admins              (rows in public.admins) manage everything through RLS
--   service_role        used only on the server: places orders, stores uploads,
--                       runs rate limiting and guest order tracking

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-------------------------------------------------------------------------------
-- Types
-------------------------------------------------------------------------------
create type public.order_status as enum (
  'pending', 'confirmed', 'in_production', 'out_for_delivery', 'delivered', 'cancelled'
);
create type public.payment_status as enum (
  'pending', 'awaiting_review', 'paid', 'rejected', 'refunded'
);
create type public.payment_method as enum (
  'cash_on_delivery', 'instapay', 'vodafone_cash'
);
create type public.request_status as enum (
  'new', 'quoted', 'accepted', 'in_progress', 'completed', 'declined'
);

-------------------------------------------------------------------------------
-- Helpers
-------------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- Users
-------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  phone text check (phone is null or phone ~ '^01[0125][0-9]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Security invoker: it reads public.admins through RLS, where a user can only
-- see their own row. That is enough to answer "am I an admin?".
create function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- Creates the profile row for every new auth user. Lives in the private
-- schema, so it is not reachable through the Data API.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-------------------------------------------------------------------------------
-- Catalog
-------------------------------------------------------------------------------
create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- options: [{ "name": "Paper", "choices": [{ "label": "Matte", "price": 0 }] }]
create table public.products (
  id bigint generated always as identity primary key,
  category_id smallint not null references public.categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(10, 2) not null check (price >= 0),
  unit text not null default 'per design' check (char_length(unit) <= 40),
  is_customizable boolean not null default false,
  options jsonb not null default '[]' check (jsonb_typeof(options) = 'array'),
  images text[] not null default '{}' check (cardinality(images) <= 8),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);

create trigger products_updated_at before update on public.products
  for each row execute function private.set_updated_at();

-- Single-row store settings. shipping_zones: [{ "name": "Port Said", "fee": 30 }]
create table public.store_settings (
  id boolean primary key default true check (id),
  shipping_zones jsonb not null default '[]' check (jsonb_typeof(shipping_zones) = 'array'),
  instapay_handle text not null default '' check (char_length(instapay_handle) <= 120),
  vodafone_cash_number text not null default '' check (char_length(vodafone_cash_number) <= 20),
  instagram_url text not null default '' check (char_length(instagram_url) <= 300),
  whatsapp_number text not null default '' check (char_length(whatsapp_number) <= 20),
  accepting_orders boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function private.set_updated_at();

-------------------------------------------------------------------------------
-- Orders
-------------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_phone text not null check (customer_phone ~ '^01[0125][0-9]{8}$'),
  customer_email text check (customer_email is null or char_length(customer_email) <= 190),
  area text not null check (char_length(area) <= 60),
  district text not null check (char_length(district) between 2 and 100),
  address text not null check (char_length(address) between 3 and 300),
  notes text check (notes is null or char_length(notes) <= 1000),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_fee numeric(10, 2) not null check (shipping_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  order_status public.order_status not null default 'pending',
  payment_proof_path text,
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (order_status);

create trigger orders_updated_at before update on public.orders
  for each row execute function private.set_updated_at();

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity between 1 and 99),
  line_total numeric(10, 2) not null check (line_total >= 0),
  options jsonb not null default '{}',
  personalization jsonb not null default '{}'
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- Timeline shown to the admin and (status events only) to the customer.
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('created', 'order_status', 'payment_status')),
  from_value text,
  to_value text,
  actor uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);

create function private.log_order_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, kind, to_value, actor)
    values (new.id, 'created', new.order_status::text, new.user_id);
    return new;
  end if;

  if new.order_status is distinct from old.order_status then
    insert into public.order_events (order_id, kind, from_value, to_value, actor)
    values (new.id, 'order_status', old.order_status::text, new.order_status::text, auth.uid());
  end if;

  if new.payment_status is distinct from old.payment_status then
    insert into public.order_events (order_id, kind, from_value, to_value, actor)
    values (new.id, 'payment_status', old.payment_status::text, new.payment_status::text, auth.uid());
  end if;

  return new;
end;
$$;

create trigger orders_log_events
  after insert or update on public.orders
  for each row execute function private.log_order_events();

-------------------------------------------------------------------------------
-- Custom design requests
-------------------------------------------------------------------------------
create table public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  category_id smallint references public.categories (id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_phone text not null check (customer_phone ~ '^01[0125][0-9]{8}$'),
  customer_email text check (customer_email is null or char_length(customer_email) <= 190),
  quantity int not null check (quantity between 1 and 10000),
  content text not null check (char_length(content) between 3 and 2000),
  style text check (style is null or char_length(style) <= 300),
  needed_by date,
  attachment_path text,
  notes text check (notes is null or char_length(notes) <= 1000),
  status public.request_status not null default 'new',
  quote_amount numeric(10, 2) check (quote_amount is null or quote_amount >= 0),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index custom_requests_user_idx on public.custom_requests (user_id);
create index custom_requests_created_idx on public.custom_requests (created_at desc);
create index custom_requests_category_idx on public.custom_requests (category_id);

create trigger custom_requests_updated_at before update on public.custom_requests
  for each row execute function private.set_updated_at();

-------------------------------------------------------------------------------
-- Rate limiting (fixed window, shared across serverless instances)
-------------------------------------------------------------------------------
create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);

-- Returns true when the request is allowed. Callable by service_role only.
create function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits int;
begin
  if p_key is null or char_length(p_key) > 200 or p_max < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments';
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into private.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup of old windows.
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

-------------------------------------------------------------------------------
-- Order placement: prices come from the database, never from the client.
-- p_order: {
--   name, phone, email, area, district, address, notes, payment_method,
--   items: [{ product_id, quantity, options: {Paper: "Matte"},
--             personalization: {name, title, phone, color} }]
-- }
-------------------------------------------------------------------------------
create function public.place_order(
  p_order jsonb,
  p_user_id uuid,
  p_order_number text,
  p_proof_path text
)
returns table (order_id uuid, order_number text, total numeric)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_settings public.store_settings;
  v_fee numeric(10, 2);
  v_item jsonb;
  v_product public.products;
  v_option jsonb;
  v_choice jsonb;
  v_selected text;
  v_options jsonb;
  v_personal jsonb;
  v_key text;
  v_unit numeric(10, 2);
  v_qty int;
  v_subtotal numeric(10, 2) := 0;
  v_method public.payment_method;
  v_order_id uuid;
  v_lines jsonb := '[]';
begin
  select * into v_settings from public.store_settings where id;
  if not found or not v_settings.accepting_orders then
    raise exception 'ORDERS_CLOSED';
  end if;

  select (z ->> 'fee')::numeric into v_fee
  from jsonb_array_elements(v_settings.shipping_zones) z
  where z ->> 'name' = p_order ->> 'area';
  if v_fee is null then
    raise exception 'INVALID_AREA';
  end if;

  v_method := (p_order ->> 'payment_method')::public.payment_method;
  if v_method <> 'cash_on_delivery' and p_proof_path is null then
    raise exception 'PROOF_REQUIRED';
  end if;

  if jsonb_typeof(p_order -> 'items') <> 'array'
     or jsonb_array_length(p_order -> 'items') not between 1 and 30 then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select * from jsonb_array_elements(p_order -> 'items') loop
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::bigint and is_active;
    if not found then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;

    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty not between 1 and 99 then
      raise exception 'INVALID_QUANTITY';
    end if;

    v_unit := v_product.price;
    v_options := '{}';

    -- Every option group needs exactly one valid choice; unknown keys are rejected.
    for v_key in select jsonb_object_keys(coalesce(v_item -> 'options', '{}')) loop
      if not exists (
        select 1 from jsonb_array_elements(v_product.options) o where o ->> 'name' = v_key
      ) then
        raise exception 'INVALID_OPTION';
      end if;
    end loop;

    for v_option in select * from jsonb_array_elements(v_product.options) loop
      v_selected := v_item -> 'options' ->> (v_option ->> 'name');
      select c into v_choice
      from jsonb_array_elements(v_option -> 'choices') c
      where c ->> 'label' = v_selected;
      if v_choice is null then
        raise exception 'INVALID_OPTION';
      end if;
      v_unit := v_unit + coalesce((v_choice ->> 'price')::numeric, 0);
      v_options := v_options || jsonb_build_object(v_option ->> 'name', v_selected);
      v_choice := null;
    end loop;

    v_personal := '{}';
    if v_product.is_customizable and jsonb_typeof(v_item -> 'personalization') = 'object' then
      for v_key in select jsonb_object_keys(v_item -> 'personalization') loop
        if v_key not in ('name', 'title', 'phone', 'color')
           or jsonb_typeof(v_item -> 'personalization' -> v_key) <> 'string'
           or char_length(v_item -> 'personalization' ->> v_key) > 60 then
          raise exception 'INVALID_PERSONALIZATION';
        end if;
      end loop;
      v_personal := v_item -> 'personalization';
      if char_length(coalesce(v_personal ->> 'name', '')) < 2 then
        raise exception 'INVALID_PERSONALIZATION';
      end if;
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'unit_price', v_unit,
      'quantity', v_qty,
      'options', v_options,
      'personalization', v_personal
    ));
  end loop;

  insert into public.orders (
    order_number, user_id, customer_name, customer_phone, customer_email,
    area, district, address, notes, subtotal, shipping_fee, total,
    payment_method, payment_status, payment_proof_path
  ) values (
    p_order_number,
    p_user_id,
    p_order ->> 'name',
    p_order ->> 'phone',
    nullif(p_order ->> 'email', ''),
    p_order ->> 'area',
    p_order ->> 'district',
    p_order ->> 'address',
    nullif(p_order ->> 'notes', ''),
    v_subtotal,
    v_fee,
    v_subtotal + v_fee,
    v_method,
    case when v_method = 'cash_on_delivery' then 'pending' else 'awaiting_review' end::public.payment_status,
    p_proof_path
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, product_name, unit_price, quantity, line_total, options, personalization
  )
  select
    v_order_id,
    (l ->> 'product_id')::bigint,
    l ->> 'product_name',
    (l ->> 'unit_price')::numeric,
    (l ->> 'quantity')::int,
    (l ->> 'unit_price')::numeric * (l ->> 'quantity')::int,
    l -> 'options',
    l -> 'personalization'
  from jsonb_array_elements(v_lines) l;

  return query select v_order_id, p_order_number, v_subtotal + v_fee;
end;
$$;

-------------------------------------------------------------------------------
-- Privileges: start from nothing, then grant what each role needs.
-------------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
grant execute on function public.place_order(jsonb, uuid, text, text) to service_role;

grant select on public.categories, public.products, public.store_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant update on public.store_settings to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

grant select on public.admins to authenticated;

grant select on public.orders, public.order_items, public.order_events to authenticated;
grant update (order_status, payment_status, admin_note) on public.orders to authenticated;

grant select on public.custom_requests to authenticated;
grant update (status, quote_amount, admin_note) on public.custom_requests to authenticated;

grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to service_role;

-------------------------------------------------------------------------------
-- Row level security
-------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.custom_requests enable row level security;

-- admins: a user can only see whether they themselves are an admin.
create policy "admins: read own row" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- catalog
create policy "categories: public read active" on public.categories
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "categories: admin insert" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories: admin update" on public.categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin delete" on public.categories
  for delete to authenticated using ((select public.is_admin()));

create policy "products: public read active" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "products: admin insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin update" on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- settings
create policy "settings: public read" on public.store_settings
  for select to anon, authenticated using (true);
create policy "settings: admin update" on public.store_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- orders
create policy "orders: read own or admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "orders: admin update" on public.orders
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order_items: read own or admin" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy "order_events: read own or admin" on public.order_events
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

-- custom requests
create policy "custom_requests: read own or admin" on public.custom_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "custom_requests: admin update" on public.custom_requests
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-------------------------------------------------------------------------------
-- Storage
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('request-files', 'request-files', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Product images: admins write; reads go through the public bucket URL.
create policy "product-images: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin select" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Payment proofs and request files: uploaded by the server (service_role);
-- admins can read them to create signed URLs.
create policy "private uploads: admin read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('payment-proofs', 'request-files')
    and (select public.is_admin())
  );

-------------------------------------------------------------------------------
-- Initial data
-------------------------------------------------------------------------------
insert into public.store_settings (shipping_zones, instagram_url)
values (
  '[{"name": "Port Said", "fee": 30}, {"name": "Port Fouad", "fee": 40}]',
  'https://www.instagram.com/minnie_design_'
);

insert into public.categories (slug, name, description, sort_order) values
  ('business-cards', 'Business Cards', 'Premium cards with a luxury finish.', 1),
  ('magazines', 'Magazines', 'Custom magazine layouts, ready to print.', 2),
  ('notebooks', 'Notebooks & Coloring Books', 'Notebooks and coloring books with your artwork.', 3),
  ('tableaux', 'Tableaux', 'Printed wall art for homes and offices.', 4),
  ('giveaways', 'Giveaways', 'Branded gifts for events and occasions.', 5);

insert into public.products
  (category_id, slug, name, description, price, unit, is_customizable, is_featured, sort_order, options, images)
values
  (
    (select id from public.categories where slug = 'business-cards'),
    'luxury-business-card',
    'Luxury Business Card',
    'Premium business cards with a luxury finish. Add your name, title and phone, pick a color, and preview the card before you order.',
    150, 'per pack', true, true, 1,
    '[{"name": "Paper", "choices": [{"label": "Matte", "price": 0}, {"label": "Glossy", "price": 10}, {"label": "Textured", "price": 25}]},
      {"name": "Pack", "choices": [{"label": "100 cards", "price": 0}, {"label": "200 cards", "price": 120}]}]',
    array['/images/card-1.jpeg', '/images/card-2.jpeg', '/images/card-3.png']
  ),
  (
    (select id from public.categories where slug = 'magazines'),
    'creative-magazine',
    'Creative Magazine',
    'A custom magazine layout designed around your content and printed on your choice of paper.',
    400, 'per design', false, true, 2,
    '[{"name": "Pages", "choices": [{"label": "8 pages", "price": 0}, {"label": "16 pages", "price": 200}, {"label": "24 pages", "price": 400}]},
      {"name": "Paper", "choices": [{"label": "Matte", "price": 0}, {"label": "Glossy", "price": 50}]}]',
    array['/images/magazine-1.jpg', '/images/magazine-2.jpg', '/images/magazine-3.jpg']
  ),
  (
    (select id from public.categories where slug = 'notebooks'),
    'notebook-coloring-book',
    'Notebook & Coloring Book',
    'Notebooks and coloring books featuring your own artwork, with soft or hard covers.',
    120, 'per copy', false, true, 3,
    '[{"name": "Type", "choices": [{"label": "Notebook", "price": 0}, {"label": "Coloring book", "price": 0}]},
      {"name": "Cover", "choices": [{"label": "Soft cover", "price": 0}, {"label": "Hard cover", "price": 40}]}]',
    array['/images/notebook-4.jpg', '/images/notebook-3.jpg', '/images/notebook-2.jpg', '/images/notebook-1.jpg']
  );
