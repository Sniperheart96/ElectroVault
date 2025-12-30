'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@electrovault/database';
import {
  UILocaleSchema,
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_MAX_AGE,
} from '@electrovault/schemas';

/**
 * Setzt die UI-Sprache für den aktuellen Benutzer.
 *
 * - Für alle Benutzer: Speichert die Sprache im Cookie
 * - Für eingeloggte Benutzer: Speichert zusätzlich in der Datenbank
 *
 * @param locale - Die gewünschte Sprache (z.B. 'en', 'de')
 * @throws Error wenn die Sprache ungültig ist
 */
export async function setLocale(locale: string): Promise<void> {
  // Validierung mit Zod
  const parsed = UILocaleSchema.safeParse(locale);
  if (!parsed.success) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const validLocale = parsed.data;

  // Cookie setzen (für alle Benutzer - eingeloggt und Gäste)
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, validLocale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    // secure nur in Production (HTTPS)
    secure: process.env.NODE_ENV === 'production',
  });

  // DB aktualisieren (nur für eingeloggte Benutzer)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { externalId: session.user.id },
        select: { id: true, preferences: true },
      });

      if (user) {
        const currentPrefs = (user.preferences as object) || {};
        await prisma.user.update({
          where: { id: user.id },
          data: {
            preferences: {
              ...currentPrefs,
              locale: validLocale,
            },
          },
        });
      }
    }
  } catch (error) {
    // DB-Fehler loggen, aber nicht werfen - Cookie wurde bereits gesetzt
    console.error('Failed to update user locale preference in database:', error);
  }

  // Seite neu validieren, damit die neue Sprache angewendet wird
  revalidatePath('/', 'layout');
}
