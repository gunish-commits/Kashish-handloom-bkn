-- Create customer profiles table
create table if not exists customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  alt_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table customer_profiles enable row level security;

-- RLS Policies
create policy "Customers own profile select" on customer_profiles
  for select using (auth.uid() = id);

create policy "Customers own profile insert" on customer_profiles
  for insert with check (auth.uid() = id);

create policy "Customers own profile update" on customer_profiles
  for update using (auth.uid() = id);

create policy "Customers own profile delete" on customer_profiles
  for delete using (auth.uid() = id);

-- Trigger to automatically create a customer profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.customer_profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
