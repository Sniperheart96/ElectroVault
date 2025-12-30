'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu, AdminNavLink, MyElectroVaultNavLink } from './user-menu';
import { LocaleSwitcher } from './locale-switcher';

interface HeaderProps {
  onMenuToggle?: () => void;
}

/**
 * Header - Hauptnavigation mit Shell First Pattern
 *
 * Die statische Navigation (Logo, Links) rendert sofort.
 * Das UserMenu (Auth-State) wird separat geladen.
 */
export function Header({ onMenuToggle }: HeaderProps) {
  const t = useTranslations('nav');

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

        {/* Logo - Static, rendert sofort */}
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Zap className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">ElectroVault</span>
        </Link>

        {/* Desktop Navigation - Static, rendert sofort */}
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
          {/* Mein ElectroVault - nur fuer eingeloggte User */}
          <MyElectroVaultNavLink />
          {/* Admin-Link lädt Auth-State separat */}
          <AdminNavLink />
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Locale Switcher - Sprachauswahl */}
        <LocaleSwitcher />

        {/* User Menu - Lädt Auth-State separat */}
        <UserMenu />
      </div>
    </header>
  );
}
