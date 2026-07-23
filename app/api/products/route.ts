import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';

// Standard Levenshtein Distance implementation for fuzzy spelling matching
function levenshtein(a: string, b: string): number {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 1; j <= b.length; j++) {
    tmp[0].push(j);
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// In-memory fuzzy match, rank, and sorting algorithm
function fuzzySearch(products: any[], searchStr: string): any[] {
  const queryLower = searchStr.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  const queryNoSpaces = queryLower.replace(/\s+/g, '');

  if (queryWords.length === 0) return products;

  // 1. Scan query words to find if any match an active category name
  const categoryMatchIds = new Set<string>();
  
  queryWords.forEach((qWord: string) => {
    products.forEach((p: any) => {
      if (p.categories?.name && p.category_id) {
        const cName = p.categories.name.toLowerCase();
        const words = cName.split(/\s+/).filter(Boolean);
        const matches = words.some((w: string) => 
          w === qWord || 
          w === qWord + 's' || 
          qWord === w + 's' ||
          (qWord.length >= 4 && (w.startsWith(qWord) || qWord.startsWith(w))) ||
          levenshtein(qWord, w) <= 1
        );
        if (matches) {
          categoryMatchIds.add(p.category_id);
        }
      }
    });
  });

  // 2. Filter candidates: if there is a category match, restrict results to that category
  let candidates = products;
  if (categoryMatchIds.size > 0) {
    candidates = products.filter((p: any) => p.category_id && categoryMatchIds.has(p.category_id));
  }

  // 3. Score candidates
  const scoredProducts = candidates.map((product: any) => {
    let score = 0;
    const nameLower = (product.name || '').toLowerCase();
    const descLower = (product.description || '').toLowerCase();
    const fabricLower = (product.fabric || '').toLowerCase();
    const skuLower = (product.sku || '').toLowerCase();
    const categoryName = (product.categories?.name || '').toLowerCase();

    const nameNoSpaces = nameLower.replace(/\s+/g, '');

    // Check for exact full phrase match
    if (nameLower === queryLower) {
      score += 100;
    } else if (nameLower.includes(queryLower)) {
      score += 40;
    }

    // Check for collapsed spaces (e.g. pillowcover <-> pillow cover)
    if (queryNoSpaces.length > 3) {
      if (nameNoSpaces === queryNoSpaces) {
        score += 80;
      } else if (nameNoSpaces.includes(queryNoSpaces) || queryNoSpaces.includes(nameNoSpaces)) {
        score += 35;
      }
    }

    // Compute token word match scores
    const nameWords = nameLower.split(/\s+/).filter(Boolean);
    const categoryWords = categoryName.split(/\s+/).filter(Boolean);
    const fabricWords = fabricLower.split(/\s+/).filter(Boolean);
    const descWords = descLower.split(/\s+/).filter(Boolean).slice(0, 100);

    queryWords.forEach((qWord: string) => {
      let bestWordScore = 0;

      // Check name words
      nameWords.forEach((pWord: string) => {
        let wordScore = 0;
        if (pWord === qWord) {
          wordScore = 15; // Exact word match
        } else if (pWord.startsWith(qWord) || qWord.startsWith(pWord)) {
          wordScore = 8; // Prefix word match
        } else if (pWord.includes(qWord) || qWord.includes(pWord)) {
          wordScore = 5; // Substring word match
        } else {
          // Fuzzy match on spelling
          const dist = levenshtein(qWord, pWord);
          const maxAllowedDist = qWord.length >= 6 ? 2 : 1;
          if (dist <= maxAllowedDist) {
            wordScore = 3; // Misspelled word match
          }
        }
        if (wordScore > bestWordScore) bestWordScore = wordScore;
      });

      // Check category words
      categoryWords.forEach((cWord: string) => {
        let wordScore = 0;
        if (cWord === qWord) {
          wordScore = 10;
        } else if (cWord.includes(qWord)) {
          wordScore = 5;
        } else {
          const dist = levenshtein(qWord, cWord);
          if (dist <= 1) {
            wordScore = 2;
          }
        }
        const weightedScore = wordScore * 1.2;
        if (weightedScore > bestWordScore) bestWordScore = weightedScore;
      });

      // Check fabric words
      fabricWords.forEach((fWord: string) => {
        if (fWord === qWord) {
          bestWordScore = Math.max(bestWordScore, 8);
        }
      });

      // Check description words
      let bestDescScore = 0;
      descWords.forEach((dWord: string) => {
        let dScore = 0;
        if (dWord === qWord) {
          dScore = 4;
        } else if (dWord.includes(qWord)) {
          dScore = 2;
        } else if (levenshtein(qWord, dWord) <= 1) {
          dScore = 1;
        }
        const weightedScore = dScore * 0.5;
        if (weightedScore > bestDescScore) {
          bestDescScore = weightedScore;
        }
      });
      bestWordScore = Math.max(bestWordScore, bestDescScore);

      score += bestWordScore;
    });

    // Category match boost: add extra priority if the category was matched
    if (categoryMatchIds.has(product.category_id)) {
      score += 200;
    }

    // Boost featured items and in-stock items
    if (product.featured) score += 2;
    if (product.stock > 0) score += 1;

    return { product, score };
  });

  return scoredProducts
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .map((item: any) => item.product);
}

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

    // Fetch candidates matching filters
    const { data: candidates, error } = await query;
    if (error) throw error;

    let results = candidates || [];

    // 1. If search is active, perform fuzzy matching
    if (search && search.trim() !== '') {
      results = fuzzySearch(results, search.trim());
    }

    // 2. Apply sorting on the active candidate list based on actual display/sale price
    if (sort === 'price_asc') {
      results.sort((a, b) => {
        const priceA = a.sale_price !== null && a.sale_price !== undefined ? a.sale_price : a.price;
        const priceB = b.sale_price !== null && b.sale_price !== undefined ? b.sale_price : b.price;
        return priceA - priceB;
      });
    } else if (sort === 'price_desc') {
      results.sort((a, b) => {
        const priceA = a.sale_price !== null && a.sale_price !== undefined ? a.sale_price : a.price;
        const priceB = b.sale_price !== null && b.sale_price !== undefined ? b.sale_price : b.price;
        return priceB - priceA;
      });
    } else if (sort === 'featured') {
      results.sort((a, b) => {
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else { // 'newest'
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // 3. Paginate the sorted results
    const total = results.length;
    const from = (page - 1) * limit;
    const slicedProducts = results.slice(from, from + limit);
    const hasMore = from + slicedProducts.length < total;

    return NextResponse.json({
      products: slicedProducts,
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error('API Error in /api/products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
