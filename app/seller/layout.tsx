import { redirect } from 'next/navigation';
import SellerSidebar from '@/components/seller/SellerSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Seller Dashboard - E-Mart',
};

export default async function SellerLayout({
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
    redirect('/login?redirect=/seller');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller' && profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-muted-50">
      <div className="flex gap-6 p-4 lg:p-6">
        <SellerSidebar />

        <div className="min-w-0 flex-1">
          <DashboardHeader />

          {/* Content */}
          <main className="mt-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
