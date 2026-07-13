import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../lib/supabase/server';

// Get all customer complaints (admin)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('*, orders(id, customer_name, customer_phone, grand_total, status, city, state, pincode)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(complaints || []);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/complaints:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
