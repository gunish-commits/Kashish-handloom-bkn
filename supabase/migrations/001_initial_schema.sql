-- CATEGORIES
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  emoji text,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- PRODUCTS
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category_id uuid references categories(id) on delete set null,
  description text,
  price numeric(10,2) not null,
  sale_price numeric(10,2),
  stock integer not null default 0,
  low_stock_threshold integer default 5,
  return_policy text check (return_policy in ('no_return','7_days','14_days')) default 'no_return',
  photos text[] default '{}',
  fabric text,
  size text,
  sku text,
  featured boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- OFFERS
create table offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  offer_type text check (offer_type in ('quantity_bundle','cart_discount','category_discount')) not null,
  applies_to text check (applies_to in ('category','specific_products','all')) not null,
  category_id uuid references categories(id) on delete set null,
  product_ids uuid[] default '{}',
  trigger_quantity integer,
  trigger_amount numeric(10,2),
  reward_type text check (reward_type in ('fixed_total','fixed_discount','percent_discount')) not null,
  reward_value numeric(10,2) not null,
  active boolean default true,
  show_on_homepage boolean default true,
  valid_from date,
  valid_until date,
  created_at timestamptz default now()
);

-- ORDERS
create table orders (
  id text primary key,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_alt_phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  items jsonb not null,
  offer_applied jsonb,
  subtotal numeric(10,2) not null,
  delivery_charge numeric(10,2) default 0,
  grand_total numeric(10,2) not null,
  status text check (status in ('new','processing','dispatched','delivered','cancelled')) default 'new',
  whatsapp_sent boolean default false,
  created_at timestamptz default now()
);

-- COMPLAINTS
create table complaints (
  id uuid primary key default gen_random_uuid(),
  order_id text references orders(id) on delete set null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  description text not null,
  status text check (status in ('new','investigating','resolved','closed')) default 'new',
  created_at timestamptz default now()
);

-- DELIVERY SETTINGS (single row table)
create table delivery_settings (
  id integer primary key default 1,
  enabled boolean default true,
  flat_rate numeric(10,2) default 99,
  free_above numeric(10,2) default 2000,
  pincode_overrides jsonb default '[]'
);

-- STORE SETTINGS (single row table)
create table store_settings (
  id integer primary key default 1,
  store_name text default 'Kashish Handloom',
  tagline text,
  primary_whatsapp text default '+918209455157',
  alt_phone text default '+917976924013',
  email text default 'kashishhandloombkn@gmail.com',
  address text,
  instagram_url text,
  logo_url text,
  business_hours text,
  return_policy_text text,
  about_content text
);

-- Insert default delivery settings
insert into delivery_settings (id) values (1) on conflict do nothing;

-- Insert default store settings
insert into store_settings (id, store_name, primary_whatsapp, alt_phone, email,
  address, instagram_url)
values (1, 'Kashish Handloom', '+918209455157', '+917976924013',
  'kashishhandloombkn@gmail.com',
  'Jinnah Road, Coatagate, Near New Taj Hotel, Bikaner, Rajasthan 334001',
  'https://www.instagram.com/kashish_handlooom')
on conflict do nothing;

-- RLS POLICIES
alter table products enable row level security;
alter table categories enable row level security;
alter table offers enable row level security;
alter table orders enable row level security;
alter table complaints enable row level security;
alter table delivery_settings enable row level security;
alter table store_settings enable row level security;

-- Public can read products, categories, offers, delivery settings, store settings
create policy "Public read products" on products for select using (active = true);
create policy "Public read categories" on categories for select using (active = true);
create policy "Public read offers" on offers for select using (active = true);
create policy "Public read delivery" on delivery_settings for select using (true);
create policy "Public read store" on store_settings for select using (true);

-- Public can insert orders (for placing orders)
create policy "Public insert orders" on orders for insert with check (true);

-- Customers can view their own orders and complaints
create policy "Customers select orders" on orders for select using (auth.uid() = customer_id);
create policy "Customers select complaints" on complaints for select using (auth.uid() = customer_id);
create policy "Customers insert complaints" on complaints for insert with check (auth.uid() = customer_id);

-- Authenticated admin can do everything
create policy "Admin all products" on products for all using (auth.role() = 'authenticated');
create policy "Admin all categories" on categories for all using (auth.role() = 'authenticated');
create policy "Admin all offers" on offers for all using (auth.role() = 'authenticated');
create policy "Admin all orders" on orders for all using (auth.role() = 'authenticated');
create policy "Admin all complaints" on complaints for all using (auth.role() = 'authenticated');
create policy "Admin all delivery" on delivery_settings for all using (auth.role() = 'authenticated');
create policy "Admin all store" on store_settings for all using (auth.role() = 'authenticated');
