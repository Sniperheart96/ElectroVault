/**
 * Crypto Utilities - Verschlüsselung für sensible Daten
 *
 * Verwendet AES-256-GCM für die Verschlüsselung von API-Keys und anderen sensiblen Daten.
 * Der Schlüssel wird aus der Umgebungsvariable ENCRYPTION_KEY gelesen (32 Bytes hex-encoded).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Gibt den Verschlüsselungsschlüssel zurück.
 * Falls ENCRYPTION_KEY nicht gesetzt ist, wird ein deterministischer Fallback-Schlüssel verwendet (nur für Dev!).
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (keyHex) {
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) {
      throw new Error(
        `ENCRYPTION_KEY muss 32 Bytes (64 Hex-Zeichen) lang sein, ist aber ${key.length} Bytes`
      );
    }
    return key;
  }

  // Fallback für Entwicklung - NICHT in Produktion verwenden!
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ENCRYPTION_KEY Umgebungsvariable ist nicht gesetzt! ' +
        'Generiere einen Schlüssel mit: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Deterministischer Fallback-Schlüssel für Entwicklung
  console.warn(
    '⚠️ ENCRYPTION_KEY nicht gesetzt - verwende unsicheren Fallback-Schlüssel (nur für Entwicklung!)'
  );
  return scryptSync('electrovault-dev-key-DO-NOT-USE-IN-PRODUCTION', 'salt', 32);
}

/**
 * Verschlüsselt einen String mit AES-256-GCM
 *
 * @param plaintext Der zu verschlüsselnde Text
 * @returns Verschlüsselter String im Format: iv:tag:ciphertext (alle hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext (alle hex-encoded)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Entschlüsselt einen mit encrypt() verschlüsselten String
 *
 * @param ciphertext Verschlüsselter String im Format: iv:tag:ciphertext
 * @returns Der entschlüsselte Originaltext
 * @throws Error bei ungültigem Format oder falscher Entschlüsselung
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Ungültiges Verschlüsselungsformat - erwartet iv:tag:ciphertext');
  }

  const [ivHex, tagHex, dataHex] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Ungültige IV-Länge: ${iv.length}, erwartet ${IV_LENGTH}`);
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Ungültige Tag-Länge: ${tag.length}, erwartet ${TAG_LENGTH}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(
      'Entschlüsselung fehlgeschlagen - möglicherweise falscher Schlüssel oder manipulierte Daten'
    );
  }
}

/**
 * Generiert einen sicheren Schlüssel für ENCRYPTION_KEY
 * Nur für CLI/Setup-Skripte gedacht
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Prüft ob ein String verschlüsselt aussieht (hat das richtige Format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;

  const [ivHex, tagHex, dataHex] = parts;

  // Prüfe ob alle Teile gültige Hex-Strings sind
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(ivHex) || !hexRegex.test(tagHex) || !hexRegex.test(dataHex)) {
    return false;
  }

  // Prüfe Längen
  return ivHex.length === IV_LENGTH * 2 && tagHex.length === TAG_LENGTH * 2;
}
