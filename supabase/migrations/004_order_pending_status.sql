-- Update orders table status constraint to include 'pending'
alter table orders drop constraint if exists orders_status_check;

alter table orders add constraint orders_status_check
  check (status in (
    'pending',      -- Customer opened WhatsApp but may not have sent yet
    'new',          -- Customer sent WhatsApp message (owner received it)
    'confirmed',    -- Owner confirmed in admin panel
    'processing',   -- Being packed
    'shipped',      -- Dispatched
    'delivered',    -- Customer received
    'cancelled'     -- Cancelled
  ));

-- Add expires_at column for auto-expiry of pending orders (after 24 hours)
alter table orders add column if not exists expires_at timestamptz;

-- Add confirmed_at column to track when owner confirmed
alter table orders add column if not exists confirmed_at timestamptz;
