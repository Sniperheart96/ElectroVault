'use client';

/**
 * Auth Error Page
 * Displays authentication errors
 */
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ErrorContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return t('errors.configuration');
      case 'AccessDenied':
        return t('errors.accessDenied');
      case 'Verification':
        return t('errors.verification');
      case 'OAuthSignin':
        return t('errors.oauthSignin');
      case 'OAuthCallback':
        return t('errors.oauthCallback');
      case 'OAuthCreateAccount':
        return t('errors.oauthCreateAccount');
      case 'EmailCreateAccount':
        return t('errors.emailCreateAccount');
      case 'Callback':
        return t('errors.callback');
      case 'OAuthAccountNotLinked':
        return t('errors.oauthAccountNotLinked');
      case 'SessionRequired':
        return t('errors.sessionRequired');
      default:
        return t('errors.default');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t('error.title')}</CardTitle>
          <CardDescription>{t('error.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive text-center">
              {getErrorMessage(error)}
            </p>
            {error && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Error Code: {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/auth/signin">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('error.tryAgain')}
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('error.backHome')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
