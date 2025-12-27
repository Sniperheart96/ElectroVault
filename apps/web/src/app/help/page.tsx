import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HelpCircle, Search, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { FAQAccordion } from './faq-accordion';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('help');

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function HelpPage() {
  const t = useTranslations('help');

  return (
    <>
      <Header />
      <main className="container py-8 max-w-4xl">
        <Breadcrumb items={[{ label: t('title') }]} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{t('title')}</h1>
        </div>

        <p className="text-xl text-muted-foreground mb-12">{t('subtitle')}</p>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Link
            href="/components"
            className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Search className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Bauteile durchsuchen</h3>
            <p className="text-sm text-muted-foreground">
              Finden Sie Komponenten in unserer Datenbank
            </p>
          </Link>

          <Link
            href="/auth/signin"
            className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <UserPlus className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Account erstellen</h3>
            <p className="text-sm text-muted-foreground">
              Tragen Sie zur Datenbank bei
            </p>
          </Link>

          <a
            href="https://github.com/Sniperheart96/ElectroVault"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <HelpCircle className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">GitHub</h3>
            <p className="text-sm text-muted-foreground">
              Dokumentation und Issues
            </p>
          </a>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {/* General */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('general.title')}</h2>
            <FAQAccordion
              items={[
                {
                  question: t('general.what.question'),
                  answer: t('general.what.answer'),
                },
                {
                  question: t('general.free.question'),
                  answer: t('general.free.answer'),
                },
              ]}
            />
          </section>

          {/* Search */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('search.title')}</h2>
            <FAQAccordion
              items={[
                {
                  question: t('search.how.question'),
                  answer: t('search.how.answer'),
                },
                {
                  question: t('search.filters.question'),
                  answer: t('search.filters.answer'),
                },
              ]}
            />
          </section>

          {/* Contribute */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('contribute.title')}</h2>
            <FAQAccordion
              items={[
                {
                  question: t('contribute.account.question'),
                  answer: t('contribute.account.answer'),
                },
                {
                  question: t('contribute.how.question'),
                  answer: t('contribute.how.answer'),
                },
                {
                  question: t('contribute.quality.question'),
                  answer: t('contribute.quality.answer'),
                },
              ]}
            />
          </section>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 p-8 bg-muted/50 rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-2">
            Ihre Frage wurde nicht beantwortet?
          </h3>
          <p className="text-muted-foreground mb-4">
            Kontaktieren Sie uns gerne direkt.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
