import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, hasAnyRole, Roles } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Check if user has admin or moderator role
  if (!session || !hasAnyRole(session, [Roles.ADMIN, Roles.MODERATOR])) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar session={session} />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
