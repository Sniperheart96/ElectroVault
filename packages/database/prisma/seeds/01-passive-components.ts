// ElectroVault - Passive Components Seed
// Domain: Passive Components - Widerstände, Kondensatoren, Spulen, Transformatoren, etc.

import { PrismaClient } from '@prisma/client';
import {
  ls,
  createCategoryTree,
  createAttributes,
  type CategoryDef,
  type AttributeDef,
  AttributeDataType,
  AttributeScope,
} from './types';

/**
 * Seed-Funktion für Passive Components
 * Domain (Level 0) mit allen Unterkategorien und Attributen
 */
export async function seedPassiveComponents(prisma: PrismaClient): Promise<void> {
  console.log('📦 Seeding Passive Components...');

  // ============================================
  // KATEGORIE-HIERARCHIE DEFINIEREN
  // ============================================

  const passiveComponentsTree: CategoryDef[] = [
    {
      slug: 'passive-components',
      name: ls({ en: 'Passive Components', de: 'Passive Bauelemente' }),
      description: ls({
        en: 'Passive electronic components without power gain',
        de: 'Passive elektronische Bauelemente ohne Leistungsverstärkung',
      }),
      level: 1,
      sortOrder: 1,
      children: [
        // ============================================
        // FAMILY: RESISTORS
        // ============================================
        {
          slug: 'resistors',
          name: ls({ en: 'Resistors', de: 'Widerstände' }),
          description: ls({
            en: 'Components that limit electrical current flow',
            de: 'Bauelemente zur Strombegrenzung',
          }),
          level: 2,
          sortOrder: 1,
          children: [
            {
              slug: 'carbon-film-resistors',
              name: ls({ en: 'Carbon Film Resistors', de: 'Kohleschichtwiderstände' }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'metal-film-resistors',
              name: ls({ en: 'Metal Film Resistors', de: 'Metallschichtwiderstände' }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'wirewound-resistors',
              name: ls({ en: 'Wirewound Resistors', de: 'Drahtwiderstände' }),
              level: 3,
              sortOrder: 3,
              children: [
                {
                  slug: 'power-wirewound',
                  name: ls({ en: 'Power Wirewound', de: 'Leistungsdrahtwiderstände' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'precision-wirewound',
                  name: ls({ en: 'Precision Wirewound', de: 'Präzisionsdrahtwiderstände' }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'carbon-composition-resistors',
              name: ls({ en: 'Carbon Composition Resistors', de: 'Kohleschichtwiderstände (alt)' }),
              description: ls({
                en: 'Historical resistor type, mostly obsolete',
                de: 'Historischer Widerstandstyp, überwiegend veraltet',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'metal-oxide-resistors',
              name: ls({ en: 'Metal Oxide Resistors', de: 'Metalloxidwiderstände' }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'thick-film-resistors',
              name: ls({ en: 'Thick Film Resistors', de: 'Dickschichtwiderstände' }),
              level: 3,
              sortOrder: 6,
            },
            {
              slug: 'thin-film-resistors',
              name: ls({ en: 'Thin Film Resistors', de: 'Dünnschichtwiderstände' }),
              level: 3,
              sortOrder: 7,
            },
            {
              slug: 'potentiometers',
              name: ls({ en: 'Potentiometers', de: 'Potentiometer' }),
              level: 3,
              sortOrder: 8,
              children: [
                {
                  slug: 'rotary-potentiometers',
                  name: ls({ en: 'Rotary Potentiometers', de: 'Drehpotentiometer' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'slide-potentiometers',
                  name: ls({ en: 'Slide Potentiometers', de: 'Schiebepotentiometer' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'trimmer-potentiometers',
                  name: ls({ en: 'Trimmer Potentiometers', de: 'Trimmpotentiometer' }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'digital-potentiometers',
                  name: ls({ en: 'Digital Potentiometers', de: 'Digitale Potentiometer' }),
                  level: 4,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'resistor-networks',
              name: ls({ en: 'Resistor Networks', de: 'Widerstandsnetzwerke' }),
              level: 3,
              sortOrder: 9,
            },
            {
              slug: 'thermistors',
              name: ls({ en: 'Thermistors', de: 'Thermistoren' }),
              level: 3,
              sortOrder: 10,
              children: [
                {
                  slug: 'ntc-thermistors',
                  name: ls({ en: 'NTC Thermistors', de: 'NTC-Thermistoren' }),
                  description: ls({
                    en: 'Negative Temperature Coefficient',
                    de: 'Negativer Temperaturkoeffizient',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'ptc-thermistors',
                  name: ls({ en: 'PTC Thermistors', de: 'PTC-Thermistoren' }),
                  description: ls({
                    en: 'Positive Temperature Coefficient',
                    de: 'Positiver Temperaturkoeffizient',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'varistors',
              name: ls({ en: 'Varistors', de: 'Varistoren' }),
              description: ls({
                en: 'Voltage-dependent resistors for overvoltage protection',
                de: 'Spannungsabhängige Widerstände für Überspannungsschutz',
              }),
              level: 3,
              sortOrder: 11,
            },
            {
              slug: 'ldr-photoresistors',
              name: ls({ en: 'LDR / Photoresistors', de: 'LDR / Fotowiderstände' }),
              level: 3,
              sortOrder: 12,
            },
            {
              slug: 'shunt-resistors',
              name: ls({ en: 'Shunt Resistors', de: 'Shunt-Widerstände' }),
              description: ls({
                en: 'Low-resistance precision resistors for current measurement',
                de: 'Niederohmige Präzisionswiderstände zur Strommessung',
              }),
              level: 3,
              sortOrder: 13,
            },
            {
              slug: 'fusible-resistors',
              name: ls({ en: 'Fusible Resistors', de: 'Sicherungswiderstände' }),
              description: ls({
                en: 'Resistors that act as fuses under overcurrent',
                de: 'Widerstände mit Sicherungsfunktion bei Überstrom',
              }),
              level: 3,
              sortOrder: 14,
            },
          ],
        },

        // ============================================
        // FAMILY: CAPACITORS
        // ============================================
        {
          slug: 'capacitors',
          name: ls({ en: 'Capacitors', de: 'Kondensatoren' }),
          description: ls({
            en: 'Components that store electrical charge',
            de: 'Bauelemente zur Speicherung elektrischer Ladung',
          }),
          level: 2,
          sortOrder: 2,
          children: [
            {
              slug: 'electrolytic-capacitors',
              name: ls({ en: 'Electrolytic Capacitors', de: 'Elektrolytkondensatoren' }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'aluminum-electrolytic',
                  name: ls({ en: 'Aluminum Electrolytic', de: 'Aluminium-Elektrolytkondensatoren' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'tantalum-electrolytic',
                  name: ls({ en: 'Tantalum Electrolytic', de: 'Tantal-Elektrolytkondensatoren' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'niobium-electrolytic',
                  name: ls({ en: 'Niobium Electrolytic', de: 'Niob-Elektrolytkondensatoren' }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'polymer-electrolytic',
                  name: ls({ en: 'Polymer Electrolytic', de: 'Polymer-Elektrolytkondensatoren' }),
                  level: 4,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'ceramic-capacitors',
              name: ls({ en: 'Ceramic Capacitors', de: 'Keramikkondensatoren' }),
              level: 3,
              sortOrder: 2,
              children: [
                {
                  slug: 'mlcc',
                  name: ls({ en: 'MLCC', de: 'MLCC (Vielschicht-Keramik)' }),
                  description: ls({
                    en: 'Multi-Layer Ceramic Capacitors',
                    de: 'Vielschicht-Keramikkondensatoren',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'disc-ceramic',
                  name: ls({ en: 'Disc Ceramic', de: 'Keramikscheibenkondensatoren' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'chip-ceramic',
                  name: ls({ en: 'Chip Ceramic', de: 'Chip-Keramikkondensatoren' }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'film-capacitors',
              name: ls({ en: 'Film Capacitors', de: 'Folienkondensatoren' }),
              level: 3,
              sortOrder: 3,
              children: [
                {
                  slug: 'polyester-film',
                  name: ls({ en: 'Polyester Film', de: 'Polyester-Folienkondensatoren' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'polypropylene-film',
                  name: ls({ en: 'Polypropylene Film', de: 'Polypropylen-Folienkondensatoren' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'polycarbonate-film',
                  name: ls({ en: 'Polycarbonate Film', de: 'Polycarbonat-Folienkondensatoren' }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'ptfe-film',
                  name: ls({ en: 'PTFE Film', de: 'PTFE-Folienkondensatoren' }),
                  level: 4,
                  sortOrder: 4,
                },
                {
                  slug: 'pen-film',
                  name: ls({ en: 'PEN Film', de: 'PEN-Folienkondensatoren' }),
                  level: 4,
                  sortOrder: 5,
                },
              ],
            },
            {
              slug: 'paper-capacitors',
              name: ls({ en: 'Paper Capacitors', de: 'Papierkondensatoren' }),
              description: ls({
                en: 'Historical capacitor type, mostly obsolete',
                de: 'Historischer Kondensatortyp, überwiegend veraltet',
              }),
              level: 3,
              sortOrder: 4,
              children: [
                {
                  slug: 'oil-filled-paper',
                  name: ls({ en: 'Oil-Filled Paper', de: 'Öl-getränkte Papierkondensatoren' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'mp-capacitors',
                  name: ls({ en: 'MP Capacitors', de: 'MP-Kondensatoren' }),
                  description: ls({
                    en: 'Metallized Paper Capacitors',
                    de: 'Metallisierte Papierkondensatoren',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'mica-capacitors',
              name: ls({ en: 'Mica Capacitors', de: 'Glimmerkondensatoren' }),
              level: 3,
              sortOrder: 5,
              children: [
                {
                  slug: 'silver-mica',
                  name: ls({ en: 'Silver Mica', de: 'Silber-Glimmerkondensatoren' }),
                  level: 4,
                  sortOrder: 1,
                },
              ],
            },
            {
              slug: 'supercapacitors',
              name: ls({ en: 'Supercapacitors', de: 'Superkondensatoren' }),
              level: 3,
              sortOrder: 6,
              children: [
                {
                  slug: 'edlc',
                  name: ls({ en: 'EDLC', de: 'EDLC (Doppelschichtkondensatoren)' }),
                  description: ls({
                    en: 'Electric Double-Layer Capacitors',
                    de: 'Elektrische Doppelschichtkondensatoren',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'hybrid-supercapacitors',
                  name: ls({ en: 'Hybrid Supercapacitors', de: 'Hybrid-Superkondensatoren' }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'variable-capacitors',
              name: ls({ en: 'Variable Capacitors', de: 'Variable Kondensatoren' }),
              level: 3,
              sortOrder: 7,
              children: [
                {
                  slug: 'air-variable',
                  name: ls({ en: 'Air Variable', de: 'Luft-Drehkondensatoren' }),
                  description: ls({
                    en: 'Historical air-dielectric variable capacitors',
                    de: 'Historische Luft-Drehkondensatoren',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'trimmer-capacitors',
                  name: ls({ en: 'Trimmer Capacitors', de: 'Trimmkondensatoren' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'varicap-diodes',
                  name: ls({ en: 'Varicap Diodes', de: 'Varicap-Dioden' }),
                  description: ls({
                    en: 'Voltage-variable capacitance (cross-reference to Semiconductors)',
                    de: 'Spannungsabhängige Kapazität (Querverw. zu Halbleitern)',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'vacuum-capacitors',
              name: ls({ en: 'Vacuum Capacitors', de: 'Vakuumkondensatoren' }),
              description: ls({
                en: 'High-power RF applications',
                de: 'HF-Leistungsanwendungen',
              }),
              level: 3,
              sortOrder: 8,
            },
            {
              slug: 'safety-capacitors',
              name: ls({ en: 'Safety Capacitors', de: 'Sicherheitskondensatoren' }),
              level: 3,
              sortOrder: 9,
              children: [
                {
                  slug: 'x-class',
                  name: ls({ en: 'X-Class', de: 'X-Klasse (Phase-Phase)' }),
                  description: ls({
                    en: 'Line-to-line capacitors',
                    de: 'Phase-zu-Phase-Kondensatoren',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'y-class',
                  name: ls({ en: 'Y-Class', de: 'Y-Klasse (Phase-Erde)' }),
                  description: ls({
                    en: 'Line-to-ground capacitors',
                    de: 'Phase-zu-Erde-Kondensatoren',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
          ],
        },

        // ============================================
        // FAMILY: INDUCTORS
        // ============================================
        {
          slug: 'inductors',
          name: ls({ en: 'Inductors', de: 'Spulen' }),
          description: ls({
            en: 'Components that store energy in a magnetic field',
            de: 'Bauelemente zur Speicherung magnetischer Energie',
          }),
          level: 2,
          sortOrder: 3,
          children: [
            {
              slug: 'fixed-inductors',
              name: ls({ en: 'Fixed Inductors', de: 'Festinduktivitäten' }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'ferrite-core',
                  name: ls({ en: 'Ferrite Core', de: 'Ferritkern-Spulen' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'air-core',
                  name: ls({ en: 'Air Core', de: 'Luftkern-Spulen' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'iron-core',
                  name: ls({ en: 'Iron Core', de: 'Eisenkern-Spulen' }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'shielded-inductors',
                  name: ls({ en: 'Shielded Inductors', de: 'Geschirmte Spulen' }),
                  level: 4,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'power-inductors',
              name: ls({ en: 'Power Inductors', de: 'Leistungsspulen' }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'rf-inductors',
              name: ls({ en: 'RF Inductors', de: 'HF-Spulen' }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'smd-inductors',
              name: ls({ en: 'SMD Inductors', de: 'SMD-Spulen' }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'chokes',
              name: ls({ en: 'Chokes', de: 'Drosseln' }),
              level: 3,
              sortOrder: 5,
              children: [
                {
                  slug: 'common-mode-chokes',
                  name: ls({ en: 'Common Mode Chokes', de: 'Gleichtaktdrosseln' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'power-line-chokes',
                  name: ls({ en: 'Power Line Chokes', de: 'Netzdrosseln' }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'variable-inductors',
              name: ls({ en: 'Variable Inductors', de: 'Variable Spulen' }),
              level: 3,
              sortOrder: 6,
            },
            {
              slug: 'inductor-arrays',
              name: ls({ en: 'Inductor Arrays', de: 'Spulen-Arrays' }),
              level: 3,
              sortOrder: 7,
            },
          ],
        },

        // ============================================
        // FAMILY: TRANSFORMERS
        // ============================================
        {
          slug: 'transformers',
          name: ls({ en: 'Transformers', de: 'Transformatoren' }),
          description: ls({
            en: 'Components for voltage transformation via magnetic coupling',
            de: 'Bauelemente zur Spannungsumwandlung über magnetische Kopplung',
          }),
          level: 2,
          sortOrder: 4,
          children: [
            {
              slug: 'power-transformers',
              name: ls({ en: 'Power Transformers', de: 'Netztransformatoren' }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'mains-transformers',
                  name: ls({ en: 'Mains Transformers', de: 'Netz-Transformatoren' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'toroidal-transformers',
                  name: ls({ en: 'Toroidal Transformers', de: 'Ringkerntransformatoren' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'encapsulated-transformers',
                  name: ls({ en: 'Encapsulated Transformers', de: 'Gekapselte Transformatoren' }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'signal-transformers',
              name: ls({ en: 'Signal Transformers', de: 'Signal-Transformatoren' }),
              level: 3,
              sortOrder: 2,
              children: [
                {
                  slug: 'audio-transformers',
                  name: ls({ en: 'Audio Transformers', de: 'Audio-Transformatoren' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'isolation-transformers',
                  name: ls({ en: 'Isolation Transformers', de: 'Trenn-Transformatoren' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'pulse-transformers',
                  name: ls({ en: 'Pulse Transformers', de: 'Impuls-Transformatoren' }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'rf-transformers',
              name: ls({ en: 'RF Transformers', de: 'HF-Transformatoren' }),
              level: 3,
              sortOrder: 3,
              children: [
                {
                  slug: 'balun-transformers',
                  name: ls({ en: 'Balun Transformers', de: 'Balun-Transformatoren' }),
                  level: 4,
                  sortOrder: 1,
                },
              ],
            },
            {
              slug: 'current-transformers',
              name: ls({ en: 'Current Transformers', de: 'Stromwandler' }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'flyback-transformers',
              name: ls({ en: 'Flyback Transformers', de: 'Flyback-Transformatoren' }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'smps-transformers',
              name: ls({ en: 'SMPS Transformers', de: 'Schaltnetzteiltransformatoren' }),
              level: 3,
              sortOrder: 6,
            },
          ],
        },

        // ============================================
        // FAMILY: CRYSTALS & OSCILLATORS
        // ============================================
        {
          slug: 'crystals-oscillators',
          name: ls({ en: 'Crystals & Oscillators', de: 'Quarze & Oszillatoren' }),
          description: ls({
            en: 'Precision frequency reference components',
            de: 'Präzisions-Frequenzreferenzen',
          }),
          level: 2,
          sortOrder: 5,
          children: [
            {
              slug: 'quartz-crystals',
              name: ls({ en: 'Quartz Crystals', de: 'Quarz-Kristalle' }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'crystal-oscillators',
              name: ls({ en: 'Crystal Oscillators', de: 'Quarz-Oszillatoren' }),
              level: 3,
              sortOrder: 2,
              children: [
                {
                  slug: 'xo',
                  name: ls({ en: 'XO', de: 'XO (Standard-Oszillatoren)' }),
                  description: ls({
                    en: 'Standard Crystal Oscillators',
                    de: 'Standard-Quarz-Oszillatoren',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'tcxo',
                  name: ls({ en: 'TCXO', de: 'TCXO (Temperaturkomp.)' }),
                  description: ls({
                    en: 'Temperature Compensated Crystal Oscillators',
                    de: 'Temperaturkompensierte Quarz-Oszillatoren',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'vcxo',
                  name: ls({ en: 'VCXO', de: 'VCXO (Spannungsgesteuert)' }),
                  description: ls({
                    en: 'Voltage Controlled Crystal Oscillators',
                    de: 'Spannungsgesteuerte Quarz-Oszillatoren',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'ocxo',
                  name: ls({ en: 'OCXO', de: 'OCXO (Ofengesteuert)' }),
                  description: ls({
                    en: 'Oven Controlled Crystal Oscillators',
                    de: 'Ofengesteuerte Quarz-Oszillatoren',
                  }),
                  level: 4,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'ceramic-resonators',
              name: ls({ en: 'Ceramic Resonators', de: 'Keramikresonatoren' }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'saw-devices',
              name: ls({ en: 'SAW Devices', de: 'SAW-Bauelemente' }),
              description: ls({
                en: 'Surface Acoustic Wave devices',
                de: 'Oberflächenwellen-Bauelemente',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'mems-oscillators',
              name: ls({ en: 'MEMS Oscillators', de: 'MEMS-Oszillatoren' }),
              level: 3,
              sortOrder: 5,
            },
          ],
        },

        // ============================================
        // FAMILY: FILTERS
        // ============================================
        {
          slug: 'filters',
          name: ls({ en: 'Filters', de: 'Filter' }),
          description: ls({
            en: 'Frequency-selective components',
            de: 'Frequenzselektive Bauelemente',
          }),
          level: 2,
          sortOrder: 6,
          children: [
            {
              slug: 'emi-rfi-filters',
              name: ls({ en: 'EMI/RFI Filters', de: 'EMI/RFI-Filter' }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'lc-filters',
              name: ls({ en: 'LC Filters', de: 'LC-Filter' }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'ceramic-filters',
              name: ls({ en: 'Ceramic Filters', de: 'Keramikfilter' }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'crystal-filters',
              name: ls({ en: 'Crystal Filters', de: 'Quarzfilter' }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'saw-filters',
              name: ls({ en: 'SAW Filters', de: 'SAW-Filter' }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'rc-filters',
              name: ls({ en: 'RC Filters', de: 'RC-Filter' }),
              level: 3,
              sortOrder: 6,
            },
            {
              slug: 'feedthrough-filters',
              name: ls({ en: 'Feedthrough Filters', de: 'Durchführungsfilter' }),
              level: 3,
              sortOrder: 7,
            },
          ],
        },

        // ============================================
        // FAMILY: FERRITES
        // ============================================
        {
          slug: 'ferrites',
          name: ls({ en: 'Ferrites', de: 'Ferrite' }),
          description: ls({
            en: 'Magnetic ferrite components for EMI suppression',
            de: 'Magnetische Ferrit-Bauelemente zur EMI-Unterdrückung',
          }),
          level: 2,
          sortOrder: 7,
          children: [
            {
              slug: 'ferrite-beads',
              name: ls({ en: 'Ferrite Beads', de: 'Ferritperlen' }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'ferrite-cores',
              name: ls({ en: 'Ferrite Cores', de: 'Ferritkerne' }),
              level: 3,
              sortOrder: 2,
              children: [
                {
                  slug: 'toroid-cores',
                  name: ls({ en: 'Toroid Cores', de: 'Ringkerne' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'e-cores',
                  name: ls({ en: 'E-Cores', de: 'E-Kerne' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'rod-cores',
                  name: ls({ en: 'Rod Cores', de: 'Stabkerne' }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'ferrite-sleeves',
              name: ls({ en: 'Ferrite Sleeves', de: 'Ferrit-Mantelkerne' }),
              level: 3,
              sortOrder: 3,
            },
          ],
        },

        // ============================================
        // FAMILY: FUSES & PROTECTION
        // ============================================
        {
          slug: 'fuses-protection',
          name: ls({ en: 'Fuses & Protection', de: 'Sicherungen & Schutz' }),
          description: ls({
            en: 'Overcurrent and overvoltage protection devices',
            de: 'Überstrom- und Überspannungsschutz',
          }),
          level: 2,
          sortOrder: 8,
          children: [
            {
              slug: 'cartridge-fuses',
              name: ls({ en: 'Cartridge Fuses', de: 'Schmelzsicherungen' }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'glass-fuses',
                  name: ls({ en: 'Glass Fuses', de: 'Glassicherungen' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'ceramic-fuses',
                  name: ls({ en: 'Ceramic Fuses', de: 'Keramiksicherungen' }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'blade-fuses',
              name: ls({ en: 'Blade Fuses', de: 'Flachsicherungen' }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'smd-fuses',
              name: ls({ en: 'SMD Fuses', de: 'SMD-Sicherungen' }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'resettable-fuses',
              name: ls({ en: 'Resettable Fuses', de: 'Rückstellbare Sicherungen' }),
              description: ls({
                en: 'PTC/PolySwitch self-resetting fuses',
                de: 'PTC/PolySwitch selbstrückstellende Sicherungen',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'thermal-fuses',
              name: ls({ en: 'Thermal Fuses', de: 'Thermosicherungen' }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'fuseholders',
              name: ls({ en: 'Fuseholders', de: 'Sicherungshalter' }),
              level: 3,
              sortOrder: 6,
            },
          ],
        },
      ],
    },
  ];

  // Erstelle Kategorie-Hierarchie
  const categoryMap = await createCategoryTree(prisma, passiveComponentsTree);

  // ============================================
  // ATTRIBUTE DEFINIEREN
  // ============================================

  console.log('  🏷️  Creating attributes for Resistors...');

  // RESISTORS - Family-Level Attribute
  const resistorsId = categoryMap.get('resistors');
  if (resistorsId) {
    await createAttributes(prisma, resistorsId, [
      {
        name: 'resistance',
        displayName: ls({ en: 'Resistance', de: 'Widerstand' }),
        unit: 'Ω',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        isLabel: true,
        allowedPrefixes: ['-', 'm', 'k', 'M', 'G'],
        sortOrder: 1,
      },
      {
        name: 'tolerance',
        displayName: ls({ en: 'Tolerance', de: 'Toleranz' }),
        unit: '%',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'power_rating',
        displayName: ls({ en: 'Power Rating', de: 'Nennleistung' }),
        unit: 'W',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'm', 'k'],
        sortOrder: 3,
      },
      {
        name: 'temperature_coefficient',
        displayName: ls({ en: 'Temperature Coefficient', de: 'Temperaturkoeffizient' }),
        unit: 'ppm/°C',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 4,
      },
      {
        name: 'voltage_rating',
        displayName: ls({ en: 'Voltage Rating', de: 'Nennspannung' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 5,
      },
      {
        name: 'operating_temperature',
        displayName: ls({ en: 'Operating Temperature Range', de: 'Betriebstemperaturbereich' }),
        unit: '°C',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 6,
      },
    ]);
  }

  console.log('  🏷️  Creating attributes for Capacitors...');

  // CAPACITORS - Family-Level Attribute
  const capacitorsId = categoryMap.get('capacitors');
  if (capacitorsId) {
    await createAttributes(prisma, capacitorsId, [
      {
        name: 'capacitance',
        displayName: ls({ en: 'Capacitance', de: 'Kapazität' }),
        unit: 'F',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        isLabel: true,
        allowedPrefixes: ['-', 'p', 'n', 'µ', 'm'],
        sortOrder: 1,
      },
      {
        name: 'voltage_rating',
        displayName: ls({ en: 'Voltage Rating', de: 'Spannungsfestigkeit' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 2,
      },
      {
        name: 'tolerance',
        displayName: ls({ en: 'Tolerance', de: 'Toleranz' }),
        unit: '%',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 3,
      },
      {
        name: 'dielectric',
        displayName: ls({ en: 'Dielectric', de: 'Dielektrikum' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedValues: [
          'Ceramic',
          'Electrolytic',
          'Aluminum',
          'Tantalum',
          'Polymer',
          'Film',
          'Polyester',
          'Polypropylene',
          'Paper',
          'Mica',
        ],
        sortOrder: 4,
      },
      {
        name: 'temp_coefficient',
        displayName: ls({ en: 'Temperature Coefficient', de: 'Temperaturkoeffizient' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedValues: ['C0G/NP0', 'X7R', 'X5R', 'Y5V', 'Z5U'],
        sortOrder: 5,
      },
      {
        name: 'operating_temperature',
        displayName: ls({ en: 'Operating Temperature Range', de: 'Betriebstemperaturbereich' }),
        unit: '°C',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 6,
      },
    ]);
  }

  // ELECTROLYTIC CAPACITORS - Type-Level zusätzliche Attribute
  const electrolyticCapsId = categoryMap.get('electrolytic-capacitors');
  if (electrolyticCapsId) {
    await createAttributes(prisma, electrolyticCapsId, [
      {
        name: 'esr',
        displayName: ls({ en: 'ESR', de: 'ESR' }),
        unit: 'Ω',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 10,
      },
      {
        name: 'ripple_current',
        displayName: ls({ en: 'Ripple Current', de: 'Rippelstrom' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 11,
      },
      {
        name: 'lifetime_hours',
        displayName: ls({ en: 'Lifetime', de: 'Lebensdauer' }),
        unit: 'h',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 12,
      },
    ]);
  }

  console.log('  🏷️  Creating attributes for Inductors...');

  // INDUCTORS - Family-Level Attribute
  const inductorsId = categoryMap.get('inductors');
  if (inductorsId) {
    await createAttributes(prisma, inductorsId, [
      {
        name: 'inductance',
        displayName: ls({ en: 'Inductance', de: 'Induktivität' }),
        unit: 'H',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        isLabel: true,
        allowedPrefixes: ['-', 'n', 'µ', 'm'],
        sortOrder: 1,
      },
      {
        name: 'dc_resistance',
        displayName: ls({ en: 'DC Resistance', de: 'Gleichstromwiderstand' }),
        unit: 'Ω',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'm', 'k'],
        sortOrder: 2,
      },
      {
        name: 'current_rating',
        displayName: ls({ en: 'Current Rating', de: 'Nennstrom' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 3,
      },
      {
        name: 'saturation_current',
        displayName: ls({ en: 'Saturation Current', de: 'Sättigungsstrom' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 4,
      },
      {
        name: 'srf',
        displayName: ls({ en: 'Self-Resonant Frequency', de: 'Eigenresonanzfrequenz' }),
        unit: 'Hz',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 5,
      },
      {
        name: 'operating_temperature',
        displayName: ls({ en: 'Operating Temperature Range', de: 'Betriebstemperaturbereich' }),
        unit: '°C',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 6,
      },
    ]);
  }

  console.log('  🏷️  Creating attributes for Transformers...');

  // TRANSFORMERS - Family-Level Attribute
  const transformersId = categoryMap.get('transformers');
  if (transformersId) {
    await createAttributes(prisma, transformersId, [
      {
        name: 'primary_voltage',
        displayName: ls({ en: 'Primary Voltage', de: 'Primärspannung' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 1,
      },
      {
        name: 'secondary_voltage',
        displayName: ls({ en: 'Secondary Voltage', de: 'Sekundärspannung' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 2,
      },
      {
        name: 'power_rating',
        displayName: ls({ en: 'Power Rating', de: 'Nennleistung' }),
        unit: 'VA',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'm', 'k'],
        sortOrder: 3,
      },
      {
        name: 'turns_ratio',
        displayName: ls({ en: 'Turns Ratio', de: 'Übersetzungsverhältnis' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        sortOrder: 4,
      },
      {
        name: 'frequency',
        displayName: ls({ en: 'Operating Frequency', de: 'Betriebsfrequenz' }),
        unit: 'Hz',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k', 'M'],
        sortOrder: 5,
      },
      {
        name: 'operating_temperature',
        displayName: ls({ en: 'Operating Temperature Range', de: 'Betriebstemperaturbereich' }),
        unit: '°C',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 6,
      },
    ]);
  }

  console.log('  🏷️  Creating attributes for Crystals & Oscillators...');

  // CRYSTALS & OSCILLATORS - Family-Level Attribute
  const crystalsOscillatorsId = categoryMap.get('crystals-oscillators');
  if (crystalsOscillatorsId) {
    await createAttributes(prisma, crystalsOscillatorsId, [
      {
        name: 'frequency',
        displayName: ls({ en: 'Frequency', de: 'Frequenz' }),
        unit: 'Hz',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        isLabel: true,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 1,
      },
      {
        name: 'load_capacitance',
        displayName: ls({ en: 'Load Capacitance', de: 'Lastkapazität' }),
        unit: 'F',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'p'],
        sortOrder: 2,
      },
      {
        name: 'frequency_tolerance',
        displayName: ls({ en: 'Frequency Tolerance', de: 'Frequenztoleranz' }),
        unit: 'ppm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 3,
      },
      {
        name: 'stability',
        displayName: ls({ en: 'Frequency Stability', de: 'Frequenzstabilität' }),
        unit: 'ppm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 4,
      },
      {
        name: 'operating_temperature',
        displayName: ls({ en: 'Operating Temperature Range', de: 'Betriebstemperaturbereich' }),
        unit: '°C',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 5,
      },
    ]);
  }

  console.log('  🏷️  Creating attributes for Fuses & Protection...');

  // FUSES & PROTECTION - Family-Level Attribute
  const fusesProtectionId = categoryMap.get('fuses-protection');
  if (fusesProtectionId) {
    await createAttributes(prisma, fusesProtectionId, [
      {
        name: 'current_rating',
        displayName: ls({ en: 'Current Rating', de: 'Nennstrom' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        isLabel: true,
        allowedPrefixes: ['-', 'm', 'k'],
        sortOrder: 1,
      },
      {
        name: 'voltage_rating',
        displayName: ls({ en: 'Voltage Rating', de: 'Nennspannung' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 2,
      },
      {
        name: 'breaking_capacity',
        displayName: ls({ en: 'Breaking Capacity', de: 'Abschaltvermögen' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 3,
      },
      {
        name: 'response_time',
        displayName: ls({ en: 'Response Time', de: 'Ansprechzeit' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedValues: ['FF (ultra fast)', 'F (fast)', 'M (medium)', 'T (slow)', 'TT (very slow)'],
        sortOrder: 4,
      },
      {
        name: 'operating_temperature',
        displayName: ls({ en: 'Operating Temperature Range', de: 'Betriebstemperaturbereich' }),
        unit: '°C',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 5,
      },
    ]);
  }

  console.log('✅ Passive Components seeding complete!');
}
