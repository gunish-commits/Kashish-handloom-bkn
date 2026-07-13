import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../lib/supabase/server';

// Get delivery settings (admin)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: settings, error } = await supabaseAdmin
      .from('delivery_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/delivery:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Update delivery settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, flat_rate, free_above, pincode_overrides } = body;

    const supabaseAdmin = createAdminClient();

    const { data: settings, error } = await supabaseAdmin
      .from('delivery_settings')
      .update({
        enabled: enabled !== undefined ? !!enabled : undefined,
        flat_rate: flat_rate !== undefined ? parseFloat(flat_rate) : undefined,
        free_above: free_above !== undefined ? parseFloat(free_above) : undefined,
        pincode_overrides: pincode_overrides || undefined,
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API Error in PUT /api/admin/delivery:', error);
    return NextResponse.json({ error: error.message || 'Failed to update delivery settings' }, { status: 500 });
  }
}
