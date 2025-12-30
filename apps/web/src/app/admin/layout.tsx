import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, hasAnyRole, Roles } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminSidebarSkeleton } from '@/components/skeletons';

/**
 * Admin Layout - Shell First Pattern
 *
 * Auth-Check ist absichtlich blockierend - unautorisierte User
 * sollen die Admin-Shell nicht sehen.
 * Die Sidebar wird danach per Suspense gestreamt.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Auth-Check muss blockieren - kritisch für Sicherheit
  if (!session || !hasAnyRole(session, [Roles.ADMIN, Roles.MODERATOR])) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Session ist bereits geladen, kann sofort rendern */}
      <Suspense fallback={<AdminSidebarSkeleton />}>
        <AdminSidebar session={session} />
      </Suspense>
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
