import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ElectroVault',
    template: '%s | ElectroVault',
  },
  description: 'Community-gepflegte Datenbank für elektrische Bauteile',
  keywords: [
    'Elektronik',
    'Bauteile',
    'Komponenten',
    'Datenbank',
    'Kondensatoren',
    'Widerstände',
    'ICs',
    'Halbleiter',
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
