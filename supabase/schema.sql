create table if not exists public.products (
  id text primary key,
  product_id text not null,
  product_name text not null,
  category text not null default 'General',
  unit text not null default 'Sheet',
  default_cost numeric not null default 0,
  default_selling_price numeric not null default 0,
  minimum_stock_level numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id text primary key,
  date date not null,
  product_id text not null,
  product_name text not null default '',
  quantity numeric not null default 0,
  cost_per_sheet numeric not null default 0,
  selling_cost numeric not null default 0,
  transport_cost numeric not null default 0,
  type text not null,
  material_cost numeric not null default 0,
  total_cost numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id text primary key,
  customer_name text not null,
  mobile text not null,
  sale_date date not null,
  payment_status text not null check (payment_status in ('Paid', 'Unpaid', 'Partial')),
  discount numeric not null default 0,
  amount_paid numeric not null default 0,
  total_plates numeric not null default 0,
  subtotal numeric not null default 0,
  grand_total numeric not null default 0,
  remaining numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sale_products (
  id text primary key,
  sale_id text not null references public.sales(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity numeric not null default 0,
  selling numeric not null default 0
);

alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.sales enable row level security;
alter table public.sale_products enable row level security;

create policy "public products access" on public.products for all using (true) with check (true);
create policy "public inventory access" on public.inventory for all using (true) with check (true);
create policy "public sales access" on public.sales for all using (true) with check (true);
create policy "public sale products access" on public.sale_products for all using (true) with check (true);
