import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Shield, Cookie, Lock, UserCheck } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');

  return {
    title: t('title'),
    description: 'Datenschutzerklärung - Informationen zum Umgang mit personenbezogenen Daten',
  };
}

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const currentDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Header />
      <main className="container py-8 max-w-4xl">
        <Breadcrumb items={[{ label: t('title') }]} />

        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{t('title')}</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-8">
          {t('lastUpdated')}: {currentDate}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-lg text-muted-foreground">{t('intro')}</p>
          </section>

          {/* Responsible Party */}
          <section className="border-l-4 border-primary pl-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-6 w-6" />
              {t('responsible.title')}
            </h2>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="mb-2">{t('responsible.description')}</p>
              <p className="font-medium">ElectroVault Community Project</p>
              <Link href="/contact" className="text-primary hover:underline">
                Kontaktformular
              </Link>
            </div>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              {t('collection.title')}
            </h2>
            <p className="text-muted-foreground mb-4">{t('collection.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {t('collection.data')
                .split(', ')
                .map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
            </ul>
          </section>

          {/* Cookies */}
          <section className="border-l-4 border-amber-500 pl-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Cookie className="h-6 w-6 text-amber-500" />
              {t('cookies.title')}
            </h2>
            <p className="text-muted-foreground mb-4">{t('cookies.description')}</p>
            <div className="space-y-3">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-1">Notwendige Cookies</p>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.essential')}
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-1">Funktionale Cookies</p>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.functional')}
                </p>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section className="border-l-4 border-blue-500 pl-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-blue-500" />
              {t('auth.title')}
            </h2>
            <p className="text-muted-foreground mb-4">{t('auth.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {t('auth.data')
                .split(', ')
                .map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
            </ul>
          </section>

          {/* Your Rights */}
          <section className="bg-primary/5 p-8 rounded-lg border border-primary/10">
            <h2 className="text-2xl font-semibold mb-4">{t('rights.title')}</h2>
            <p className="text-muted-foreground mb-6">{t('rights.description')}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{t('rights.access')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{t('rights.correction')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{t('rights.deletion')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{t('rights.restriction')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{t('rights.portability')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{t('rights.objection')}</span>
              </div>
            </div>
          </section>

          {/* Contact for Privacy Questions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
            <p className="text-muted-foreground mb-4">{t('contact.description')}</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Kontakt aufnehmen
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
