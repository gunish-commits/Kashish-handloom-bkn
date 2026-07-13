import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../../lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

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

    const supabaseAdmin = createAdminClient();

    const { data: offer, error } = await supabaseAdmin
      .from('offers')
      .update({
        title,
        description: description || null,
        offer_type,
        applies_to,
        category_id: category_id || null,
        product_ids: product_ids || [],
        trigger_quantity: trigger_quantity !== undefined ? (trigger_quantity ? parseInt(trigger_quantity, 10) : null) : undefined,
        trigger_amount: trigger_amount !== undefined ? (trigger_amount ? parseFloat(trigger_amount) : null) : undefined,
        reward_type,
        reward_value: reward_value !== undefined ? parseFloat(reward_value) : undefined,
        active: active !== undefined ? !!active : undefined,
        show_on_homepage: show_on_homepage !== undefined ? !!show_on_homepage : undefined,
        valid_from: valid_from || null,
        valid_until: valid_until || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(offer);
  } catch (error: any) {
    console.error(`API Error in PUT /api/admin/offers/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update offer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API Error in DELETE /api/admin/offers/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete offer' }, { status: 500 });
  }
}
