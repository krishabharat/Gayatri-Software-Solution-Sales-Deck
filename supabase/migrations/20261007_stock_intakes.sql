Success. No rows returnedalter table public.products
  add column if not exists image text;

do $$
begin
  if exists (
    select 1
    from public.products
    group by lower(trim(product_id))
    having count(*) > 1
  ) then
    raise exception 'Duplicate product IDs already exist in products. Resolve duplicate product IDs before applying the stock-intake migration.';
  end if;

  if exists (
    select 1
    from public.products
    group by lower(trim(product_name))
    having count(*) > 1
  ) then
    raise exception 'Duplicate product names already exist in products. Resolve duplicate product names before applying the stock-intake migration.';
  end if;

  if exists (
    with product_candidates as (
      select
        lower(trim(product_name)) as name_key,
        lower(trim(product_id)) as id_key
      from public.products
      union all
      select
        lower(coalesce(nullif(trim(product_name), ''), nullif(trim(product_id), ''), 'Legacy product ' || id)),
        lower(coalesce(nullif(trim(product_id), ''), 'LEGACY-' || id))
      from public.inventory
    )
    select name_key
    from product_candidates
    group by name_key
    having count(distinct id_key) > 1
  ) then
    raise exception 'Products with the same normalized name but different IDs exist across Product Master and Inventory. Reconcile these products before migrating so no stock history is dropped.';
  end if;
end $$;

create unique index if not exists products_product_id_normalized_uidx
  on public.products (lower(trim(product_id)));

create unique index if not exists products_product_name_normalized_uidx
  on public.products (lower(trim(product_name)));

insert into public.products (
  id,
  product_id,
  product_name,
  category,
  unit,
  default_cost,
  default_selling_price,
  minimum_stock_level,
  created_at
)
select distinct on (lower(coalesce(nullif(trim(i.product_id), ''), 'LEGACY-' || i.id)))
  'legacy-' || md5(lower(coalesce(nullif(trim(i.product_id), ''), 'LEGACY-' || i.id))),
  coalesce(nullif(trim(i.product_id), ''), 'LEGACY-' || i.id),
  coalesce(nullif(trim(i.product_name), ''), nullif(trim(i.product_id), ''), 'Legacy product ' || i.id),
  'General',
  'Sheet',
  i.cost_per_sheet,
  i.selling_cost,
  0,
  coalesce(i.created_at, now())
from public.inventory i
where not exists (
    select 1
    from public.products p
    where lower(trim(p.product_id)) = lower(coalesce(nullif(trim(i.product_id), ''), 'LEGACY-' || i.id))
  )
order by lower(coalesce(nullif(trim(i.product_id), ''), 'LEGACY-' || i.id)), i.date desc, i.created_at desc
on conflict do nothing;

create table if not exists public.stock_intakes (
  id text primary key,
  product_id text not null references public.products(id) on update cascade,
  date date not null,
  quantity numeric not null,
  cost_price numeric not null,
  supplier text not null default '',
  selling_price_at_time numeric,
  transport_cost numeric not null default 0,
  type text not null default 'Purchased',
  notes text not null default '',
  intake_batch_id text not null default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);

alter table public.stock_intakes
  add column if not exists intake_batch_id text not null default gen_random_uuid()::text;

create index if not exists stock_intakes_product_date_idx
  on public.stock_intakes (product_id, date desc, created_at desc);

create table if not exists public.stock_intake_settings (
  key text primary key,
  value text not null
);

insert into public.stock_intake_settings (key, value)
values ('sales_stock_tracking_started_at', now()::text)
on conflict (key) do nothing;

insert into public.stock_intakes (
  id,
  product_id,
  date,
  quantity,
  cost_price,
  supplier,
  selling_price_at_time,
  transport_cost,
  type,
  notes,
  intake_batch_id,
  created_at
)
select
  i.id,
  p.id,
  i.date,
  i.quantity,
  i.cost_per_sheet,
  i.supplier_name,
  i.selling_cost,
  i.transport_cost,
  i.type,
  '',
  gen_random_uuid()::text,
  coalesce(i.created_at, now())
from public.inventory i
join public.products p
  on lower(trim(p.product_id)) = lower(coalesce(nullif(trim(i.product_id), ''), 'LEGACY-' || i.id))
on conflict (id) do nothing;

create or replace function public.reject_stock_intake_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Stock intake history is append-only. Add a new intake instead of changing or deleting a previous record.';
end;
$$;

drop trigger if exists stock_intakes_are_immutable on public.stock_intakes;
create trigger stock_intakes_are_immutable
  before update or delete on public.stock_intakes
  for each row execute function public.reject_stock_intake_mutation();

alter table public.stock_intakes enable row level security;
alter table public.stock_intake_settings enable row level security;

drop policy if exists "public stock intakes access" on public.stock_intakes;
create policy "public stock intakes access" on public.stock_intakes
  for all using (true) with check (true);

drop policy if exists "public stock intake settings access" on public.stock_intake_settings;
create policy "public stock intake settings access" on public.stock_intake_settings
  for select using (true);

notify pgrst, 'reload schema';
