import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { DashboardContent } from './_components/dashboard-content';

export const metadata = {
  title: 'Mein ElectroVault',
  description: 'Dein persoenliches Dashboard - Entwuerfe, Statistiken und Aktivitaeten',
};

/**
 * Mein ElectroVault - User Dashboard
 *
 * Zeigt:
 * - Statistiken (Anzahl Bauteile, Varianten, Status-Verteilung)
 * - Entwuerfe (DRAFT) - private Zwischenspeicher
 * - Aktivitaetsverlauf
 * - Moderations-Status
 */
export default async function MyElectroVaultPage() {
  const session = await getSession();

  // Nicht eingeloggt -> zur Login-Seite
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/my-electrovault');
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mein ElectroVault</h1>
        <p className="text-muted-foreground mt-2">
          Willkommen zurueck, {session.user.name || session.user.email}! Hier siehst du deine Beitraege und Aktivitaeten.
        </p>
      </div>

      <DashboardContent />
    </div>
  );
}
