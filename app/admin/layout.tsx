import { Metadata } from 'next';
import AdminClientLayout from '../../components/layout/AdminClientLayout';

export const metadata: Metadata = {
  title: {
    absolute: 'Admin Portal | Kashish Handloom',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
