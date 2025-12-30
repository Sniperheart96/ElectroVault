import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Github, Mail } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('imprint');

  return {
    title: t('title'),
    description: 'Impressum und rechtliche Informationen zu ElectroVault',
  };
}

export default function ImprintPage() {
  const t = useTranslations('imprint');

  return (
    <div className="container py-8 max-w-4xl">
        <Breadcrumb items={[{ label: t('title') }]} />

        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>

        <div className="prose prose-slate max-w-none">
          {/* Responsible Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('responsible')}</h2>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="mb-2">
                <strong>ElectroVault Community Project</strong>
              </p>
              <p className="text-muted-foreground">
                Dies ist ein Open-Source-Community-Projekt.
                <br />
                Für rechtliche Anfragen kontaktieren Sie bitte die Projekt-Maintainer.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('contact')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Github className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">GitHub</p>
                  <a
                    href="https://github.com/Sniperheart96/ElectroVault"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    github.com/Sniperheart96/ElectroVault
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">E-Mail</p>
                  <Link href="/contact" className="text-primary hover:underline">
                    Kontaktformular verwenden
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Disclaimer Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('disclaimer.title')}</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>{t('disclaimer.liability')}</p>
              <p>{t('disclaimer.content')}</p>
            </div>
          </section>

          {/* Open Source Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('opensource.title')}</h2>
            <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
              <p className="text-muted-foreground mb-4">
                {t('opensource.description')}
              </p>
              <a
                href="https://github.com/Sniperheart96/ElectroVault/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                MIT-Lizenz ansehen
              </a>
            </div>
          </section>
        </div>
    </div>
  );
}
