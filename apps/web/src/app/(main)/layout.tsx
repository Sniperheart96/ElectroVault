import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

/**
 * Main Layout - Shared Layout für öffentliche Seiten
 *
 * Dieses Layout wird einmal geladen und bleibt bei Navigation stehen.
 * Nur {children} wechselt - Header und Footer werden NICHT neu gerendert.
 *
 * Das ermöglicht instant Navigation zwischen:
 * - Homepage
 * - Bauteile
 * - Hersteller
 * - Bauformen
 * - Statische Seiten (About, Help, etc.)
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
