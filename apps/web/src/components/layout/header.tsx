'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Zap, User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const t = useTranslations('nav');
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.roles?.includes('admin');
  const isModerator = session?.user?.roles?.includes('moderator');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Zap className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">ElectroVault</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/components"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            {t('components')}
          </Link>
          <Link
            href="/manufacturers"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            {t('manufacturers')}
          </Link>
          <Link
            href="/packages"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            {t('packages')}
          </Link>
          {(isAdmin || isModerator) && (
            <Link
              href="/admin"
              className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
            >
              <Shield className="h-4 w-4" />
              {t('moderation')}
            </Link>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth section */}
        <div className="flex items-center space-x-2">
          {status === 'loading' ? (
            <div className="h-8 w-20 animate-pulse bg-muted rounded" />
          ) : session?.user ? (
            <>
              {/* User info and dropdown */}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/signin">{t('login')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
