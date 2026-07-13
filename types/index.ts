export type ReturnPolicyType = 'no_return' | '7_days' | '14_days';

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  low_stock_threshold: number;
  return_policy: ReturnPolicyType;
  photos: string[];
  fabric: string | null;
  size: string | null;
  sku: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
    slug: string;
  } | null;
}

export type OfferType = 'quantity_bundle' | 'cart_discount' | 'category_discount';
export type AppliesToType = 'category' | 'specific_products' | 'all';
export type RewardType = 'fixed_total' | 'fixed_discount' | 'percent_discount';

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  offer_type: OfferType;
  applies_to: AppliesToType;
  category_id: string | null;
  product_ids: string[];
  trigger_quantity: number | null;
  trigger_amount: number | null;
  reward_type: RewardType;
  reward_value: number;
  active: boolean;
  show_on_homepage: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  categories?: {
    name: string;
  } | null;
}

export type OrderStatus = 'pending' | 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  product_id: string;
  category_id: string;
  quantity: number;
  price: number;
  name: string;
  photo?: string;
  return_policy?: ReturnPolicyType;
}

export interface AppliedOffer {
  offer_id: string;
  title: string;
  discount: number;
}

export interface Order {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_alt_phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  offer_applied: AppliedOffer | null;
  subtotal: number;
  delivery_charge: number;
  grand_total: number;
  status: OrderStatus;
  whatsapp_sent: boolean;
  created_at: string;
  expires_at?: string | null;
  confirmed_at?: string | null;
}

export type ComplaintStatus = 'new' | 'investigating' | 'resolved' | 'closed';

export interface Complaint {
  id: string;
  order_id: string | null;
  customer_id: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  orders?: {
    id: string;
    customer_name: string;
    customer_phone: string;
    grand_total: number;
    status: OrderStatus;
    city: string;
    state: string;
    pincode: string;
  } | null;
}

export interface PincodeOverride {
  pincode: string;
  charge: number;
}

export interface DeliverySettings {
  id: number;
  enabled: boolean;
  flat_rate: number;
  free_above: number;
  pincode_overrides: PincodeOverride[];
}

export interface StoreSettings {
  id: number;
  store_name: string;
  tagline: string | null;
  primary_whatsapp: string;
  alt_phone: string;
  email: string;
  address: string | null;
  instagram_url: string | null;
  logo_url: string | null;
  business_hours: string | null;
  return_policy_text: string | null;
  about_content: string | null;
}

export interface CartItem {
  product_id: string;
  slug: string;
  category_id: string;
  quantity: number;
  price: number; // sale_price ?? price
  name: string;
  photo: string;
  stock: number;
  return_policy: ReturnPolicyType;
}
