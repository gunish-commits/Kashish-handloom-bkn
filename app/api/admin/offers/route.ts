import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../lib/supabase/server';

// Get all offers (admin)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: offers, error } = await supabaseAdmin
      .from('offers')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(offers || []);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/offers:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Create offer
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      offer_type,
      applies_to,
      category_id,
      product_ids,
      trigger_quantity,
      trigger_amount,
      reward_type,
      reward_value,
      active,
      show_on_homepage,
      valid_from,
      valid_until,
    } = body;

    if (!title || !offer_type || !applies_to || !reward_type || reward_value === undefined) {
      return NextResponse.json({ error: 'Missing required offer fields' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: offer, error } = await supabaseAdmin
      .from('offers')
      .insert({
        title,
        description: description || null,
        offer_type,
        applies_to,
        category_id: category_id || null,
        product_ids: product_ids || [],
        trigger_quantity: trigger_quantity ? parseInt(trigger_quantity, 10) : null,
        trigger_amount: trigger_amount ? parseFloat(trigger_amount) : null,
        reward_type,
        reward_value: parseFloat(reward_value),
        active: active !== undefined ? !!active : true,
        show_on_homepage: show_on_homepage !== undefined ? !!show_on_homepage : true,
        valid_from: valid_from || null,
        valid_until: valid_until || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(offer);
  } catch (error: any) {
    console.error('API Error in POST /api/admin/offers:', error);
    return NextResponse.json({ error: error.message || 'Failed to create offer' }, { status: 500 });
  }
}
