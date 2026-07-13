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

    const { status, whatsapp_sent } = await request.json();

    if (!status && whatsapp_sent === undefined) {
      return NextResponse.json({ error: 'Status or whatsapp_sent state is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Fetch current order to check previous status
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('status, items')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = currentOrder.status;

    // 2. Perform updates
    const updates: any = {
      status: status || undefined,
      whatsapp_sent: whatsapp_sent !== undefined ? !!whatsapp_sent : undefined,
    };

    if (status === 'confirmed' && previousStatus === 'pending') {
      updates.confirmed_at = new Date().toISOString();
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 3. Reduce stock if transitioning from pending to confirmed
    let stockWarnings: string[] = [];
    if (status === 'confirmed' && previousStatus === 'pending') {
      for (const item of (currentOrder.items || []) as any[]) {
        const { data: product, error: prodFetchError } = await supabaseAdmin
          .from('products')
          .select('stock, name')
          .eq('id', item.product_id)
          .maybeSingle();

        if (prodFetchError) {
          console.error(`Error fetching stock for product ${item.product_id}:`, prodFetchError);
          continue;
        }

        if (product) {
          const currentStock = product.stock || 0;
          if (currentStock < item.quantity) {
            stockWarnings.push(
              `Stock for "${product.name}" is insufficient (Available: ${currentStock}, Requested: ${item.quantity}). Setting stock to 0.`
            );
          }

          const newStock = Math.max(0, currentStock - item.quantity);
          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', item.product_id);

          if (updateError) {
            console.error(`Failed to update stock for product ${item.product_id}:`, updateError);
          }
        }
      }
    }

    return NextResponse.json({
      ...order,
      warnings: stockWarnings.length > 0 ? stockWarnings : undefined,
    });
  } catch (error: any) {
    console.error(`API Error in PUT /api/admin/orders/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
