'use client';

/**
 * Sign In Page
 * Redirects to Keycloak for authentication
 */
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, Suspense } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SignInContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const handleSignIn = () => {
    setIsLoading(true);
    signIn('keycloak', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('signIn.title')}</CardTitle>
          <CardDescription>{t('signIn.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error === 'OAuthSignin' && t('errors.oauthSignin')}
              {error === 'OAuthCallback' && t('errors.oauthCallback')}
              {error === 'OAuthCreateAccount' && t('errors.oauthCreateAccount')}
              {error === 'Callback' && t('errors.callback')}
              {error === 'AccessDenied' && t('errors.accessDenied')}
              {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'Callback', 'AccessDenied'].includes(error) &&
                t('errors.default')}
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('signIn.loading')}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {t('signIn.button')}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('signIn.hint')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
