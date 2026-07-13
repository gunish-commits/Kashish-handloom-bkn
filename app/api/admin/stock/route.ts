import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../lib/supabase/server';

// Get product inventory stats (admin view)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, stock, low_stock_threshold, categories(name)')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(products || []);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/stock:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
