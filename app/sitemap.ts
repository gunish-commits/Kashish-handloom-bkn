import { MetadataRoute } from 'next';
import { createServerClient } from '../lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use custom domain URL (defaulting to kashishhandloom.in if env is not set)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kashishhandloom.in';

  // Base static paths
  const staticPaths = [
    '',
    '/shop',
    '/offers',
    '/about',
    '/contact',
    '/login',
    '/signup',
    '/cart',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    const supabase = createServerClient();

    // Fetch active products to generate product sitemap entries
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('active', true);

    const productPaths = (products || []).map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Fetch categories to generate category pages
    const { data: categories } = await supabase
      .from('categories')
      .select('slug');

    const categoryPaths = (categories || []).map((c) => ({
      url: `${baseUrl}/shop/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPaths, ...productPaths, ...categoryPaths];
  } catch (err) {
    console.error('Error generating sitemap:', err);
    return staticPaths;
  }
}
