import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAuth } from '../../../lib/supabase/server';
import { OrderItem } from '../../../types';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    const {
      id,
      customer_name,
      customer_phone,
      customer_alt_phone,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      items,
      offer_applied,
      subtotal,
      delivery_charge,
      grand_total,
    } = orderData;

    if (!id || !customer_name || !customer_phone || !address_line1 || !city || !state || !pincode || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    // Optional: Determine if customer is authenticated to link customer_id
    let customerId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { user } = await verifyAuth(request);
      if (user) {
        customerId = user.id;
      }
    }

    // Use admin client to perform database updates (bypass potential public insert limits and do stock edits)
    const supabaseAdmin = createAdminClient();

    // Calculate expires_at (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 1. Insert the order
    const { error: insertError } = await supabaseAdmin.from('orders').insert({
      id,
      customer_id: customerId,
      customer_name,
      customer_phone,
      customer_alt_phone: customerAltPhone(customer_alt_phone),
      address_line1,
      address_line2: addressLine2(address_line2),
      city,
      state,
      pincode,
      items,
      offer_applied,
      subtotal: parseFloat(subtotal),
      delivery_charge: parseFloat(delivery_charge),
      grand_total: parseFloat(grand_total),
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      whatsapp_sent: false,
    });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true, orderId: id });
  } catch (error: any) {
    console.error('API Error in POST /api/orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}

// Small formatting helpers to map empty strings to null in DB
function customerAltPhone(phone?: string | null) {
  return phone && phone.trim() !== '' ? phone.trim() : null;
}

function addressLine2(address?: string | null) {
  return address && address.trim() !== '' ? address.trim() : null;
}
