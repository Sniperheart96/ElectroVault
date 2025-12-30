// ElectroVault - Seed für Active Semiconductor Components
// Diskrete Halbleiter: Dioden, Transistoren, Thyristoren, etc.

import { PrismaClient, AttributeScope, AttributeDataType } from '@prisma/client';
import {
  ls,
  createCategoryTree,
  createAttributes,
  type CategoryDef,
  type AttributeDef,
} from './types';

/**
 * Seed-Funktion für Active Semiconductor Components
 */
export async function seedActiveComponents(prisma: PrismaClient): Promise<void> {
  console.log('  📦 Seeding Active Semiconductor Components...');

  // ============================================
  // KATEGORIE-HIERARCHIE
  // ============================================

  const categoryTree: CategoryDef[] = [
    {
      slug: 'discrete-semiconductors',
      name: ls({
        de: 'Diskrete Halbleiter',
        en: 'Discrete Semiconductors',
        fr: 'Semi-conducteurs discrets',
        es: 'Semiconductores discretos',
        it: 'Semiconduttori discreti',
      }),
      description: ls({
        de: 'Einzelne Halbleiter-Bauelemente wie Dioden, Transistoren und Thyristoren',
        en: 'Individual semiconductor components such as diodes, transistors and thyristors',
        fr: 'Composants semiconducteurs individuels tels que diodes, transistors et thyristors',
      }),
      level: 1,
      sortOrder: 2, // Nach Passive Components
      children: [
        // ============================================
        // FAMILY: DIODES
        // ============================================
        {
          slug: 'diodes',
          name: ls({
            de: 'Dioden',
            en: 'Diodes',
            fr: 'Diodes',
            es: 'Diodos',
            it: 'Diodi',
          }),
          description: ls({
            de: 'Zweipolhalbleiter für Gleichrichtung, Spannungsstabilisierung und Signalverarbeitung',
            en: 'Two-terminal semiconductors for rectification, voltage regulation and signal processing',
          }),
          level: 2,
          sortOrder: 1,
          children: [
            {
              slug: 'rectifier-diodes',
              name: ls({ de: 'Gleichrichterdioden', en: 'Rectifier Diodes', fr: 'Diodes de redressement' }),
              description: ls({
                de: 'Dioden zur Umwandlung von Wechsel- in Gleichspannung',
                en: 'Diodes for converting AC to DC voltage',
              }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'standard-recovery-diodes',
                  name: ls({ de: 'Standard-Recovery-Dioden', en: 'Standard Recovery Diodes' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'fast-recovery-diodes',
                  name: ls({ de: 'Fast-Recovery-Dioden', en: 'Fast Recovery Diodes' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'ultrafast-recovery-diodes',
                  name: ls({ de: 'Ultrafast-Recovery-Dioden', en: 'Ultrafast Recovery Diodes' }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'schottky-diodes',
              name: ls({ de: 'Schottky-Dioden', en: 'Schottky Diodes', fr: 'Diodes Schottky' }),
              description: ls({
                de: 'Schnelle Dioden mit niedriger Flussspannung (Metall-Halbleiter-Übergang)',
                en: 'Fast diodes with low forward voltage (metal-semiconductor junction)',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'zener-diodes',
              name: ls({ de: 'Zenerdioden', en: 'Zener Diodes', fr: 'Diodes Zener' }),
              description: ls({
                de: 'Spannungsstabilisierung durch kontrollierten Durchbruch in Sperrrichtung',
                en: 'Voltage stabilization through controlled reverse breakdown',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'tvs-diodes',
              name: ls({ de: 'TVS-Dioden', en: 'TVS Diodes', fr: 'Diodes TVS' }),
              description: ls({
                de: 'Transient Voltage Suppressor - Schutz vor Überspannungsspitzen',
                en: 'Transient Voltage Suppressor - protection against voltage spikes',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'signal-diodes',
              name: ls({ de: 'Signaldioden', en: 'Signal Diodes' }),
              description: ls({
                de: 'Kleine Dioden für Signalverarbeitung und HF-Anwendungen',
                en: 'Small diodes for signal processing and RF applications',
              }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'switching-diodes',
              name: ls({ de: 'Schaltdioden', en: 'Switching Diodes' }),
              description: ls({
                de: 'Schnelle Dioden für digitale Schaltungen',
                en: 'Fast diodes for digital circuits',
              }),
              level: 3,
              sortOrder: 6,
            },
            {
              slug: 'bridge-rectifiers',
              name: ls({ de: 'Brückengleichrichter', en: 'Bridge Rectifiers', fr: 'Ponts redresseurs' }),
              description: ls({
                de: 'Fertige Gleichrichterbrücken (4 oder 6 Dioden im Gehäuse)',
                en: 'Complete rectifier bridges (4 or 6 diodes in package)',
              }),
              level: 3,
              sortOrder: 7,
              children: [
                {
                  slug: 'single-phase-bridge',
                  name: ls({ de: 'Einphasen-Brücke', en: 'Single Phase Bridge' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'three-phase-bridge',
                  name: ls({ de: 'Dreiphasen-Brücke', en: 'Three Phase Bridge' }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'varactor-diodes',
              name: ls({ de: 'Varaktordioden', en: 'Varactor Diodes', fr: 'Diodes varactor' }),
              description: ls({
                de: 'Spannungsabhängige Kapazität für Abstimmung (Tuning)',
                en: 'Voltage-dependent capacitance for tuning',
              }),
              level: 3,
              sortOrder: 8,
            },
            {
              slug: 'pin-diodes',
              name: ls({ de: 'PIN-Dioden', en: 'PIN Diodes' }),
              description: ls({
                de: 'HF-Schalter und Dämpfungsglieder (P-Intrinsic-N Struktur)',
                en: 'RF switches and attenuators (P-Intrinsic-N structure)',
              }),
              level: 3,
              sortOrder: 9,
            },
            {
              slug: 'step-recovery-diodes',
              name: ls({ de: 'Step-Recovery-Dioden', en: 'Step Recovery Diodes' }),
              description: ls({
                de: 'Frequenzvervielfacher und Impulsgeneratoren',
                en: 'Frequency multipliers and pulse generators',
              }),
              level: 3,
              sortOrder: 10,
            },
            {
              slug: 'gunn-diodes',
              name: ls({ de: 'Gunn-Dioden', en: 'Gunn Diodes' }),
              description: ls({
                de: 'Mikrowellen-Oszillatoren (GaAs, negativ differentieller Widerstand)',
                en: 'Microwave oscillators (GaAs, negative differential resistance)',
              }),
              level: 3,
              sortOrder: 11,
            },
            {
              slug: 'impatt-diodes',
              name: ls({ de: 'IMPATT-Dioden', en: 'IMPATT Diodes' }),
              description: ls({
                de: 'Hochfrequenz-Leistungsoszillatoren (Impact Ionization Avalanche Transit Time)',
                en: 'High frequency power oscillators (Impact Ionization Avalanche Transit Time)',
              }),
              level: 3,
              sortOrder: 12,
            },
            {
              slug: 'tunnel-diodes',
              name: ls({ de: 'Tunneldioden', en: 'Tunnel Diodes', fr: 'Diodes tunnel' }),
              description: ls({
                de: 'Historische HF-Oszillatoren mit negativem Widerstandsbereich (Esaki-Diode)',
                en: 'Historical RF oscillators with negative resistance region (Esaki diode)',
              }),
              level: 3,
              sortOrder: 13,
            },
            {
              slug: 'point-contact-diodes',
              name: ls({ de: 'Spitzendioden', en: 'Point Contact Diodes' }),
              description: ls({
                de: 'Historische Germanium-Detektordioden (Kristalldetektor)',
                en: 'Historical germanium detector diodes (crystal detector)',
              }),
              level: 3,
              sortOrder: 14,
            },
          ],
        },

        // ============================================
        // FAMILY: TRANSISTORS
        // ============================================
        {
          slug: 'transistors',
          name: ls({
            de: 'Transistoren',
            en: 'Transistors',
            fr: 'Transistors',
            es: 'Transistores',
            it: 'Transistor',
          }),
          description: ls({
            de: 'Aktive Halbleiterbauelemente zur Verstärkung und Schaltung',
            en: 'Active semiconductor devices for amplification and switching',
          }),
          level: 2,
          sortOrder: 2,
          children: [
            {
              slug: 'bipolar-transistors',
              name: ls({ de: 'Bipolartransistoren', en: 'Bipolar Transistors', fr: 'Transistors bipolaires' }),
              description: ls({
                de: 'BJT (Bipolar Junction Transistor) - Stromgesteuerte Verstärker',
                en: 'BJT (Bipolar Junction Transistor) - current-controlled amplifiers',
              }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'npn-transistors',
                  name: ls({ de: 'NPN-Transistoren', en: 'NPN Transistors' }),
                  description: ls({
                    de: 'Negativ-Positiv-Negativ Dotierung (häufigste Bauform)',
                    en: 'Negative-Positive-Negative doping (most common type)',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'pnp-transistors',
                  name: ls({ de: 'PNP-Transistoren', en: 'PNP Transistors' }),
                  description: ls({
                    de: 'Positiv-Negativ-Positiv Dotierung (komplementär zu NPN)',
                    en: 'Positive-Negative-Positive doping (complementary to NPN)',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'darlington-transistors',
                  name: ls({ de: 'Darlington-Transistoren', en: 'Darlington Transistors' }),
                  description: ls({
                    de: 'Zwei kaskadengeschaltete Transistoren für hohe Verstärkung',
                    en: 'Two cascaded transistors for high gain',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'phototransistors',
                  name: ls({ de: 'Fototransistoren', en: 'Phototransistors' }),
                  description: ls({
                    de: 'Lichtempfindliche Transistoren (Basis durch Licht gesteuert)',
                    en: 'Light-sensitive transistors (base controlled by light)',
                  }),
                  level: 4,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'fet-transistors',
              name: ls({ de: 'Feldeffekttransistoren', en: 'FET Transistors', fr: 'Transistors à effet de champ' }),
              description: ls({
                de: 'Field Effect Transistor - Spannungsgesteuerte Verstärker',
                en: 'Field Effect Transistor - voltage-controlled amplifiers',
              }),
              level: 3,
              sortOrder: 2,
              children: [
                {
                  slug: 'jfet',
                  name: ls({ de: 'JFET', en: 'JFET' }),
                  description: ls({
                    de: 'Junction Field Effect Transistor - sperrschichtgesteuert',
                    en: 'Junction Field Effect Transistor - junction-controlled',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'mosfet',
                  name: ls({ de: 'MOSFET', en: 'MOSFET' }),
                  description: ls({
                    de: 'Metal-Oxide-Semiconductor FET - isoliertes Gate',
                    en: 'Metal-Oxide-Semiconductor FET - insulated gate',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'n-channel-mosfet',
                  name: ls({ de: 'N-Kanal MOSFET', en: 'N-Channel MOSFET' }),
                  description: ls({
                    de: 'N-dotierter Kanal (häufigste Bauform)',
                    en: 'N-doped channel (most common type)',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'p-channel-mosfet',
                  name: ls({ de: 'P-Kanal MOSFET', en: 'P-Channel MOSFET' }),
                  description: ls({
                    de: 'P-dotierter Kanal (komplementär zu N-Kanal)',
                    en: 'P-doped channel (complementary to N-channel)',
                  }),
                  level: 4,
                  sortOrder: 4,
                },
                {
                  slug: 'power-mosfet',
                  name: ls({ de: 'Leistungs-MOSFET', en: 'Power MOSFET' }),
                  description: ls({
                    de: 'MOSFET für hohe Ströme und Spannungen',
                    en: 'MOSFET for high currents and voltages',
                  }),
                  level: 4,
                  sortOrder: 5,
                },
                {
                  slug: 'mesfet',
                  name: ls({ de: 'MESFET', en: 'MESFET' }),
                  description: ls({
                    de: 'Metal-Semiconductor FET - für HF-Anwendungen (GaAs)',
                    en: 'Metal-Semiconductor FET - for RF applications (GaAs)',
                  }),
                  level: 4,
                  sortOrder: 6,
                },
                {
                  slug: 'hemt-phemt',
                  name: ls({ de: 'HEMT/pHEMT', en: 'HEMT/pHEMT' }),
                  description: ls({
                    de: 'High Electron Mobility Transistor - Höchstfrequenz-Anwendungen',
                    en: 'High Electron Mobility Transistor - highest frequency applications',
                  }),
                  level: 4,
                  sortOrder: 7,
                },
              ],
            },
            {
              slug: 'igbt',
              name: ls({ de: 'IGBT', en: 'IGBT' }),
              description: ls({
                de: 'Insulated Gate Bipolar Transistor - Leistungsschalter (Hybrid BJT/MOSFET)',
                en: 'Insulated Gate Bipolar Transistor - power switch (BJT/MOSFET hybrid)',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'unijunction-transistors',
              name: ls({ de: 'Unijunktion-Transistoren', en: 'Unijunction Transistors' }),
              description: ls({
                de: 'Triggerbauelemente für Thyristoren und Oszillatoren',
                en: 'Trigger devices for thyristors and oscillators',
              }),
              level: 3,
              sortOrder: 4,
              children: [
                {
                  slug: 'ujt',
                  name: ls({ de: 'UJT', en: 'UJT' }),
                  description: ls({
                    de: 'Unijunction Transistor - klassischer Typ',
                    en: 'Unijunction Transistor - classic type',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'put',
                  name: ls({ de: 'PUT', en: 'PUT' }),
                  description: ls({
                    de: 'Programmable Unijunction Transistor - einstellbare Trigger-Spannung',
                    en: 'Programmable Unijunction Transistor - adjustable trigger voltage',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'rf-transistors',
              name: ls({ de: 'HF-Transistoren', en: 'RF Transistors' }),
              description: ls({
                de: 'Spezialisierte Transistoren für Hochfrequenz-Anwendungen',
                en: 'Specialized transistors for radio frequency applications',
              }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'germanium-transistors',
              name: ls({ de: 'Germanium-Transistoren', en: 'Germanium Transistors' }),
              description: ls({
                de: 'Historische Transistoren (1947-1970er, vor Silizium-Ära)',
                en: 'Historical transistors (1947-1970s, pre-silicon era)',
              }),
              level: 3,
              sortOrder: 6,
            },
          ],
        },

        // ============================================
        // FAMILY: THYRISTORS
        // ============================================
        {
          slug: 'thyristors',
          name: ls({
            de: 'Thyristoren',
            en: 'Thyristors',
            fr: 'Thyristors',
            es: 'Tiristores',
            it: 'Tiristore',
          }),
          description: ls({
            de: 'Schaltbare Halbleiterbauelemente für Leistungselektronik (Vierschichtdioden)',
            en: 'Switchable semiconductor devices for power electronics (four-layer diodes)',
          }),
          level: 2,
          sortOrder: 3,
          children: [
            {
              slug: 'scr',
              name: ls({ de: 'SCR', en: 'SCR' }),
              description: ls({
                de: 'Silicon Controlled Rectifier - Klassischer Thyristor',
                en: 'Silicon Controlled Rectifier - classic thyristor',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'triac',
              name: ls({ de: 'TRIAC', en: 'TRIAC' }),
              description: ls({
                de: 'Triode for Alternating Current - Wechselstromsteuerung',
                en: 'Triode for Alternating Current - AC control',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'diac',
              name: ls({ de: 'DIAC', en: 'DIAC' }),
              description: ls({
                de: 'Diode for Alternating Current - Trigger für TRIACs',
                en: 'Diode for Alternating Current - TRIAC trigger',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'gto',
              name: ls({ de: 'GTO', en: 'GTO' }),
              description: ls({
                de: 'Gate Turn-Off Thyristor - Abschaltbarer Thyristor',
                en: 'Gate Turn-Off Thyristor - turn-off capable thyristor',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'igct',
              name: ls({ de: 'IGCT', en: 'IGCT' }),
              description: ls({
                de: 'Integrated Gate-Commutated Thyristor - Hochleistungs-GTO',
                en: 'Integrated Gate-Commutated Thyristor - high-power GTO',
              }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'mct',
              name: ls({ de: 'MCT', en: 'MCT' }),
              description: ls({
                de: 'MOS Controlled Thyristor - MOS-gesteuerter Thyristor',
                en: 'MOS Controlled Thyristor - MOS-controlled thyristor',
              }),
              level: 3,
              sortOrder: 6,
            },
            {
              slug: 'scs',
              name: ls({ de: 'SCS', en: 'SCS' }),
              description: ls({
                de: 'Silicon Controlled Switch - 4-poliger Thyristor',
                en: 'Silicon Controlled Switch - 4-terminal thyristor',
              }),
              level: 3,
              sortOrder: 7,
            },
            {
              slug: 'sidac',
              name: ls({ de: 'SIDAC', en: 'SIDAC' }),
              description: ls({
                de: 'Silicon Diode for Alternating Current - Überspannungsschutz',
                en: 'Silicon Diode for Alternating Current - overvoltage protection',
              }),
              level: 3,
              sortOrder: 8,
            },
          ],
        },

        // ============================================
        // FAMILY: POWER MODULES
        // ============================================
        {
          slug: 'power-modules',
          name: ls({
            de: 'Leistungsmodule',
            en: 'Power Modules',
            fr: 'Modules de puissance',
            es: 'Módulos de potencia',
          }),
          description: ls({
            de: 'Fertige Leistungshalbleiter-Module mit mehreren Bauteilen',
            en: 'Complete power semiconductor modules with multiple components',
          }),
          level: 2,
          sortOrder: 4,
          children: [
            {
              slug: 'igbt-modules',
              name: ls({ de: 'IGBT-Module', en: 'IGBT Modules' }),
              description: ls({
                de: 'Module mit IGBT-Transistoren für Umrichterschaltungen',
                en: 'Modules with IGBT transistors for inverter circuits',
              }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'half-bridge-modules',
                  name: ls({ de: 'Halbbrücken-Module', en: 'Half-Bridge Modules' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'full-bridge-modules',
                  name: ls({ de: 'Vollbrücken-Module', en: 'Full-Bridge Modules' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'six-pack-modules',
                  name: ls({ de: 'Six-Pack-Module', en: 'Six-Pack Modules' }),
                  description: ls({
                    de: '3-Phasen-Brücke (6 IGBTs)',
                    en: '3-phase bridge (6 IGBTs)',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'mosfet-modules',
              name: ls({ de: 'MOSFET-Module', en: 'MOSFET Modules' }),
              description: ls({
                de: 'Module mit Power-MOSFETs',
                en: 'Modules with power MOSFETs',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'thyristor-modules',
              name: ls({ de: 'Thyristor-Module', en: 'Thyristor Modules' }),
              description: ls({
                de: 'Module mit Thyristoren für Hochleistungsanwendungen',
                en: 'Modules with thyristors for high-power applications',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'ipm',
              name: ls({ de: 'IPM', en: 'IPM' }),
              description: ls({
                de: 'Intelligent Power Module - mit integrierter Ansteuerung und Schutz',
                en: 'Intelligent Power Module - with integrated driver and protection',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'gan-power-modules',
              name: ls({ de: 'GaN-Leistungsmodule', en: 'GaN Power Modules' }),
              description: ls({
                de: 'Galliumnitrid-Module für höchste Schaltfrequenzen',
                en: 'Gallium nitride modules for highest switching frequencies',
              }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'sic-power-modules',
              name: ls({ de: 'SiC-Leistungsmodule', en: 'SiC Power Modules' }),
              description: ls({
                de: 'Siliziumkarbid-Module für hohe Temperaturen und Spannungen',
                en: 'Silicon carbide modules for high temperatures and voltages',
              }),
              level: 3,
              sortOrder: 6,
            },
          ],
        },

        // ============================================
        // FAMILY: VOLTAGE REFERENCES
        // ============================================
        {
          slug: 'voltage-references',
          name: ls({
            de: 'Spannungsreferenzen',
            en: 'Voltage References',
            fr: 'Références de tension',
          }),
          description: ls({
            de: 'Präzise Spannungsquellen für Messtechnik und ADC/DAC',
            en: 'Precise voltage sources for measurement and ADC/DAC',
          }),
          level: 2,
          sortOrder: 5,
          children: [
            {
              slug: 'bandgap-references',
              name: ls({ de: 'Bandgap-Referenzen', en: 'Bandgap References' }),
              description: ls({
                de: 'Temperaturstabile Referenzen (ca. 1.2V typisch)',
                en: 'Temperature-stable references (approx. 1.2V typical)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'buried-zener-references',
              name: ls({ de: 'Buried-Zener-Referenzen', en: 'Buried Zener References' }),
              description: ls({
                de: 'Höchstpräzise Zener-basierte Referenzen',
                en: 'Highest precision Zener-based references',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'shunt-references',
              name: ls({ de: 'Shunt-Referenzen', en: 'Shunt References' }),
              description: ls({
                de: 'Parallelgeschaltete Referenzen (z.B. TL431)',
                en: 'Shunt-connected references (e.g. TL431)',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'precision-references',
              name: ls({ de: 'Präzisions-Referenzen', en: 'Precision References' }),
              description: ls({
                de: 'Hochgenaue Referenzen für ADC/DAC (<5ppm)',
                en: 'High-accuracy references for ADC/DAC (<5ppm)',
              }),
              level: 3,
              sortOrder: 4,
            },
          ],
        },

        // ============================================
        // FAMILY: LINEAR VOLTAGE REGULATORS
        // ============================================
        {
          slug: 'linear-voltage-regulators',
          name: ls({
            de: 'Lineare Spannungsregler',
            en: 'Linear Voltage Regulators',
            fr: 'Régulateurs de tension linéaires',
          }),
          description: ls({
            de: 'Lineare Spannungsregler für einfache Spannungsversorgungen',
            en: 'Linear voltage regulators for simple power supplies',
          }),
          level: 2,
          sortOrder: 6,
          children: [
            {
              slug: 'fixed-voltage-regulators',
              name: ls({ de: 'Festspannungsregler', en: 'Fixed Voltage Regulators' }),
              description: ls({
                de: 'Regler mit fester Ausgangsspannung',
                en: 'Regulators with fixed output voltage',
              }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'positive-fixed-regulators',
                  name: ls({ de: 'Positive Festspannungsregler', en: 'Positive Fixed Regulators' }),
                  description: ls({
                    de: 'z.B. 78xx-Serie (+5V, +12V, etc.)',
                    en: 'e.g. 78xx series (+5V, +12V, etc.)',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'negative-fixed-regulators',
                  name: ls({ de: 'Negative Festspannungsregler', en: 'Negative Fixed Regulators' }),
                  description: ls({
                    de: 'z.B. 79xx-Serie (-5V, -12V, etc.)',
                    en: 'e.g. 79xx series (-5V, -12V, etc.)',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'adjustable-regulators',
              name: ls({ de: 'Einstellbare Regler', en: 'Adjustable Regulators' }),
              description: ls({
                de: 'Regler mit einstellbarer Ausgangsspannung',
                en: 'Regulators with adjustable output voltage',
              }),
              level: 3,
              sortOrder: 2,
              children: [
                {
                  slug: 'positive-adjustable-regulators',
                  name: ls({ de: 'Positive Einstellbare Regler', en: 'Positive Adjustable Regulators' }),
                  description: ls({
                    de: 'z.B. LM317',
                    en: 'e.g. LM317',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'negative-adjustable-regulators',
                  name: ls({ de: 'Negative Einstellbare Regler', en: 'Negative Adjustable Regulators' }),
                  description: ls({
                    de: 'z.B. LM337',
                    en: 'e.g. LM337',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'ldo-regulators',
              name: ls({ de: 'LDO-Regler', en: 'LDO Regulators' }),
              description: ls({
                de: 'Low Dropout Regulators - minimale Dropout-Spannung',
                en: 'Low Dropout Regulators - minimal dropout voltage',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'shunt-regulators',
              name: ls({ de: 'Shunt-Regler', en: 'Shunt Regulators' }),
              description: ls({
                de: 'Parallelregler (z.B. TL431, 78Lxx)',
                en: 'Shunt regulators (e.g. TL431, 78Lxx)',
              }),
              level: 3,
              sortOrder: 4,
            },
          ],
        },
      ],
    },
  ];

  // Kategorien erstellen
  const categoryMap = await createCategoryTree(prisma, categoryTree);

  // ============================================
  // ATTRIBUTE DEFINITIONEN
  // ============================================

  console.log('  🏷️  Creating attribute definitions...');

  // Gemeinsame Dioden-Attribute
  const diodeAttributes: AttributeDef[] = [
    {
      name: 'forward_voltage',
      displayName: ls({ de: 'Flussspannung', en: 'Forward Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. 1N4148 hat typisch 0.7V)
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 1,
    },
    {
      name: 'reverse_voltage',
      displayName: ls({ de: 'Sperrspannung', en: 'Reverse Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. 1N4007 hat 1000V)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 2,
    },
    {
      name: 'forward_current',
      displayName: ls({ de: 'Durchlassstrom', en: 'Forward Current' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. 1N4007 hat 1A)
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 3,
    },
    {
      name: 'reverse_recovery_time',
      displayName: ls({ de: 'Sperrverzögerungszeit', en: 'Reverse Recovery Time' }),
      unit: 's',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (Fast-Recovery vs. Standard)
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'p', 'n', 'µ'],
      sortOrder: 4,
    },
    {
      name: 'power_dissipation',
      displayName: ls({ de: 'Verlustleistung', en: 'Power Dissipation' }),
      unit: 'W',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 5,
    },
    {
      name: 'operating_temperature',
      displayName: ls({ de: 'Betriebstemperatur', en: 'Operating Temperature' }),
      unit: '°C',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-'],
      sortOrder: 6,
    },
  ];

  // Zener-Dioden spezifisch
  const zenerAttributes: AttributeDef[] = [
    ...diodeAttributes,
    {
      name: 'zener_voltage',
      displayName: ls({ de: 'Zener-Spannung', en: 'Zener Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // ✅ KORREKT - Definiert das Normbauteil (z.B. 1N4733 = 5.1V)
      isFilterable: true,
      isRequired: true,
      isLabel: true,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 7,
    },
    {
      name: 'zener_tolerance',
      displayName: ls({ de: 'Toleranz', en: 'Tolerance' }),
      unit: '%',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.BOTH, // Typisch 5%, aber Hersteller können enger garantieren (1%, 2%)
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-'],
      sortOrder: 8,
    },
  ];

  // Bipolar-Transistor Attribute
  const bipolarTransistorAttributes: AttributeDef[] = [
    {
      name: 'polarity',
      displayName: ls({ de: 'Polarität', en: 'Polarity' }),
      dataType: AttributeDataType.STRING, // TODO: Auf SELECT ändern nach Migration
      scope: AttributeScope.COMPONENT, // ✅ KORREKT - Definiert den Transistortyp
      isFilterable: true,
      isRequired: true,
      isLabel: true,
      allowedValues: ['NPN', 'PNP'],
      sortOrder: 1,
    },
    {
      name: 'hfe',
      displayName: ls({ de: 'Stromverstärkung (hFE)', en: 'Current Gain (hFE)' }),
      dataType: AttributeDataType.RANGE, // Min-Max Bereich (z.B. BC547: 110-800)
      scope: AttributeScope.COMPONENT, // Bei Normbauteilen definiert, kann aber Gruppen haben (A/B/C)
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-'],
      sortOrder: 2,
    },
    {
      name: 'collector_current',
      displayName: ls({ de: 'Kollektorstrom (max)', en: 'Collector Current (max)' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. BC547 = 100mA)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 3,
    },
    {
      name: 'collector_emitter_voltage',
      displayName: ls({ de: 'Kollektor-Emitter-Spannung (max)', en: 'Collector-Emitter Voltage (max)' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. BC547 = 45V)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 4,
    },
    {
      name: 'transition_frequency',
      displayName: ls({ de: 'Transitfrequenz', en: 'Transition Frequency' }),
      unit: 'Hz',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'k', 'M', 'G'],
      sortOrder: 5,
    },
    {
      name: 'power_dissipation',
      displayName: ls({ de: 'Verlustleistung (max)', en: 'Power Dissipation (max)' }),
      unit: 'W',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 6,
    },
    {
      name: 'operating_temperature',
      displayName: ls({ de: 'Betriebstemperatur', en: 'Operating Temperature' }),
      unit: '°C',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-'],
      sortOrder: 7,
    },
  ];

  // FET/MOSFET Attribute
  const fetAttributes: AttributeDef[] = [
    {
      name: 'channel_type',
      displayName: ls({ de: 'Kanaltyp', en: 'Channel Type' }),
      dataType: AttributeDataType.STRING, // TODO: Auf SELECT ändern nach Migration
      scope: AttributeScope.COMPONENT, // ✅ KORREKT - Definiert den FET-Typ
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedValues: ['N-Channel', 'P-Channel'],
      sortOrder: 1,
    },
    {
      name: 'drain_source_voltage',
      displayName: ls({ de: 'Drain-Source-Spannung (max)', en: 'Drain-Source Voltage (max)' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. IRF540 = 100V)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 2,
    },
    {
      name: 'drain_current',
      displayName: ls({ de: 'Drain-Strom (max)', en: 'Drain Current (max)' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. IRF540 = 28A)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 3,
    },
    {
      name: 'rds_on',
      displayName: ls({ de: 'RDS(on) (max)', en: 'RDS(on) (max)' }),
      unit: 'Ω',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.BOTH, // Typisch auf Component, aber Hersteller können bessere Werte garantieren
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 4,
    },
    {
      name: 'gate_threshold',
      displayName: ls({ de: 'Gate-Schwellspannung', en: 'Gate Threshold Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.RANGE, // Min-Max Bereich (z.B. 2-4V)
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 5,
    },
    {
      name: 'gate_charge',
      displayName: ls({ de: 'Gate-Ladung (typisch)', en: 'Gate Charge (typical)' }),
      unit: 'C',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.BOTH, // Typisch auf Component, garantiert auf Part
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'p', 'n', 'µ'],
      sortOrder: 6,
    },
    {
      name: 'power_dissipation',
      displayName: ls({ de: 'Verlustleistung (max)', en: 'Power Dissipation (max)' }),
      unit: 'W',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 7,
    },
    {
      name: 'operating_temperature',
      displayName: ls({ de: 'Betriebstemperatur', en: 'Operating Temperature' }),
      unit: '°C',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-'],
      sortOrder: 8,
    },
  ];

  // Thyristor Attribute
  const thyristorAttributes: AttributeDef[] = [
    {
      name: 'forward_voltage',
      displayName: ls({ de: 'Flussspannung (typisch)', en: 'Forward Voltage (typical)' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 1,
    },
    {
      name: 'on_state_current',
      displayName: ls({ de: 'Durchlassstrom (max)', en: 'On-State Current (max)' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. BT151 = 7.5A)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 2,
    },
    {
      name: 'gate_trigger_current',
      displayName: ls({ de: 'Gate-Triggerstrom (max)', en: 'Gate Trigger Current (max)' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'µ', 'm'],
      sortOrder: 3,
    },
    {
      name: 'gate_trigger_voltage',
      displayName: ls({ de: 'Gate-Triggerspannung (max)', en: 'Gate Trigger Voltage (max)' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 4,
    },
    {
      name: 'reverse_voltage',
      displayName: ls({ de: 'Sperrspannung (max)', en: 'Reverse Voltage (max)' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert das Normbauteil (z.B. BT151 = 800V)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 5,
    },
    {
      name: 'operating_temperature',
      displayName: ls({ de: 'Betriebstemperatur', en: 'Operating Temperature' }),
      unit: '°C',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-'],
      sortOrder: 6,
    },
  ];

  // Spannungsregler Attribute
  const voltageRegulatorAttributes: AttributeDef[] = [
    {
      name: 'output_voltage',
      displayName: ls({ de: 'Ausgangsspannung', en: 'Output Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // ✅ KORREKT - Definiert den Regler (z.B. 7805 = 5V)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 1,
    },
    {
      name: 'input_voltage',
      displayName: ls({ de: 'Eingangsspannung', en: 'Input Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.RANGE, // Min-Max Bereich (z.B. 7-35V)
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 2,
    },
    {
      name: 'output_current',
      displayName: ls({ de: 'Ausgangsstrom (max)', en: 'Output Current (max)' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT, // Definiert den Regler (z.B. 7805 = 1A)
      isFilterable: true,
      isRequired: false,
      isLabel: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 3,
    },
    {
      name: 'dropout_voltage',
      displayName: ls({ de: 'Dropout-Spannung (typisch)', en: 'Dropout Voltage (typical)' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.BOTH, // Typisch auf Component, garantiert auf Part
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 4,
    },
    {
      name: 'quiescent_current',
      displayName: ls({ de: 'Ruhestrom (typisch)', en: 'Quiescent Current (typical)' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.BOTH, // Typisch auf Component, garantiert auf Part
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-', 'µ', 'm'],
      sortOrder: 5,
    },
    {
      name: 'operating_temperature',
      displayName: ls({ de: 'Betriebstemperatur', en: 'Operating Temperature' }),
      unit: '°C',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: ['-'],
      sortOrder: 6,
    },
  ];

  // ============================================
  // ATTRIBUTE ZUWEISEN
  // ============================================

  // Dioden (alle Typen außer Zener)
  for (const slug of [
    'rectifier-diodes',
    'standard-recovery-diodes',
    'fast-recovery-diodes',
    'ultrafast-recovery-diodes',
    'schottky-diodes',
    'tvs-diodes',
    'signal-diodes',
    'switching-diodes',
    'bridge-rectifiers',
    'single-phase-bridge',
    'three-phase-bridge',
    'varactor-diodes',
    'pin-diodes',
    'step-recovery-diodes',
    'gunn-diodes',
    'impatt-diodes',
    'tunnel-diodes',
    'point-contact-diodes',
  ]) {
    const categoryId = categoryMap.get(slug);
    if (categoryId) {
      await createAttributes(prisma, categoryId, diodeAttributes);
    }
  }

  // Zener-Dioden (spezielle Attribute)
  const zenerCategoryId = categoryMap.get('zener-diodes');
  if (zenerCategoryId) {
    await createAttributes(prisma, zenerCategoryId, zenerAttributes);
  }

  // Bipolar-Transistoren
  for (const slug of [
    'bipolar-transistors',
    'npn-transistors',
    'pnp-transistors',
    'darlington-transistors',
    'phototransistors',
    'germanium-transistors',
  ]) {
    const categoryId = categoryMap.get(slug);
    if (categoryId) {
      await createAttributes(prisma, categoryId, bipolarTransistorAttributes);
    }
  }

  // FET/MOSFET
  for (const slug of [
    'fet-transistors',
    'jfet',
    'mosfet',
    'n-channel-mosfet',
    'p-channel-mosfet',
    'power-mosfet',
    'mesfet',
    'hemt-phemt',
  ]) {
    const categoryId = categoryMap.get(slug);
    if (categoryId) {
      await createAttributes(prisma, categoryId, fetAttributes);
    }
  }

  // IGBT (ähnlich wie MOSFET)
  const igbtCategoryId = categoryMap.get('igbt');
  if (igbtCategoryId) {
    await createAttributes(prisma, igbtCategoryId, fetAttributes);
  }

  // Thyristoren
  for (const slug of ['scr', 'triac', 'diac', 'gto', 'igct', 'mct', 'scs', 'sidac']) {
    const categoryId = categoryMap.get(slug);
    if (categoryId) {
      await createAttributes(prisma, categoryId, thyristorAttributes);
    }
  }

  // Spannungsregler
  for (const slug of [
    'fixed-voltage-regulators',
    'positive-fixed-regulators',
    'negative-fixed-regulators',
    'adjustable-regulators',
    'positive-adjustable-regulators',
    'negative-adjustable-regulators',
    'ldo-regulators',
    'shunt-regulators',
  ]) {
    const categoryId = categoryMap.get(slug);
    if (categoryId) {
      await createAttributes(prisma, categoryId, voltageRegulatorAttributes);
    }
  }

  console.log('  ✅ Active Semiconductor Components seeded successfully!');
}
