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

    const { stock } = await request.json();

    if (stock === undefined) {
      return NextResponse.json({ error: 'Stock count is required' }, { status: 400 });
    }

    const stockCount = parseInt(stock, 10);
    if (isNaN(stockCount) || stockCount < 0) {
      return NextResponse.json({ error: 'Stock must be a valid non-negative integer' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        stock: stockCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, stock')
      .single();

    if (error) throw error;
    return NextResponse.json(product);
  } catch (error: any) {
    console.error(`API Error in PUT /api/admin/stock/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update stock' }, { status: 500 });
  }
}
