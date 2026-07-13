import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
