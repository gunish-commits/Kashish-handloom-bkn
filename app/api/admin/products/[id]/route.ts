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
      name,
      slug,
      category_id,
      description,
      price,
      sale_price,
      stock,
      low_stock_threshold,
      return_policy,
      photos,
      fabric,
      size,
      sku,
      featured,
      active,
    } = body;

    const supabaseAdmin = createAdminClient();

    // Generate and validate unique slug (forced to lowercase)
    let finalSlug = slug;
    if (slug) {
      finalSlug = slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
      let slugExists = true;
      let attempts = 0;
      while (slugExists && attempts < 10) {
        const { data: existing } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('slug', finalSlug)
          .neq('id', id)
          .maybeSingle();

        if (existing) {
          // Append a 3-digit random number to resolve collisions
          const rand = Math.floor(100 + Math.random() * 900);
          finalSlug = `${slug.toLowerCase().trim()}-${rand}`;
          attempts++;
        } else {
          slugExists = false;
        }
      }
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        name,
        slug: finalSlug,
        category_id: category_id || null,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        sale_price: sale_price !== undefined ? (sale_price ? parseFloat(sale_price) : null) : undefined,
        stock: stock !== undefined ? parseInt(stock, 10) : undefined,
        low_stock_threshold: low_stock_threshold !== undefined ? parseInt(low_stock_threshold, 10) : undefined,
        return_policy: return_policy || undefined,
        photos: photos || undefined,
        fabric,
        size,
        sku,
        featured: featured !== undefined ? !!featured : undefined,
        active: active !== undefined ? !!active : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(product);
  } catch (error: any) {
    console.error(`API Error in PUT /api/admin/products/[id] (${error.message}):`, error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
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
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API Error in DELETE /api/admin/products/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
