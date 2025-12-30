'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  CheckCircle,
  Home,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { hasRole, Roles } from '@/lib/auth';

interface AdminSidebarProps {
  session: Session;
}

interface NavigationItem {
  nameKey: string;
  href: string;
  icon: typeof LayoutDashboard;
  descriptionKey?: string;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
}

const navigation: NavigationItem[] = [
  {
    nameKey: 'admin.sidebar.dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    nameKey: 'admin.sidebar.moderation',
    href: '/admin/moderation',
    icon: CheckCircle,
    descriptionKey: 'admin.sidebar.moderationDescription',
    moderatorOnly: true,
  },
  {
    nameKey: 'admin.sidebar.import',
    href: '/admin/import',
    icon: Download,
    descriptionKey: 'admin.sidebar.importDescription',
    adminOnly: true,
  },
  {
    nameKey: 'admin.sidebar.users',
    href: '/admin/users',
    icon: Users,
    adminOnly: true,
  },
];

export function AdminSidebar({ session }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const isAdmin = hasRole(session, Roles.ADMIN);
  const isModerator = hasRole(session, Roles.MODERATOR) || isAdmin;

  const filteredNav = navigation.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.moderatorOnly && !isModerator) return false;
    return true;
  });

  return (
    <aside className="flex w-64 flex-col border-r bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">ElectroVault</span>
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          title={t('admin.sidebar.backToHome')}
        >
          <Home className="h-5 w-5" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.nameKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>
              {session.user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{session.user?.name || t('admin.sidebar.user')}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {session.user?.roles?.[0] || 'viewer'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" asChild>
          <Link href="/auth/signout">
            <LogOut className="mr-2 h-4 w-4" />
            {t('admin.sidebar.logout')}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
