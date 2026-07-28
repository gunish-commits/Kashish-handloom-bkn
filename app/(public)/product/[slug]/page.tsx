import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { createServerClient } from '../../../../lib/supabase/server';
import ProductGallery from '../../../../components/product/ProductGallery';
import ProductDetailsSection from '../../../../components/product/ProductDetailsSection';
import RelatedProducts from '../../../../components/product/RelatedProducts';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.toLowerCase();

  const supabase = createServerClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .ilike('slug', slug)
    .maybeSingle();

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.name,
    description: product.description || `Purchase ${product.name} from Kashish Handloom Bikaner.`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.toLowerCase();

  const supabase = createServerClient();
  
  // Query product data from Supabase server-side
  const { data: product, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .ilike('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product in page:', error);
  }

  if (!product) {
    notFound();
  }

  const categoryName = product.categories?.name || 'Handloom';
  const categorySlug = product.categories?.slug || '';

  return (
    <div className="bg-[#FAF7F2] pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-fadeIn">
        
        {/* Back Button & Breadcrumbs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-250/50 select-none">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-deep-maroon uppercase tracking-wider transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-antique-gold" />
            <span>Back to Shop</span>
          </Link>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-sans tracking-wide">
            <Link href="/" className="hover:text-deep-maroon transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/shop" className="hover:text-deep-maroon transition-colors">
              Shop
            </Link>
            {categorySlug && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/shop?category=${categorySlug}`} className="hover:text-deep-maroon transition-colors">
                  {categoryName}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-ink font-medium truncate max-w-[150px] sm:max-w-none">
              {product.name}
            </span>
          </div>
        </div>

        {/* 2. Main Product Section (55% gallery / 45% details on desktop, stacked on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white p-4 md:p-8 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)]">
          {/* Gallery component (Left 55%) */}
          <div className="lg:col-span-7 w-full">
            <ProductGallery photos={product.photos} productName={product.name} description={product.description} />
          </div>

          {/* Details component (Right 45%) */}
          <div className="lg:col-span-5 w-full">
            <ProductDetailsSection product={product} />
          </div>
        </div>

        {/* 3. Related Products Showcase */}
        {product.category_id && (
          <RelatedProducts categoryId={product.category_id} excludeProductId={product.id} />
        )}
      </div>
    </div>
  );
}
