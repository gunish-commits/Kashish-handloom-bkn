import { CartItem, AppliedOffer } from '../types';

interface WhatsAppOrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  items: CartItem[];
  offerApplied: AppliedOffer | null;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  baseUrl?: string;
}

export function buildWhatsAppMessage(orderData: WhatsAppOrderData): string {
  // Determine site base URL dynamically (with fallbacks)
  const baseUrl = orderData.baseUrl || 
                  (typeof window !== 'undefined' ? window.location.origin : '') ||
                  process.env.NEXT_PUBLIC_SITE_URL || 
                  'https://kashishhandloom.com';
  
  // Format items text containing clickable product links
  const itemsText = orderData.items
    .map((item, index) => {
      const productUrl = `${baseUrl}/product/${item.slug}`;
      return `${index + 1}. ${item.name} × ${item.quantity} = ₹${Math.round(item.price * item.quantity)}\n   🔗 ${productUrl}`;
    })
    .join('\n\n');

  const offerText = orderData.offerApplied
    ? `🏷️ OFFER APPLIED: ${orderData.offerApplied.title} (−₹${Math.round(orderData.offerApplied.discount)})\n\n`
    : '';

  const altPhoneText = orderData.customerAltPhone
    ? `Alt Phone: +91 ${orderData.customerAltPhone.slice(-10)}\n`
    : '';

  const address2Text = orderData.addressLine2
    ? `, ${orderData.addressLine2}`
    : '';

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const message = `🪡 *KASHISH HANDLOOM — NEW ORDER*
📍 Jinnah Road, Coatagate, Bikaner, Rajasthan

━━━━━━━━━━━━━━━━━━━━━
📋 ORDER: ${orderData.orderId}
⏳ STATUS: Pending Confirmation
━━━━━━━━━━━━━━━━━━━━━

🛍️ ITEMS ORDERED:

${itemsText}

━━━━━━━━━━━━━━━━━━━━━

${offerText}📦 SUBTOTAL: ₹${Math.round(orderData.subtotal)}
🚚 DELIVERY: ₹${Math.round(orderData.deliveryCharge)}
💰 *GRAND TOTAL: ₹${Math.round(orderData.grandTotal)}*

━━━━━━━━━━━━━━━━━━━━━
👤 CUSTOMER DETAILS
━━━━━━━━━━━━━━━━━━━━━
Name:    ${orderData.customerName}
Phone:   +91 ${orderData.customerPhone.slice(-10)}
${altPhoneText}Address: ${orderData.addressLine1}${address2Text}
         ${orderData.city}, ${orderData.state} — ${orderData.pincode}

━━━━━━━━━━━━━━━━━━━━━
🕐 ${dateStr}
⚠️ Please confirm this order in your admin panel.
━━━━━━━━━━━━━━━━━━━━━`;

  return message;
}

export function getWhatsAppLink(phoneNumber: string, message: string): string {
  // Strip any non-digit characters from the phone number
  let cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // If it's a 10 digit number, prepend '91' for India code
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }
  
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildDirectProductEnquiryMessage(productName: string, sku: string | null, price: number, url: string): string {
  const skuText = sku ? `\nSKU: ${sku}` : '';
  return `🪡 *KASHISH HANDLOOM*
🏪 *PRODUCT ENQUIRY*

Hello, I am interested in ordering this product:

🛍️ PRODUCT: ${productName}${skuText}
💰 PRICE: ₹${price}
🔗 LINK: ${url}

Please let me know if this item is in stock and how to proceed. Thank you!`;
}
