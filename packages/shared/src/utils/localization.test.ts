import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLocalizedText,
  hasTranslation,
  slugifyLocalized,
  type LocalizedString,
} from './localization';

describe('getLocalizedText', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return text in requested locale', () => {
    const data: LocalizedString = {
      de: 'Hallo Welt',
      en: 'Hello World',
    };

    expect(getLocalizedText(data, 'de')).toBe('Hallo Welt');
    expect(getLocalizedText(data, 'en')).toBe('Hello World');
  });

  it('should fallback to English if requested locale not available', () => {
    const data: LocalizedString = {
      en: 'Hello World',
    };

    expect(getLocalizedText(data, 'de')).toBe('Hello World');
    expect(getLocalizedText(data, 'fr')).toBe('Hello World');
  });

  it('should fallback to first available language if English not available', () => {
    const data: LocalizedString = {
      fr: 'Bonjour le monde',
    };

    expect(getLocalizedText(data, 'de')).toBe('Bonjour le monde');
  });

  it('should return error indicator if no translation available', () => {
    const data: LocalizedString = {};

    const result = getLocalizedText(data, 'de');

    expect(result).toBe('[MISSING TRANSLATION]');
    expect(console.error).toHaveBeenCalledWith(
      'No localized value found for any language',
      { data, locale: 'de' }
    );
  });

  it('should use English (FALLBACK_LOCALE) as default locale', () => {
    const data: LocalizedString = {
      de: 'Deutsch',
      en: 'English',
    };

    // FALLBACK_LOCALE ist 'en' - Englisch als internationaler Standard
    expect(getLocalizedText(data)).toBe('English');
  });
});

describe('hasTranslation', () => {
  it('should return true if at least one translation exists', () => {
    expect(hasTranslation({ de: 'Test' })).toBe(true);
    expect(hasTranslation({ en: 'Test', de: 'Test' })).toBe(true);
  });

  it('should return false if no translation exists', () => {
    expect(hasTranslation({})).toBe(false);
  });

  it('should return false if only empty strings', () => {
    expect(hasTranslation({ de: '', en: '   ' })).toBe(false);
  });
});

describe('slugifyLocalized', () => {
  it('should convert German text to slug', () => {
    const data: LocalizedString = {
      de: 'Kondensator Typ A',
    };

    expect(slugifyLocalized(data, 'de')).toBe('kondensator-typ-a');
  });

  it('should handle German umlauts', () => {
    const data: LocalizedString = {
      de: 'Gehäuse für Prüfgerät',
    };

    expect(slugifyLocalized(data, 'de')).toBe('gehaeuse-fuer-pruefgeraet');
  });

  it('should remove special characters', () => {
    const data: LocalizedString = {
      en: 'Test & Demo (v2.0)',
    };

    expect(slugifyLocalized(data, 'en')).toBe('test-demo-v2-0');
  });

  it('should return "untitled" if no translation available', () => {
    const data: LocalizedString = {};

    expect(slugifyLocalized(data, 'de')).toBe('untitled');
  });

  it('should trim leading and trailing hyphens', () => {
    const data: LocalizedString = {
      en: '---Test---',
    };

    expect(slugifyLocalized(data, 'en')).toBe('test');
  });
});
