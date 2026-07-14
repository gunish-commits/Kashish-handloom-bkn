import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAuth } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);

    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(orders || []);
  } catch (error: any) {
    console.error('API Error in /api/orders/my-orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
