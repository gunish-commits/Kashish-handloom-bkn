import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../lib/supabase/server';

// Get all categories (admin view)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json(categories || []);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/categories:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Create category
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, emoji, display_order, active } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'A category with this URL slug already exists.' }, { status: 409 });
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        slug,
        emoji: emoji || null,
        display_order: display_order !== undefined ? parseInt(display_order, 10) : 0,
        active: active !== undefined ? !!active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('API Error in POST /api/admin/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
