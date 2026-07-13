import { redirect } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const categorySlug = resolvedParams.category;

  // Consolidate queries by redirecting path filters directly to catalog parameters
  redirect(`/shop?category=${categorySlug}`);
}
