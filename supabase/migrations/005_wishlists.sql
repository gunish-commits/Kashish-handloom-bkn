-- Create wishlists table
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Enable Row Level Security (RLS)
alter table public.wishlists enable row level security;

-- Create policies for wishlists
create policy "Users can select their own wishlist items" on public.wishlists
  for select using (auth.uid() = user_id);

create policy "Users can insert their own wishlist items" on public.wishlists
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own wishlist items" on public.wishlists
  for delete using (auth.uid() = user_id);
