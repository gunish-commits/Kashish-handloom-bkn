import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../lib/supabase/server';

// Get all products (admin view - active + inactive)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(name, slug)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(products || []);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
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

    if (!name || !slug || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Generate and validate unique slug (forced to lowercase)
    let finalSlug = slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
    let slugExists = true;
    let attempts = 0;
    while (slugExists && attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', finalSlug)
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

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        slug: finalSlug,
        category_id: category_id || null,
        description,
        price: parseFloat(price),
        sale_price: sale_price ? parseFloat(sale_price) : null,
        stock: parseInt(stock, 10),
        low_stock_threshold: low_stock_threshold ? parseInt(low_stock_threshold, 10) : 5,
        return_policy: return_policy || 'no_return',
        photos: photos || [],
        fabric,
        size,
        sku,
        featured: !!featured,
        active: active !== undefined ? !!active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('API Error in POST /api/admin/products:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
