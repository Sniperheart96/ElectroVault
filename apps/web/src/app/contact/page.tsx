import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Mail, Github, MessageSquare } from 'lucide-react';
import { ContactForm } from './contact-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <>
      <Header />
      <main className="container py-8 max-w-5xl">
        <Breadcrumb items={[{ label: t('title') }]} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{t('title')}</h1>
        </div>

        <p className="text-xl text-muted-foreground mb-12">{t('subtitle')}</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-6">Nachricht senden</h2>
              <ContactForm />
            </div>
          </div>

          {/* Alternative Contact Methods */}
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4">{t('alternatives.title')}</h3>

              <div className="space-y-4">
                {/* GitHub */}
                <a
                  href="https://github.com/Sniperheart96/ElectroVault/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 bg-background border rounded-lg hover:border-primary transition-colors"
                >
                  <Github className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">GitHub Issues</p>
                    <p className="text-sm text-muted-foreground">
                      {t('alternatives.github')}
                    </p>
                  </div>
                </a>

                {/* Email */}
                <div className="flex items-start gap-3 p-4 bg-background border rounded-lg">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">E-Mail</p>
                    <p className="text-sm text-muted-foreground">
                      {t('alternatives.email')}
                    </p>
                    <p className="text-sm text-primary mt-1">
                      info@electrovault.org
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Antwortzeiten</h3>
              <p className="text-sm text-muted-foreground">
                Da ElectroVault ein Community-Projekt ist, werden Anfragen von Freiwilligen bearbeitet.
                Bitte haben Sie Geduld - wir antworten in der Regel innerhalb von 48 Stunden.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 border rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Community Support</h3>
            <p className="text-sm text-muted-foreground">
              Nutzen Sie GitHub Discussions für allgemeine Fragen
            </p>
          </div>

          <div className="text-center p-6 border rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
              <Github className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Bug Reports</h3>
            <p className="text-sm text-muted-foreground">
              Melden Sie technische Probleme direkt auf GitHub
            </p>
          </div>

          <div className="text-center p-6 border rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Partneranfragen</h3>
            <p className="text-sm text-muted-foreground">
              Für geschäftliche Anfragen nutzen Sie das Formular
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
