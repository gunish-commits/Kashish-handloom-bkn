import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Pending',
};

export default function OrderPendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
