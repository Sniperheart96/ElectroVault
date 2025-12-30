import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import {
  Database,
  History,
  Users,
  Code,
  FileText,
  Upload,
  GitBranch,
  MessageSquare,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="container py-8 max-w-6xl">
        <Breadcrumb items={[{ label: t('title') }]} />

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Zap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12 rounded-2xl border border-primary/20">
            <h2 className="text-3xl font-semibold mb-4">{t('mission.title')}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('mission.description')}
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center">
            {t('features.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Comprehensive Database */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t('features.comprehensive.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('features.comprehensive.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Historical Archive */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <History className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t('features.historical.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('features.historical.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Community-driven */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t('features.community.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('features.community.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Open Source */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Code className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t('features.open.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('features.open.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contribute Section */}
        <section className="mb-16">
          <div className="bg-muted/50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-semibold mb-4">{t('contribute.title')}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t('contribute.description')}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Data Entry */}
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm">{t('contribute.dataEntry')}</span>
              </div>

              {/* Datasheets */}
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <Upload className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm">{t('contribute.datasheets')}</span>
              </div>

              {/* Code */}
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <GitBranch className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm">{t('contribute.code')}</span>
              </div>

              {/* Feedback */}
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm">{t('contribute.feedback')}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Account erstellen
              </Link>
              <a
                href="https://github.com/Sniperheart96/ElectroVault"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <Code className="h-5 w-5" />
                GitHub besuchen
              </a>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Technologie</h2>
          <p className="text-muted-foreground mb-4">
            ElectroVault ist gebaut mit modernen Open-Source-Technologien:
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="px-3 py-1 bg-muted rounded-full">Next.js</span>
            <span className="px-3 py-1 bg-muted rounded-full">TypeScript</span>
            <span className="px-3 py-1 bg-muted rounded-full">PostgreSQL</span>
            <span className="px-3 py-1 bg-muted rounded-full">Prisma</span>
            <span className="px-3 py-1 bg-muted rounded-full">Fastify</span>
            <span className="px-3 py-1 bg-muted rounded-full">Keycloak</span>
            <span className="px-3 py-1 bg-muted rounded-full">MinIO</span>
            <span className="px-3 py-1 bg-muted rounded-full">TailwindCSS</span>
          </div>
        </section>
    </div>
  );
}
