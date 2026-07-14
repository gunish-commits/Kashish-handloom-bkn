import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import AdminClientLayout from '../../components/layout/AdminClientLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Admin Portal | Kashish Handloom',
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If no user or error — redirect to login
  if (error || !user) {
    redirect('/admin/login');
  }

  // Double check admin privileges
  const adminEmail = process.env.ADMIN_EMAIL || 'kashishhandloombkn@gmail.com';
  if (user.email !== adminEmail && user.email !== 'kashishhandloombkn@gmail.com') {
    redirect('/admin/login');
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
