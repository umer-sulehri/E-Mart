import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Admin Dashboard - E-Mart',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-muted-50">
      <div className="flex gap-6 p-4 lg:p-6">
        <AdminSidebar />

        <div className="min-w-0 flex-1">
          <DashboardHeader />

          <main className="mt-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
