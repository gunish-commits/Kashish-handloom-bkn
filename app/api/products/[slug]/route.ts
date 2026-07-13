import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 450 });
    }

    const supabase = createServerClient();
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name, id, slug)')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('API Error in /api/products/[slug]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
