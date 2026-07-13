import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlugs = searchParams.get('category')?.split(',').filter(Boolean) || [];
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('min');
    const maxPrice = searchParams.get('max');
    const returnPolicies = searchParams.get('return')?.split(',').filter(Boolean) || [];
    const inStock = searchParams.get('inStock') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const supabase = createServerClient();
    
    // Base query
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('active', true);

    // Filter by Category IDs (for related products)
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Filter by Category Slugs (for multi-selection filters)
    if (categorySlugs.length > 0 && !categoryId) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .in('slug', categorySlugs);
        
      if (catData && catData.length > 0) {
        const catIds = catData.map(c => c.id);
        query = query.in('category_id', catIds);
      } else {
        return NextResponse.json({ products: [], total: 0, hasMore: false });
      }
    }

    // Filter by Featured flag
    if (featured) {
      query = query.eq('featured', true);
    }

    // Filter by Stock status
    if (inStock) {
      query = query.gt('stock', 0);
    }

    // Filter by Return policies
    if (returnPolicies.length > 0) {
      query = query.in('return_policy', returnPolicies);
    }

    // Search query: Name, Description, Fabric, SKU, and Category Name with Relevance Sorting
    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      
      // 1. Fetch products matching columns directly
      const { data: directProducts, error: directError } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('active', true)
        .or(`name.ilike.%${trimmedSearch}%,description.ilike.%${trimmedSearch}%,fabric.ilike.%${trimmedSearch}%,sku.ilike.%${trimmedSearch}%`);

      if (directError) throw directError;

      // 2. Fetch categories matching search query
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', `%${trimmedSearch}%`);

      let catProducts: any[] = [];
      if (!catError && catData && catData.length > 0) {
        const catIds = catData.map(c => c.id);
        const { data: matchedCatProducts } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('active', true)
          .in('category_id', catIds);
        if (matchedCatProducts) catProducts = matchedCatProducts;
      }

      // 3. Merge and deduplicate results
      const mergedMap = new Map<string, any>();
      directProducts?.forEach(p => mergedMap.set(p.id, p));
      catProducts.forEach(p => mergedMap.set(p.id, p));
      
      const allResults = Array.from(mergedMap.values());

      // 4. Sort results by relevance:
      // - Exact name match first
      // - Starts with name match next
      // - Partial name match next
      // - Featured flag
      const queryLower = trimmedSearch.toLowerCase();
      allResults.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        const aExact = aName === queryLower ? 1 : 0;
        const bExact = bName === queryLower ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        const aStarts = aName.startsWith(queryLower) ? 1 : 0;
        const bStarts = bName.startsWith(queryLower) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        const aPartial = aName.includes(queryLower) ? 1 : 0;
        const bPartial = bName.includes(queryLower) ? 1 : 0;
        if (aPartial !== bPartial) return bPartial - aPartial;

        const aFeatured = a.featured ? 1 : 0;
        const bFeatured = b.featured ? 1 : 0;
        if (aFeatured !== bFeatured) return bFeatured - aFeatured;

        return 0;
      });

      // 5. Paginate final relevance-sorted array
      const total = allResults.length;
      const from = (page - 1) * limit;
      const slicedProducts = allResults.slice(from, from + limit);
      const hasMore = from + slicedProducts.length < total;

      return NextResponse.json({
        products: slicedProducts,
        total,
        hasMore,
      });
    }

    // Price filters: Coalesces sale_price and price check
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        query = query.or(`sale_price.gte.${min},and(sale_price.is.null,price.gte.${min})`);
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        query = query.or(`sale_price.lte.${max},and(sale_price.is.null,price.lte.${max})`);
      }
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'featured':
        query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination bounds calculation
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      throw error;
    }

    const total = count || 0;
    const hasMore = from + (products?.length || 0) < total;

    return NextResponse.json({
      products,
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error('API Error in /api/products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
