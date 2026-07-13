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
    const { name, slug, emoji, display_order, active } = body;

    const supabaseAdmin = createAdminClient();

    // Check slug uniqueness on rename
    if (slug) {
      const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'A category with this URL slug already exists.' }, { status: 409 });
      }
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name,
        slug,
        emoji,
        display_order: display_order !== undefined ? parseInt(display_order, 10) : undefined,
        active: active !== undefined ? !!active : undefined,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(category);
  } catch (error: any) {
    console.error(`API Error in PUT /api/admin/categories/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
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

    // Check if category contains products
    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) throw countError;

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category because it contains products. Move those products first!' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API Error in DELETE /api/admin/categories/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
