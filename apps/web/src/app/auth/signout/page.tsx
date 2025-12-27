'use client';

/**
 * Sign Out Page
 * Confirms sign out and redirects
 */
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LogOut, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignOutPage() {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = () => {
    setIsLoading(true);
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('signOut.title')}</CardTitle>
          <CardDescription>{t('signOut.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('signOut.loading')}
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                {t('signOut.button')}
              </>
            )}
          </Button>

          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('signOut.cancel')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
