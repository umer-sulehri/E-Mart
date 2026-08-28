import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardLayout({
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
    redirect('/login?redirect=/dashboard');
  }

  return (
    <div className="min-h-screen bg-muted-50">
      <div className="flex gap-6 p-4 lg:p-6">
        <DashboardSidebar />

        <div className="min-w-0 flex-1">
          <DashboardHeader />

          {/* Breadcrumb */}
          <nav className="mt-4 flex items-center gap-2 text-sm text-muted-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-muted-500 transition-colors hover:text-primary"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-secondary-800">Dashboard</span>
          </nav>

          {/* Content */}
          <main className="mt-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
