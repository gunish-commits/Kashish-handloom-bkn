-- Update orders table status constraint to support 'packed' and 'out_for_delivery'
alter table orders drop constraint if exists orders_status_check;

alter table orders add constraint orders_status_check
  check (status in (
    'pending',
    'new',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ));
