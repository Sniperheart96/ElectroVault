#!/usr/bin/env node

/**
 * Validiert alle Übersetzungsdateien im messages/ Verzeichnis.
 *
 * Prüft:
 * 1. JSON-Syntax-Validität
 * 2. Vollständigkeit gegenüber en.json (Referenz)
 * 3. Keine leeren Werte
 *
 * Bei Fehlern: Exit-Code 1 (bricht Build ab)
 * Bei Warnungen: Exit-Code 0 (Build läuft weiter)
 *
 * Usage:
 *   node scripts/validate-translations.js
 *   node scripts/validate-translations.js --fix  # Entfernt fehlerhafte Dateien
 */

import { readFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, '..', 'messages');

const errors = [];
const warnings = [];

/**
 * Sammelt alle Keys eines verschachtelten Objekts
 */
function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Validiert eine einzelne JSON-Datei
 */
function validateFile(filePath, referenceKeys = null, fileName = '') {
  const result = {
    valid: true,
    syntaxError: null,
    missingKeys: [],
    emptyValues: [],
  };

  // 1. JSON-Syntax prüfen
  let content;
  try {
    const raw = readFileSync(filePath, 'utf8');
    content = JSON.parse(raw);
  } catch (error) {
    result.valid = false;
    result.syntaxError = error.message;
    return result;
  }

  // 2. Keys sammeln
  const keys = collectKeys(content);

  // 3. Gegen Referenz prüfen (wenn vorhanden)
  if (referenceKeys) {
    result.missingKeys = referenceKeys.filter(k => !keys.includes(k));
  }

  // 4. Leere Werte finden
  function findEmptyValues(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string' && value.trim() === '') {
        result.emptyValues.push(fullKey);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        findEmptyValues(value, fullKey);
      }
    }
  }
  findEmptyValues(content);

  return result;
}

// Hauptlogik
console.log('🔍 Validating translation files...\n');

// Alle JSON-Dateien im messages/ Verzeichnis finden
const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.error('❌ No translation files found in messages/');
  process.exit(1);
}

// Englische Datei als Referenz laden
const enPath = join(messagesDir, 'en.json');
let referenceKeys = null;

if (existsSync(enPath)) {
  try {
    const enContent = JSON.parse(readFileSync(enPath, 'utf8'));
    referenceKeys = collectKeys(enContent);
    console.log(`📖 Reference: en.json (${referenceKeys.length} keys)\n`);
  } catch (error) {
    errors.push(`en.json: ${error.message}`);
    console.error(`❌ en.json (reference): ${error.message}`);
  }
}

// Alle Dateien validieren
const fixMode = process.argv.includes('--fix');
const failedFiles = [];

for (const file of files) {
  const filePath = join(messagesDir, file);
  const result = validateFile(filePath, file !== 'en.json' ? referenceKeys : null, file);

  if (result.syntaxError) {
    console.error(`❌ ${file}: JSON INVALID`);
    console.error(`   └─ ${result.syntaxError}`);
    errors.push(`${file}: ${result.syntaxError}`);
    failedFiles.push(filePath);
  } else {
    let status = '✓';
    let notes = [];

    if (result.missingKeys.length > 0) {
      status = '⚠';
      notes.push(`${result.missingKeys.length} missing keys`);
      warnings.push(`${file}: Missing ${result.missingKeys.length} keys`);
    }

    if (result.emptyValues.length > 0) {
      status = '⚠';
      notes.push(`${result.emptyValues.length} empty values`);
      warnings.push(`${file}: ${result.emptyValues.length} empty values`);
    }

    console.log(`${status} ${file}${notes.length > 0 ? ` (${notes.join(', ')})` : ''}`);
  }
}

// Fix-Modus: Fehlerhafte Dateien entfernen
if (fixMode && failedFiles.length > 0) {
  console.log('\n🔧 Fix mode: Removing invalid files...');
  for (const filePath of failedFiles) {
    try {
      unlinkSync(filePath);
      console.log(`   Removed: ${filePath}`);
    } catch (error) {
      console.error(`   Failed to remove: ${filePath}`);
    }
  }
}

// Zusammenfassung
console.log('\n' + '='.repeat(50));
console.log(`📊 Summary: ${files.length} files checked`);

if (errors.length > 0) {
  console.log(`   ❌ ${errors.length} files with syntax errors`);
}

if (warnings.length > 0) {
  console.log(`   ⚠️  ${warnings.length} warnings (incomplete translations)`);
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('   ✅ All files valid and complete');
}

// Exit-Code basierend auf Fehlern
if (errors.length > 0) {
  console.log('\n🛑 Build would fail due to invalid JSON files!');
  console.log('   Run with --fix to remove invalid files.\n');
  process.exit(1);
}

console.log('');
process.exit(0);
