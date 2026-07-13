-- ==========================================
-- SEED DATA FOR KASHISH HANDLOOM DATABASE
-- ==========================================

-- 1. Insert 12 active Categories
INSERT INTO categories (name, slug, emoji, display_order, active) VALUES
('Bedsheets', 'bedsheets', '🛏️', 1, true),
('Curtains', 'curtains', '🪟', 2, true),
('Blankets', 'blankets', '🧥', 3, true),
('Comforters', 'comforters', '🧸', 4, true),
('Pillow Covers', 'pillow-covers', '💤', 5, true),
('Cushion Covers', 'cushion-covers', '🛋️', 6, true),
('Table Runners', 'table-runners', '🍽️', 7, true),
('Towels', 'towels', '🛁', 8, true),
('Quilts', 'quilts', '🧵', 9, true),
('Home Décor', 'home-decor', '🏺', 10, true),
('Footmats', 'footmats', '👞', 11, true),
('Wall Hangings', 'wall-hangings', '🖼️', 12, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Store Settings (Record ID = 1)
INSERT INTO store_settings (id, primary_whatsapp, alt_phone, email, address, instagram_url, business_hours, logo_url) VALUES
(
  1,
  '+91 8209455157',
  '+91 7976924013',
  'kashishhandloombkn@gmail.com',
  'Jinnah Road, Coatagate, Near New Taj Hotel, Bikaner, Rajasthan — 334001, India',
  'https://www.instagram.com/kashish_handlooom',
  'Mon–Sat: 10:00 AM – 8:00 PM' || chr(10) || 'Sun: 11:00 AM – 6:00 PM',
  '/logo.png'
)
ON CONFLICT (id) DO UPDATE SET
  primary_whatsapp = EXCLUDED.primary_whatsapp,
  alt_phone = EXCLUDED.alt_phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  instagram_url = EXCLUDED.instagram_url,
  business_hours = EXCLUDED.business_hours,
  logo_url = EXCLUDED.logo_url;

-- 3. Insert Delivery Settings (Record ID = 1)
INSERT INTO delivery_settings (id, enabled, flat_rate, free_above, pincode_overrides) VALUES
(
  1,
  true,
  99.00,
  1500.00,
  '[
    {"pincode": "334001", "charge": 0},
    {"pincode": "334002", "charge": 0},
    {"pincode": "334003", "charge": 0},
    {"pincode": "334004", "charge": 0},
    {"pincode": "334005", "charge": 0}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  flat_rate = EXCLUDED.flat_rate,
  free_above = EXCLUDED.free_above,
  pincode_overrides = EXCLUDED.pincode_overrides;

-- Helper to retrieve category IDs for products insert
DO $$
DECLARE
  cat_bedsheets_id UUID;
  cat_curtains_id UUID;
  cat_comforters_id UUID;
  cat_blankets_id UUID;
  cat_cushions_id UUID;
  cat_runners_id UUID;
  cat_towels_id UUID;
  cat_quilts_id UUID;
  today_date DATE := CURRENT_DATE;
  expiry_date DATE := CURRENT_DATE + INTERVAL '90 days';
BEGIN
  -- Fetch categories UUIDs
  SELECT id INTO cat_bedsheets_id FROM categories WHERE slug = 'bedsheets';
  SELECT id INTO cat_curtains_id FROM categories WHERE slug = 'curtains';
  SELECT id INTO cat_comforters_id FROM categories WHERE slug = 'comforters';
  SELECT id INTO cat_blankets_id FROM categories WHERE slug = 'blankets';
  SELECT id INTO cat_cushions_id FROM categories WHERE slug = 'cushion-covers';
  SELECT id INTO cat_runners_id FROM categories WHERE slug = 'table-runners';
  SELECT id INTO cat_towels_id FROM categories WHERE slug = 'towels';
  SELECT id INTO cat_quilts_id FROM categories WHERE slug = 'quilts';

  -- 4. Insert 8 products with realistic data
  -- Product 1: Bedsheet
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_bedsheets_id,
    'Traditional Jaipuri Cotton Double Bedsheet',
    'traditional-jaipuri-cotton-double-bedsheet',
    'Experience the premium comfort of authentic Rajasthani block prints. Woven from 100% pure cotton, this double bedsheet set comes with two matching pillow covers and exhibits timeless indigo-tinted heritage patterns.',
    1299.00,
    999.00,
    30,
    5,
    '14_days',
    ARRAY['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600'],
    '100% Organic Cotton',
    '90 x 108 inches (Double)',
    'KH-BS-JAI-01',
    true,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 2: Curtain
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_curtains_id,
    'Floral Block-Printed Cotton Curtain (Set of 2)',
    'floral-block-printed-cotton-curtain-set-of-2',
    'Spruce up your living space with these hand-screened floral panels. Offers semi-sheer light filtration, perfect for living room aesthetics. Features chrome grommets for easy hanging.',
    1899.00,
    1499.00,
    15,
    3,
    '7_days',
    ARRAY['https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600'],
    'Slub Cotton Blend',
    '5 x 7 feet (Door Size)',
    'KH-CR-FLR-02',
    true,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 3: Comforter
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_comforters_id,
    'Soft Microfiber All-Season Comforter',
    'soft-microfiber-all-season-comforter',
    'Reversible hypoallergenic comforter with ultra-soft hollow conjugate siliconized fiber filling. Breathable, lightweight, and perfect for moderate air-conditioned summers and cozy winters alike.',
    2499.00,
    1999.00,
    10,
    2,
    '7_days',
    ARRAY['https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?q=80&w=600'],
    'Hypoallergenic Microfiber',
    '90 x 100 inches (Double)',
    'KH-CF-MIC-03',
    false,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 4: Blanket
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_blankets_id,
    'Cozy Woolen Bikaneri Blanket',
    'cozy-woolen-bikaneri-blanket',
    'Handmade in Bikaner looms using native desert wool, this blanket offers unparalleled warmth. Adorned with traditional border lines, it represents the raw aesthetic beauty of Rajasthan.',
    3200.00,
    2699.00,
    8,
    3,
    'no_return',
    ARRAY['https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600'],
    '100% Desert Sheep Wool',
    '60 x 90 inches (Single)',
    'KH-BL-WOOL-04',
    true,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 5: Cushion Cover
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_cushions_id,
    'Handloom Woven Decorative Cushion Cover',
    'handloom-woven-decorative-cushion-cover',
    'Add texture to your furniture configurations. Hand-woven by local artisans using coarse cotton thread with complex geometric patterns. Features solid canvas backing and premium hidden zippers.',
    399.00,
    299.00,
    50,
    10,
    '14_days',
    ARRAY['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=600'],
    'Cotton Chenille yarn',
    '16 x 16 inches (Square)',
    'KH-CS-DEC-05',
    false,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 6: Table Runner
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_runners_id,
    'Indigo Block-Printed Table Runner',
    'indigo-block-printed-table-runner',
    'A beautiful indigo accent for dining setups. Heavy canvas cotton runner with hand-stamped traditional Mughal motifs. Edges finished with neat tassels.',
    599.00,
    449.00,
    20,
    4,
    '14_days',
    ARRAY['https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=600'],
    'Heavy Cotton Canvas',
    '14 x 72 inches (6-Seater)',
    'KH-TR-IND-06',
    true,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 7: Towel Set
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_towels_id,
    'Premium Woven Cotton Towel Set',
    'premium-woven-cotton-towel-set',
    'Includes 1 large bath towel and 2 hand towels. Highly absorbent ring-spun cotton loops ensure a soft and luxurious drying experience. Quick-dry technology.',
    999.00,
    799.00,
    25,
    5,
    '7_days',
    ARRAY['https://images.unsplash.com/photo-1616627561950-9f746e330187?q=80&w=600'],
    '100% Ringspun Cotton (550 GSM)',
    'Bath: 30x60in, Hand: 16x28in',
    'KH-TW-SET-07',
    false,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 8: Quilt
  INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, low_stock_threshold, return_policy, photos, fabric, size, sku, featured, active)
  VALUES (
    cat_quilts_id,
    'Traditional Kantha Quilt / Dohara',
    'traditional-kantha-quilt-dohara',
    'Beautiful layers of vintage organic cotton fabric, hand-stitched with signature Kantha needlework. Extremely breathable and versatile, ideal as light AC summer quilts or mattress overlays.',
    1799.00,
    1399.00,
    12,
    3,
    '14_days',
    ARRAY['https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600'],
    'Vintage Organic Cotton Layers',
    '90 x 100 inches (Double)',
    'KH-QL-KAN-08',
    true,
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- 5. Insert 2 Campaign Offers
  -- Offer 1: Bedsheet Quantity Bundle
  INSERT INTO offers (title, description, offer_type, applies_to, category_id, trigger_quantity, reward_type, reward_value, active, show_on_homepage, valid_from, valid_until)
  VALUES (
    'Bedsheet Bonanza',
    'Revamp your home décor. Buy any 5 cotton bedsheets and get the whole bundle for a fixed total of just ₹1,999!',
    'quantity_bundle',
    'category',
    cat_bedsheets_id,
    5,
    'fixed_total',
    1999.00,
    true,
    true,
    today_date,
    expiry_date
  ) ON CONFLICT DO NOTHING;

  -- Offer 2: Subtotal Cart Discount
  INSERT INTO offers (title, description, offer_type, applies_to, trigger_amount, reward_type, reward_value, active, show_on_homepage, valid_from, valid_until)
  VALUES (
    'Inaugural Celebration Sale',
    'Celebrate our digital transformation. Get a flat ₹200 discount on your order when you spend ₹1,500 or more!',
    'cart_discount',
    'all',
    1500.00,
    'fixed_discount',
    200.00,
    true,
    true,
    today_date,
    expiry_date
  ) ON CONFLICT DO NOTHING;

END $$;
