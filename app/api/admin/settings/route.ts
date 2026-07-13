import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../lib/supabase/server';

// Get store settings (admin view)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: settings, error } = await supabaseAdmin
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/settings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Update store settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const {
      store_name,
      tagline,
      primary_whatsapp,
      alt_phone,
      email,
      address,
      instagram_url,
      logo_url,
      business_hours,
      return_policy_text,
      about_content,
    } = body;

    const supabaseAdmin = createAdminClient();

    const { data: settings, error } = await supabaseAdmin
      .from('store_settings')
      .update({
        store_name: store_name || undefined,
        tagline: tagline !== undefined ? tagline : undefined,
        primary_whatsapp: primary_whatsapp || undefined,
        alt_phone: alt_phone !== undefined ? alt_phone : undefined,
        email: email || undefined,
        address: address !== undefined ? address : undefined,
        instagram_url: instagram_url !== undefined ? instagram_url : undefined,
        logo_url: logo_url !== undefined ? logo_url : undefined,
        business_hours: business_hours !== undefined ? business_hours : undefined,
        return_policy_text: return_policy_text !== undefined ? return_policy_text : undefined,
        about_content: about_content !== undefined ? about_content : undefined,
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API Error in PUT /api/admin/settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to update store settings' }, { status: 500 });
  }
}
