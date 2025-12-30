'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenuSkeleton } from '@/components/skeletons';

/**
 * UserMenu - Client Component für Auth-State
 *
 * Diese Komponente wird separat vom Header geladen und zeigt:
 * - Login-Button wenn nicht eingeloggt
 * - User-Info + Logout wenn eingeloggt
 * - Admin-Link wenn berechtigt
 */
export function UserMenu() {
  const t = useTranslations('nav');
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.roles?.includes('admin');
  const isModerator = session?.user?.roles?.includes('moderator');

  if (status === 'loading') {
    return <UserMenuSkeleton />;
  }

  if (!session?.user) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/signin">{t('login')}</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Admin/Moderation Link - Mobile */}
      {(isAdmin || isModerator) && (
        <Link
          href="/admin"
          className="md:hidden transition-colors hover:text-foreground/80 text-foreground/60"
        >
          <Shield className="h-5 w-5" />
        </Link>
      )}

      {/* User info */}
      <div className="hidden sm:flex items-center gap-2 mr-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {session.user.name || session.user.email || 'Benutzer'}
          </span>
          {isAdmin && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              Admin
            </span>
          )}
          {isModerator && !isAdmin && (
            <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              Mod
            </span>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-1"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">{t('logout')}</span>
      </Button>
    </div>
  );
}

/**
 * MyElectroVaultNavLink - Zeigt "Mein ElectroVault" Link nur wenn eingeloggt
 * Wird im Desktop-Menue verwendet
 */
export function MyElectroVaultNavLink() {
  const t = useTranslations('nav');
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <Link
      href="/my-electrovault"
      className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
    >
      <LayoutDashboard className="h-4 w-4" />
      {t('myElectroVault')}
    </Link>
  );
}

/**
 * AdminNavLink - Zeigt Admin-Link nur wenn berechtigt
 * Wird im Desktop-Menü verwendet
 */
export function AdminNavLink() {
  const t = useTranslations('nav');
  const { data: session } = useSession();

  const isAdmin = session?.user?.roles?.includes('admin');
  const isModerator = session?.user?.roles?.includes('moderator');

  if (!isAdmin && !isModerator) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
    >
      <Shield className="h-4 w-4" />
      {t('moderation')}
    </Link>
  );
}
