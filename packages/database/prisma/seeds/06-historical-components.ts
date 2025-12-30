// ElectroVault - Seed für historische und Legacy-Komponenten
// Vakuumröhren, Germanium-Komponenten, elektromechanische Bauteile und frühe Halbleiter

import { PrismaClient } from '@prisma/client';
import {
  ls,
  createCategoryTree,
  createAttributes,
  type CategoryDef,
  type AttributeDef,
  AttributeScope,
  AttributeDataType,
} from './types';

/**
 * Seed-Funktion für historische Komponenten
 */
export async function seedHistoricalComponents(prisma: PrismaClient): Promise<void> {
  console.log('🕰️  Seeding historical components...');

  // ============================================
  // DOMAIN 1: VACUUM TUBES / ELECTRON TUBES
  // ============================================

  const vacuumTubesDomain: CategoryDef[] = [
    {
      slug: 'vacuum-tubes',
      name: ls({
        en: 'Vacuum Tubes',
        de: 'Vakuumröhren',
        fr: 'Tubes à vide',
        es: 'Tubos de vacío',
        it: 'Tubi a vuoto',
        ru: 'Электронные лампы',
        zh: '真空管',
        ja: '真空管',
      }),
      description: ls({
        en: 'Historical electron tubes used in early electronics (1900s-1970s). Still used in specialized audio and RF applications.',
        de: 'Historische Elektronenröhren aus der Frühzeit der Elektronik (1900er-1970er). Noch heute in spezialisierten Audio- und HF-Anwendungen.',
        fr: 'Tubes électroniques historiques utilisés dans les premiers équipements électroniques. Encore utilisés dans certaines applications audio et RF spécialisées.',
        es: 'Tubos electrónicos históricos utilizados en la electrónica temprana. Todavía se usan en aplicaciones especializadas de audio y RF.',
      }),
      level: 1,
      sortOrder: 10,
      children: [
        // FAMILY: Receiving Tubes
        {
          slug: 'receiving-tubes',
          name: ls({ en: 'Receiving Tubes', de: 'Empfängerröhren', fr: 'Tubes de réception', es: 'Tubos receptores' }),
          description: ls({
            en: 'Tubes designed for radio receivers, audio amplifiers, and low-power applications',
            de: 'Röhren für Radioempfänger, Audioverstärker und Anwendungen mit geringer Leistung',
          }),
          level: 2,
          sortOrder: 1,
          children: [
            // TYPE: Triodes
            {
              slug: 'triodes',
              name: ls({ en: 'Triodes', de: 'Trioden', fr: 'Triodes', es: 'Triodos', it: 'Triodi', ru: 'Триоды' }),
              description: ls({
                en: 'Three-element tubes (cathode, grid, anode). First amplifying vacuum tubes.',
                de: 'Dreielementenröhren (Kathode, Gitter, Anode). Erste verstärkende Vakuumröhren.',
              }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'power-triodes',
                  name: ls({ en: 'Power Triodes', de: 'Leistungstrioden', fr: 'Triodes de puissance' }),
                  description: ls({
                    en: 'High-power triodes for audio output stages (e.g., 2A3, 300B)',
                    de: 'Hochleistungstrioden für Audio-Endstufen (z.B. 2A3, 300B)',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'small-signal-triodes',
                  name: ls({ en: 'Small-Signal Triodes', de: 'Kleinsignaltrioden', fr: 'Triodes à petit signal' }),
                  description: ls({
                    en: 'Low-power triodes for preamplifiers and signal processing (e.g., 12AX7, ECC83)',
                    de: 'Niedrigleistungstrioden für Vorverstärker und Signalverarbeitung (z.B. 12AX7, ECC83)',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            // TYPE: Tetrodes
            {
              slug: 'tetrodes',
              name: ls({ en: 'Tetrodes', de: 'Tetroden', fr: 'Tétrodes', es: 'Tetrodos', ru: 'Тетроды' }),
              description: ls({
                en: 'Four-element tubes with screen grid for increased gain',
                de: 'Vierelementenröhren mit Schirmgitter für höhere Verstärkung',
              }),
              level: 3,
              sortOrder: 2,
              children: [
                {
                  slug: 'beam-tetrodes',
                  name: ls({ en: 'Beam Tetrodes', de: 'Strahltetroden', fr: 'Tétrodes à faisceau' }),
                  description: ls({
                    en: 'Beam-forming electrodes for efficient power amplification (e.g., 6L6, EL34)',
                    de: 'Strahlformende Elektroden für effiziente Leistungsverstärkung (z.B. 6L6, EL34)',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'screen-grid-tetrodes',
                  name: ls({ en: 'Screen-Grid Tetrodes', de: 'Schirmgitter-Tetroden', fr: 'Tétrodes à grille écran' }),
                  description: ls({
                    en: 'Classic tetrodes with screen grid (early RF amplifiers)',
                    de: 'Klassische Tetroden mit Schirmgitter (frühe HF-Verstärker)',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
            // TYPE: Pentodes
            {
              slug: 'pentodes',
              name: ls({ en: 'Pentodes', de: 'Pentoden', fr: 'Pentodes', es: 'Pentodos', ru: 'Пентоды' }),
              description: ls({
                en: 'Five-element tubes with suppressor grid for improved performance',
                de: 'Fünfelementenröhren mit Bremsgitter für verbesserte Leistung',
              }),
              level: 3,
              sortOrder: 3,
              children: [
                {
                  slug: 'power-pentodes',
                  name: ls({ en: 'Power Pentodes', de: 'Leistungspentoden', fr: 'Pentodes de puissance' }),
                  description: ls({
                    en: 'High-power pentodes for audio and RF output stages (e.g., EL84, 6V6)',
                    de: 'Hochleistungspentoden für Audio- und HF-Endstufen (z.B. EL84, 6V6)',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'rf-pentodes',
                  name: ls({ en: 'RF Pentodes', de: 'HF-Pentoden', fr: 'Pentodes RF' }),
                  description: ls({
                    en: 'Pentodes optimized for radio frequency amplification (e.g., EF80)',
                    de: 'Pentoden optimiert für Hochfrequenzverstärkung (z.B. EF80)',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'audio-pentodes',
                  name: ls({ en: 'Audio Pentodes', de: 'Audio-Pentoden', fr: 'Pentodes audio' }),
                  description: ls({
                    en: 'Pentodes optimized for audio applications (e.g., 6AU6, EF86)',
                    de: 'Pentoden optimiert für Audioanwendungen (z.B. 6AU6, EF86)',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            // TYPE: Hexodes, Heptodes, Octodes
            {
              slug: 'hexodes',
              name: ls({ en: 'Hexodes', de: 'Hexoden', fr: 'Hexodes', ru: 'Гексоды' }),
              description: ls({
                en: 'Six-element tubes used as frequency converters in superheterodyne receivers',
                de: 'Sechselementenröhren für Frequenzumsetzer in Superheterodyne-Empfängern',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'heptodes',
              name: ls({ en: 'Heptodes', de: 'Heptoden', fr: 'Heptodes', ru: 'Гептоды' }),
              description: ls({
                en: 'Seven-element tubes for mixing and frequency conversion',
                de: 'Siebenelementenröhren für Mischung und Frequenzumsetzung',
              }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'octodes',
              name: ls({ en: 'Octodes', de: 'Oktoden', fr: 'Octodes', ru: 'Октоды' }),
              description: ls({
                en: 'Eight-element tubes combining oscillator and mixer functions',
                de: 'Achtelementenröhren mit kombinierten Oszillator- und Mischfunktionen',
              }),
              level: 3,
              sortOrder: 6,
            },
            // TYPE: Compactrons & Nuvistors
            {
              slug: 'compactrons',
              name: ls({ en: 'Compactrons', de: 'Compactrons', fr: 'Compactrons' }),
              description: ls({
                en: 'Compact multi-function tubes (1960s GE design). 12-pin base, multiple systems in one envelope.',
                de: 'Kompakte Multifunktionsröhren (1960er GE-Design). 12-poliger Sockel, mehrere Systeme in einem Kolben.',
              }),
              level: 3,
              sortOrder: 7,
            },
            {
              slug: 'nuvistors',
              name: ls({ en: 'Nuvistors', de: 'Nuvistoren', fr: 'Nuvistors' }),
              description: ls({
                en: 'Miniature metal-enclosed triodes (RCA 1959). Excellent high-frequency performance.',
                de: 'Miniatur-Metallröhren (RCA 1959). Hervorragende Hochfrequenzeigenschaften.',
              }),
              level: 3,
              sortOrder: 8,
            },
          ],
        },
        // FAMILY: Rectifier Tubes
        {
          slug: 'rectifier-tubes',
          name: ls({ en: 'Rectifier Tubes', de: 'Gleichrichterröhren', fr: 'Tubes redresseurs', es: 'Tubos rectificadores' }),
          description: ls({
            en: 'Tubes for converting AC to DC in power supplies',
            de: 'Röhren zur Umwandlung von Wechselstrom in Gleichstrom in Netzteilen',
          }),
          level: 2,
          sortOrder: 2,
          children: [
            {
              slug: 'full-wave-rectifiers',
              name: ls({ en: 'Full-Wave Rectifiers', de: 'Vollweg-Gleichrichter', fr: 'Redresseurs double alternance' }),
              description: ls({
                en: 'Dual-diode tubes for full-wave rectification (e.g., 5AR4, GZ34)',
                de: 'Doppeldioden-Röhren für Vollweggleichrichtung (z.B. 5AR4, GZ34)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'half-wave-rectifiers',
              name: ls({ en: 'Half-Wave Rectifiers', de: 'Halbweg-Gleichrichter', fr: 'Redresseurs simple alternance' }),
              description: ls({
                en: 'Single-diode tubes for half-wave rectification',
                de: 'Einzeldioden-Röhren für Halbweggleichrichtung',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'mercury-vapor-rectifiers',
              name: ls({ en: 'Mercury Vapor Rectifiers', de: 'Quecksilberdampf-Gleichrichter', fr: 'Redresseurs à vapeur de mercure' }),
              description: ls({
                en: 'High-current rectifiers with mercury vapor (e.g., 83, 866). HAZARD: Contains mercury!',
                de: 'Hochstrom-Gleichrichter mit Quecksilberdampf (z.B. 83, 866). GEFAHR: Enthält Quecksilber!',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'damper-diodes',
              name: ls({ en: 'Damper Diodes', de: 'Dämpferdioden', fr: 'Diodes amortisseuses' }),
              description: ls({
                en: 'Diodes for damping oscillations in TV deflection circuits (e.g., 6AX4)',
                de: 'Dioden zur Dämpfung von Schwingungen in TV-Ablenkschaltungen (z.B. 6AX4)',
              }),
              level: 3,
              sortOrder: 4,
            },
          ],
        },
        // FAMILY: Transmitting Tubes
        {
          slug: 'transmitting-tubes',
          name: ls({ en: 'Transmitting Tubes', de: 'Senderöhren', fr: 'Tubes émetteurs', es: 'Tubos transmisores' }),
          description: ls({
            en: 'High-power tubes for radio transmitters and industrial RF applications',
            de: 'Hochleistungsröhren für Funksender und industrielle HF-Anwendungen',
          }),
          level: 2,
          sortOrder: 3,
          children: [
            {
              slug: 'rf-power-tubes',
              name: ls({ en: 'RF Power Tubes', de: 'HF-Leistungsröhren', fr: 'Tubes de puissance RF' }),
              description: ls({
                en: 'High-power triodes and tetrodes for RF amplification (kW range)',
                de: 'Hochleistungstrioden und -tetroden für HF-Verstärkung (kW-Bereich)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'modulator-tubes',
              name: ls({ en: 'Modulator Tubes', de: 'Modulatorröhren', fr: 'Tubes modulateurs' }),
              description: ls({
                en: 'Tubes for modulating RF carriers in AM transmitters',
                de: 'Röhren zur Modulation von HF-Trägern in AM-Sendern',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'klystrons',
              name: ls({ en: 'Klystrons', de: 'Klystrons', fr: 'Klystrons', ru: 'Клистроны' }),
              description: ls({
                en: 'Velocity-modulated tubes for microwave amplification (radar, satellite)',
                de: 'Laufzeitröhren für Mikrowellenverstärkung (Radar, Satellit)',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'magnetrons',
              name: ls({ en: 'Magnetrons', de: 'Magnetrons', fr: 'Magnétrons', ru: 'Магнетроны' }),
              description: ls({
                en: 'High-power microwave oscillators (radar, microwave ovens)',
                de: 'Hochleistungs-Mikrowellenoszillatoren (Radar, Mikrowellenherde)',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'traveling-wave-tubes',
              name: ls({ en: 'Traveling Wave Tubes', de: 'Wanderfeldröhren', fr: 'Tubes à ondes progressives' }),
              description: ls({
                en: 'Broadband microwave amplifiers (satellite communications)',
                de: 'Breitband-Mikrowellenverstärker (Satellitenkommunikation)',
              }),
              level: 3,
              sortOrder: 5,
            },
          ],
        },
        // FAMILY: Special Purpose Tubes
        {
          slug: 'special-purpose-tubes',
          name: ls({ en: 'Special Purpose Tubes', de: 'Spezialröhren', fr: 'Tubes à usage spécial', es: 'Tubos de propósito especial' }),
          description: ls({
            en: 'Specialized tubes for control, display, and measurement applications',
            de: 'Spezialröhren für Steuerungs-, Anzeige- und Messanwendungen',
          }),
          level: 2,
          sortOrder: 4,
          children: [
            {
              slug: 'thyratrons',
              name: ls({ en: 'Thyratrons', de: 'Thyratrons', fr: 'Thyratrons', ru: 'Тиратроны' }),
              description: ls({
                en: 'Gas-filled controlled rectifiers for switching high currents',
                de: 'Gasgefüllte gesteuerte Gleichrichter zum Schalten hoher Ströme',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'ignitrons',
              name: ls({ en: 'Ignitrons', de: 'Ignitrons', fr: 'Ignitrons' }),
              description: ls({
                en: 'Mercury-arc rectifiers for very high currents (industrial). HAZARD: Mercury!',
                de: 'Quecksilberdampf-Gleichrichter für sehr hohe Ströme (industriell). GEFAHR: Quecksilber!',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'voltage-regulator-tubes',
              name: ls({ en: 'Voltage Regulator Tubes', de: 'Spannungsstabilisatorröhren', fr: 'Tubes stabilisateurs' }),
              description: ls({
                en: 'Gas-discharge tubes for voltage regulation (OA2, OB2, OC3, OD3 series)',
                de: 'Gasentladungsröhren zur Spannungsstabilisierung (OA2, OB2, OC3, OD3 Serie)',
              }),
              level: 3,
              sortOrder: 3,
              children: [
                {
                  slug: 'oa2-series',
                  name: ls({ en: 'OA2 Series (150V)', de: 'OA2-Serie (150V)', fr: 'Série OA2 (150V)' }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'ob2-series',
                  name: ls({ en: 'OB2 Series (108V)', de: 'OB2-Serie (108V)', fr: 'Série OB2 (108V)' }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'oc3-series',
                  name: ls({ en: 'OC3 Series (105V)', de: 'OC3-Serie (105V)', fr: 'Série OC3 (105V)' }),
                  level: 4,
                  sortOrder: 3,
                },
                {
                  slug: 'od3-series',
                  name: ls({ en: 'OD3 Series (85V)', de: 'OD3-Serie (85V)', fr: 'Série OD3 (85V)' }),
                  level: 4,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'cold-cathode-tubes',
              name: ls({ en: 'Cold Cathode Tubes', de: 'Kaltkathodenröhren', fr: 'Tubes à cathode froide' }),
              description: ls({
                en: 'Gas-discharge tubes without heated cathode (trigger tubes, dekatrons)',
                de: 'Gasentladungsröhren ohne geheizte Kathode (Triggerröhren, Dekatrons)',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'nixie-tubes',
              name: ls({ en: 'Nixie Tubes', de: 'Nixie-Röhren', fr: 'Tubes Nixie', ru: 'Никси-лампы' }),
              description: ls({
                en: 'Cold-cathode numeric display tubes (1950s-1970s). Popular in retro clocks.',
                de: 'Kaltkatoden-Ziffernanzeigenröhren (1950er-1970er). Beliebt in Retro-Uhren.',
              }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'magic-eye-tubes',
              name: ls({ en: 'Magic Eye Tubes', de: 'Magische Augen', fr: 'Tubes œil magique', ru: 'Электронно-лучевые индикаторы' }),
              description: ls({
                en: 'Tuning indicator tubes for radio receivers (e.g., EM80, EM84, 6E5)',
                de: 'Abstimmanzeigeröhren für Radioempfänger (z.B. EM80, EM84, 6E5)',
              }),
              level: 3,
              sortOrder: 6,
            },
            {
              slug: 'crt-tubes',
              name: ls({ en: 'Cathode Ray Tubes (CRT)', de: 'Kathodenstrahlröhren', fr: 'Tubes cathodiques', ru: 'Электронно-лучевые трубки' }),
              description: ls({
                en: 'Electron beam tubes for oscilloscopes, displays, and televisions',
                de: 'Elektronenstrahlröhren für Oszilloskope, Bildschirme und Fernseher',
              }),
              level: 3,
              sortOrder: 7,
              children: [
                {
                  slug: 'oscilloscope-crt',
                  name: ls({ en: 'Oscilloscope CRT', de: 'Oszilloskop-CRT', fr: 'CRT oscilloscope' }),
                  description: ls({
                    en: 'High-bandwidth CRTs for oscilloscopes and spectrum analyzers',
                    de: 'Hochbandbreiten-CRTs für Oszilloskope und Spektrumanalysatoren',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'television-crt',
                  name: ls({ en: 'Television CRT', de: 'Fernseh-CRT', fr: 'CRT télévision' }),
                  description: ls({
                    en: 'Picture tubes for analog television sets',
                    de: 'Bildröhren für analoge Fernsehgeräte',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'radar-crt',
                  name: ls({ en: 'Radar CRT', de: 'Radar-CRT', fr: 'CRT radar' }),
                  description: ls({
                    en: 'Specialized CRTs for radar displays (PPI, A-scope)',
                    de: 'Spezialisierte CRTs für Radaranzeigen (PPI, A-Scope)',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'photomultiplier-tubes',
              name: ls({ en: 'Photomultiplier Tubes', de: 'Photomultiplier', fr: 'Photomultiplicateurs', ru: 'Фотоэлектронные умножители' }),
              description: ls({
                en: 'Extremely sensitive light detectors (scintillation counters, astronomy)',
                de: 'Extrem empfindliche Lichtdetektoren (Szintillationszähler, Astronomie)',
              }),
              level: 3,
              sortOrder: 8,
            },
            {
              slug: 'image-tubes',
              name: ls({ en: 'Image Tubes', de: 'Bildverstärkerröhren', fr: 'Tubes intensificateurs' }),
              description: ls({
                en: 'Image intensifiers and image converters (night vision)',
                de: 'Bildverstärker und Bildwandler (Nachtsicht)',
              }),
              level: 3,
              sortOrder: 9,
            },
            {
              slug: 'x-ray-tubes',
              name: ls({ en: 'X-Ray Tubes', de: 'Röntgenröhren', fr: 'Tubes à rayons X', ru: 'Рентгеновские трубки' }),
              description: ls({
                en: 'Tubes for generating X-rays (medical, industrial NDT). RADIATION HAZARD!',
                de: 'Röhren zur Erzeugung von Röntgenstrahlung (medizinisch, industrielle ZfP). STRAHLUNGSGEFAHR!',
              }),
              level: 3,
              sortOrder: 10,
            },
            {
              slug: 'geiger-mueller-tubes',
              name: ls({ en: 'Geiger-Müller Tubes', de: 'Geiger-Müller-Zählrohre', fr: 'Tubes Geiger-Müller', ru: 'Счётчики Гейгера-Мюллера' }),
              description: ls({
                en: 'Gas-filled radiation detectors for Geiger counters',
                de: 'Gasgefüllte Strahlungsdetektoren für Geigerzähler',
              }),
              level: 3,
              sortOrder: 11,
            },
          ],
        },
        // FAMILY: Tube Sockets & Accessories
        {
          slug: 'tube-sockets-accessories',
          name: ls({ en: 'Tube Sockets & Accessories', de: 'Röhrensockel & Zubehör', fr: 'Supports de tubes & accessoires' }),
          description: ls({
            en: 'Sockets, shields, and mounting hardware for vacuum tubes',
            de: 'Sockel, Abschirmungen und Montagematerial für Vakuumröhren',
          }),
          level: 2,
          sortOrder: 5,
          children: [
            {
              slug: 'octal-sockets',
              name: ls({ en: 'Octal Sockets', de: 'Oktalsockel', fr: 'Supports octal' }),
              description: ls({
                en: '8-pin sockets (most common for receiving tubes)',
                de: '8-polige Sockel (häufigste für Empfängerröhren)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'noval-sockets',
              name: ls({ en: 'Noval Sockets', de: 'Novalsockel', fr: 'Supports noval' }),
              description: ls({
                en: '9-pin miniature sockets (B9A)',
                de: '9-polige Miniatursockel (B9A)',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'rimlock-sockets',
              name: ls({ en: 'Rimlock Sockets', de: 'Rimlocksockel', fr: 'Supports rimlock' }),
              description: ls({
                en: 'European 8-pin with side locking (B8B)',
                de: 'Europäische 8-polige mit seitlicher Verriegelung (B8B)',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'loctal-sockets',
              name: ls({ en: 'Loctal Sockets', de: 'Loctalsockel', fr: 'Supports loctal' }),
              description: ls({
                en: '8-pin with center locking pin',
                de: '8-polige mit mittiger Verriegelung',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'magnoval-sockets',
              name: ls({ en: 'Magnoval Sockets', de: 'Magnovalsockel', fr: 'Supports magnoval' }),
              description: ls({
                en: '9-pin large diameter sockets (B9D)',
                de: '9-polige Sockel mit großem Durchmesser (B9D)',
              }),
              level: 3,
              sortOrder: 5,
            },
            {
              slug: 'compactron-sockets',
              name: ls({ en: 'Compactron Sockets', de: 'Compactron-Sockel', fr: 'Supports compactron' }),
              description: ls({
                en: '12-pin sockets for compactron tubes',
                de: '12-polige Sockel für Compactron-Röhren',
              }),
              level: 3,
              sortOrder: 6,
            },
            {
              slug: 'tube-shields',
              name: ls({ en: 'Tube Shields', de: 'Röhrenabschirmungen', fr: 'Blindages de tubes' }),
              description: ls({
                en: 'Metal shields to reduce electromagnetic interference',
                de: 'Metallabschirmungen zur Reduzierung elektromagnetischer Störungen',
              }),
              level: 3,
              sortOrder: 7,
            },
          ],
        },
      ],
    },
  ];

  // ============================================
  // DOMAIN 2: GERMANIUM COMPONENTS
  // ============================================

  const germaniumDomain: CategoryDef[] = [
    {
      slug: 'germanium-components',
      name: ls({
        en: 'Germanium Components',
        de: 'Germanium-Bauteile',
        fr: 'Composants au germanium',
        es: 'Componentes de germanio',
        ru: 'Германиевые компоненты',
      }),
      description: ls({
        en: 'Early semiconductor components using germanium (1940s-1970s). Lower operating voltage but temperature-sensitive. Still valued in vintage audio and fuzz pedals.',
        de: 'Frühe Halbleiterbauteile aus Germanium (1940er-1970er). Niedrigere Betriebsspannung aber temperaturempfindlich. Noch heute geschätzt in Vintage-Audio und Fuzz-Pedalen.',
        fr: 'Premiers composants semi-conducteurs au germanium. Sensibles à la température mais appréciés pour leur son vintage.',
      }),
      level: 1,
      sortOrder: 11,
      children: [
        {
          slug: 'germanium-transistors',
          name: ls({ en: 'Germanium Transistors', de: 'Germanium-Transistoren', fr: 'Transistors au germanium', ru: 'Германиевые транзисторы' }),
          description: ls({
            en: 'First generation transistors (1947-1970s). Lower noise, warm sound.',
            de: 'Erste Generation Transistoren (1947-1970er). Geringeres Rauschen, warmer Klang.',
          }),
          level: 2,
          sortOrder: 1,
          children: [
            {
              slug: 'pnp-germanium',
              name: ls({ en: 'PNP Germanium Transistors', de: 'PNP Germanium-Transistoren', fr: 'Transistors PNP germanium' }),
              description: ls({
                en: 'Most common germanium transistors (positive ground)',
                de: 'Häufigste Germanium-Transistoren (positive Masse)',
              }),
              level: 3,
              sortOrder: 1,
              children: [
                {
                  slug: 'audio-germanium',
                  name: ls({ en: 'Audio Germanium Transistors', de: 'Audio Germanium-Transistoren', fr: 'Transistors germanium audio' }),
                  description: ls({
                    en: 'Low-noise germanium for audio amplification (AC128, OC71)',
                    de: 'Rauscharme Germanium-Transistoren für Audioverstärkung (AC128, OC71)',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'rf-germanium',
                  name: ls({ en: 'RF Germanium Transistors', de: 'HF Germanium-Transistoren', fr: 'Transistors germanium RF' }),
                  description: ls({
                    en: 'High-frequency germanium transistors (AF117)',
                    de: 'Hochfrequenz Germanium-Transistoren (AF117)',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
                {
                  slug: 'power-germanium',
                  name: ls({ en: 'Power Germanium Transistors', de: 'Leistungs-Germanium-Transistoren', fr: 'Transistors germanium de puissance' }),
                  description: ls({
                    en: 'Higher current germanium transistors (AD149, OC72)',
                    de: 'Höherstrom Germanium-Transistoren (AD149, OC72)',
                  }),
                  level: 4,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'npn-germanium',
              name: ls({ en: 'NPN Germanium Transistors', de: 'NPN Germanium-Transistoren', fr: 'Transistors NPN germanium' }),
              description: ls({
                en: 'Less common NPN germanium transistors (negative ground)',
                de: 'Weniger häufige NPN Germanium-Transistoren (negative Masse)',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'germanium-point-contact',
              name: ls({ en: 'Point-Contact Transistors', de: 'Spitzentransistoren', fr: 'Transistors à pointe' }),
              description: ls({
                en: 'First transistor type (1947). Metal whiskers on germanium crystal.',
                de: 'Erste Transistorart (1947). Metallspitzen auf Germaniumkristall.',
              }),
              level: 3,
              sortOrder: 3,
            },
          ],
        },
        {
          slug: 'germanium-diodes',
          name: ls({ en: 'Germanium Diodes', de: 'Germanium-Dioden', fr: 'Diodes au germanium', ru: 'Германиевые диоды' }),
          description: ls({
            en: 'Low forward voltage drop (0.3V) diodes for detection and rectification',
            de: 'Dioden mit niedriger Durchlassspannung (0,3V) für Demodulation und Gleichrichtung',
          }),
          level: 2,
          sortOrder: 2,
          children: [
            {
              slug: 'germanium-point-contact-diodes',
              name: ls({ en: 'Point-Contact Diodes', de: 'Spitzendioden', fr: 'Diodes à pointe' }),
              description: ls({
                en: 'Crystal detector diodes for AM radio (1N34A, OA90)',
                de: 'Kristalldetektordioden für MW-Radio (1N34A, OA90)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'germanium-signal-diodes',
              name: ls({ en: 'Germanium Signal Diodes', de: 'Germanium-Signaldioden', fr: 'Diodes signal germanium' }),
              description: ls({
                en: 'Small-signal germanium diodes (AA119, OA95)',
                de: 'Kleinsignal-Germanium-Dioden (AA119, OA95)',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'germanium-power-diodes',
              name: ls({ en: 'Germanium Power Diodes', de: 'Germanium-Leistungsdioden', fr: 'Diodes de puissance germanium' }),
              description: ls({
                en: 'Higher current germanium rectifiers',
                de: 'Höherstrom Germanium-Gleichrichter',
              }),
              level: 3,
              sortOrder: 3,
            },
          ],
        },
      ],
    },
  ];

  // ============================================
  // DOMAIN 3: MECHANICAL COMPONENTS (HISTORICAL)
  // ============================================

  const mechanicalDomain: CategoryDef[] = [
    {
      slug: 'mechanical-historical',
      name: ls({
        en: 'Mechanical Components (Historical)',
        de: 'Mechanische Bauteile (Historisch)',
        fr: 'Composants mécaniques (historiques)',
        es: 'Componentes mecánicos (históricos)',
      }),
      description: ls({
        en: 'Electromechanical computing and switching devices from the pre-electronic era',
        de: 'Elektromechanische Rechen- und Schaltgeräte aus der vor-elektronischen Ära',
      }),
      level: 1,
      sortOrder: 12,
      children: [
        {
          slug: 'mechanical-calculators',
          name: ls({ en: 'Mechanical Calculators', de: 'Mechanische Rechengeräte', fr: 'Calculateurs mécaniques' }),
          description: ls({
            en: 'Electromechanical switching and routing devices',
            de: 'Elektromechanische Schalt- und Vermittlungsgeräte',
          }),
          level: 2,
          sortOrder: 1,
          children: [
            {
              slug: 'stepping-relays',
              name: ls({ en: 'Stepping Relays', de: 'Drehwähler', fr: 'Sélecteurs rotatifs', ru: 'Шаговые искатели' }),
              description: ls({
                en: 'Rotary switches for telephone exchanges (pre-digital era)',
                de: 'Drehschalter für Telefonvermittlungen (prä-digitale Ära)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'uniselectors',
              name: ls({ en: 'Uniselectors', de: 'Einfachwähler', fr: 'Unisélecteurs' }),
              description: ls({
                en: 'Single-motion rotary selectors for telephone switching',
                de: 'Einbewegliche Drehwähler für Telefonvermittlung',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'telephone-exchanges',
              name: ls({ en: 'Telephone Exchange Components', de: 'Telefonvermittlungs-Komponenten', fr: 'Composants de centraux téléphoniques' }),
              description: ls({
                en: 'Crossbar switches, line finders, and other exchange components',
                de: 'Kreuzschienen-Schalter, Leitungssucher und andere Vermittlungskomponenten',
              }),
              level: 3,
              sortOrder: 3,
            },
          ],
        },
        {
          slug: 'electromechanical-logic',
          name: ls({ en: 'Electromechanical Logic', de: 'Elektromechanische Logik', fr: 'Logique électromécanique' }),
          description: ls({
            en: 'Pre-electronic computing components',
            de: 'Prä-elektronische Rechenkomponenten',
          }),
          level: 2,
          sortOrder: 2,
          children: [
            {
              slug: 'relay-logic-modules',
              name: ls({ en: 'Relay Logic Modules', de: 'Relais-Logikmodule', fr: 'Modules logiques à relais' }),
              description: ls({
                en: 'Logic gates implemented with relays (early computers)',
                de: 'Logikgatter implementiert mit Relais (frühe Computer)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'stepping-switches',
              name: ls({ en: 'Stepping Switches', de: 'Schrittschalter', fr: 'Commutateurs pas à pas' }),
              description: ls({
                en: 'Electromechanical sequential switches',
                de: 'Elektromechanische Sequenzschalter',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'drum-memory',
              name: ls({ en: 'Drum Memory', de: 'Trommelspeicher', fr: 'Mémoire à tambour' }),
              description: ls({
                en: 'Rotating magnetic drum storage (1950s computers)',
                de: 'Rotierender magnetischer Trommelspeicher (1950er Computer)',
              }),
              level: 3,
              sortOrder: 3,
            },
            {
              slug: 'magnetic-core-memory',
              name: ls({ en: 'Magnetic Core Memory', de: 'Kernspeicher', fr: 'Mémoire à tores', ru: 'Ферритовая память' }),
              description: ls({
                en: 'Ferrite core RAM (1950s-1970s mainframes)',
                de: 'Ferritkern-RAM (1950er-1970er Großrechner)',
              }),
              level: 3,
              sortOrder: 4,
            },
            {
              slug: 'delay-line-memory',
              name: ls({ en: 'Delay Line Memory', de: 'Laufzeitspeicher', fr: 'Mémoire à ligne à retard' }),
              description: ls({
                en: 'Acoustic or electromagnetic delay lines for data storage',
                de: 'Akustische oder elektromagnetische Verzögerungsleitungen für Datenspeicherung',
              }),
              level: 3,
              sortOrder: 5,
              children: [
                {
                  slug: 'mercury-delay-lines',
                  name: ls({ en: 'Mercury Delay Lines', de: 'Quecksilber-Verzögerungsleitungen', fr: 'Lignes à retard au mercure' }),
                  description: ls({
                    en: 'Mercury-filled tubes for acoustic delay (UNIVAC I). HAZARD: Mercury!',
                    de: 'Quecksilbergefüllte Röhren für akustische Verzögerung (UNIVAC I). GEFAHR: Quecksilber!',
                  }),
                  level: 4,
                  sortOrder: 1,
                },
                {
                  slug: 'acoustic-delay-lines',
                  name: ls({ en: 'Acoustic Delay Lines', de: 'Akustische Verzögerungsleitungen', fr: 'Lignes à retard acoustiques' }),
                  description: ls({
                    en: 'Non-mercury acoustic delay lines (wire, quartz)',
                    de: 'Quecksilberfreie akustische Verzögerungsleitungen (Draht, Quarz)',
                  }),
                  level: 4,
                  sortOrder: 2,
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  // ============================================
  // DOMAIN 4: EARLY SEMICONDUCTORS
  // ============================================

  const earlySemiconductorsDomain: CategoryDef[] = [
    {
      slug: 'early-semiconductors',
      name: ls({
        en: 'Early Semiconductors',
        de: 'Frühe Halbleiter',
        fr: 'Premiers semi-conducteurs',
        es: 'Semiconductores tempranos',
      }),
      description: ls({
        en: 'Pre-silicon semiconductor devices (selenium, copper oxide) and early silicon technologies',
        de: 'Prä-Silizium-Halbleiterbauelemente (Selen, Kupferoxid) und frühe Silizium-Technologien',
      }),
      level: 1,
      sortOrder: 13,
      children: [
        {
          slug: 'selenium-devices',
          name: ls({ en: 'Selenium Devices', de: 'Selen-Bauteile', fr: 'Dispositifs au sélénium' }),
          description: ls({
            en: 'Selenium-based rectifiers and sensors (1930s-1970s)',
            de: 'Selenbasierte Gleichrichter und Sensoren (1930er-1970er)',
          }),
          level: 2,
          sortOrder: 1,
          children: [
            {
              slug: 'selenium-rectifiers',
              name: ls({ en: 'Selenium Rectifiers', de: 'Selen-Gleichrichter', fr: 'Redresseurs au sélénium' }),
              description: ls({
                en: 'Stack-type selenium rectifiers for power supplies (pre-silicon diode era)',
                de: 'Stapel-Selen-Gleichrichter für Netzteile (prä-Siliziumdioden-Ära)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'selenium-photocells',
              name: ls({ en: 'Selenium Photocells', de: 'Selen-Photozellen', fr: 'Cellules photoélectriques au sélénium' }),
              description: ls({
                en: 'Light-sensitive selenium cells for exposure meters',
                de: 'Lichtempfindliche Selenzellen für Belichtungsmesser',
              }),
              level: 3,
              sortOrder: 2,
            },
          ],
        },
        {
          slug: 'copper-oxide-devices',
          name: ls({ en: 'Copper Oxide Devices', de: 'Kupferoxid-Bauteile', fr: 'Dispositifs à oxyde de cuivre' }),
          description: ls({
            en: 'Copper oxide rectifiers and photocells (1920s-1960s)',
            de: 'Kupferoxid-Gleichrichter und Photozellen (1920er-1960er)',
          }),
          level: 2,
          sortOrder: 2,
          children: [
            {
              slug: 'copper-oxide-rectifiers',
              name: ls({ en: 'Copper Oxide Rectifiers', de: 'Kupferoxid-Gleichrichter', fr: 'Redresseurs à oxyde de cuivre' }),
              description: ls({
                en: 'Disc-type copper oxide rectifiers (battery chargers, instruments)',
                de: 'Scheiben-Kupferoxid-Gleichrichter (Ladegeräte, Messgeräte)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'copper-oxide-photocells',
              name: ls({ en: 'Copper Oxide Photocells', de: 'Kupferoxid-Photozellen', fr: 'Cellules photoélectriques à oxyde de cuivre' }),
              description: ls({
                en: 'Early photovoltaic cells (exposure meters, light meters)',
                de: 'Frühe photovoltaische Zellen (Belichtungsmesser, Lichtmesser)',
              }),
              level: 3,
              sortOrder: 2,
            },
          ],
        },
        {
          slug: 'early-silicon',
          name: ls({ en: 'Early Silicon Transistors', de: 'Frühe Silizium-Transistoren', fr: 'Premiers transistors au silicium' }),
          description: ls({
            en: 'First generation silicon transistors (1954-1970s)',
            de: 'Erste Generation Silizium-Transistoren (1954-1970er)',
          }),
          level: 2,
          sortOrder: 3,
          children: [
            {
              slug: 'mesa-transistors',
              name: ls({ en: 'Mesa Transistors', de: 'Mesa-Transistoren', fr: 'Transistors mesa' }),
              description: ls({
                en: 'Early silicon transistors with mesa structure (1950s)',
                de: 'Frühe Silizium-Transistoren mit Mesa-Struktur (1950er)',
              }),
              level: 3,
              sortOrder: 1,
            },
            {
              slug: 'alloy-junction-transistors',
              name: ls({ en: 'Alloy Junction Transistors', de: 'Legierungstransistoren', fr: 'Transistors à jonction alliée' }),
              description: ls({
                en: 'Early silicon transistors with alloyed junctions',
                de: 'Frühe Silizium-Transistoren mit legierten Übergängen',
              }),
              level: 3,
              sortOrder: 2,
            },
            {
              slug: 'grown-junction-transistors',
              name: ls({ en: 'Grown Junction Transistors', de: 'Gezogene Übergangstransistoren', fr: 'Transistors à jonction tirée' }),
              description: ls({
                en: 'First silicon transistors with grown junctions (1954)',
                de: 'Erste Silizium-Transistoren mit gezogenen Übergängen (1954)',
              }),
              level: 3,
              sortOrder: 3,
            },
          ],
        },
      ],
    },
  ];

  // Kategorien erstellen
  const categoryMap = new Map<string, string>();

  const allDomains = [
    ...vacuumTubesDomain,
    ...germaniumDomain,
    ...mechanicalDomain,
    ...earlySemiconductorsDomain,
  ];

  for (const domain of allDomains) {
    const domainMap = await createCategoryTree(prisma, [domain]);
    domainMap.forEach((id, slug) => categoryMap.set(slug, id));
  }

  console.log(`✅ Created ${categoryMap.size} historical categories`);

  // ============================================
  // ATTRIBUTE DEFINITIONS
  // ============================================

  console.log('🏷️  Creating attribute definitions for historical components...');

  // === VACUUM TUBE ATTRIBUTES ===

  // Triodes, Tetrodes, Pentodes
  const receivingTubesId = categoryMap.get('receiving-tubes');
  if (receivingTubesId) {
    await createAttributes(prisma, receivingTubesId, [
      {
        name: 'tube_type',
        displayName: ls({ de: 'Röhrentyp', en: 'Tube Type', fr: 'Type de tube' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        allowedValues: [
          'Triode',
          'Tetrode',
          'Pentode',
          'Hexode',
          'Heptode',
          'Octode',
          'Compactron',
          'Nuvistor',
          'Dual Triode',
          'Dual Diode',
        ],
        isFilterable: true,
        isRequired: true,
        sortOrder: 1,
      },
      {
        name: 'base_type',
        displayName: ls({ de: 'Sockeltyp', en: 'Base Type', fr: 'Type de culot' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        allowedValues: [
          'Octal',
          'Noval',
          'Rimlock',
          'Loctal',
          'Magnoval',
          'Compactron',
          'Nuvistor',
          '4-Pin',
          '5-Pin',
          '7-Pin',
          'Top Cap',
        ],
        isFilterable: true,
        isRequired: true,
        sortOrder: 2,
      },
      {
        name: 'heater_voltage',
        displayName: ls({ de: 'Heizspannung', en: 'Heater Voltage', fr: 'Tension de chauffage' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 3,
      },
      {
        name: 'heater_current',
        displayName: ls({ de: 'Heizstrom', en: 'Heater Current', fr: 'Courant de chauffage' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 4,
      },
      {
        name: 'plate_voltage',
        displayName: ls({ de: 'Anodenspannung', en: 'Plate Voltage', fr: 'Tension de plaque' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 5,
      },
      {
        name: 'plate_current',
        displayName: ls({ de: 'Anodenstrom', en: 'Plate Current', fr: 'Courant de plaque' }),
        unit: 'mA',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 6,
      },
      {
        name: 'amplification_factor',
        displayName: ls({ de: 'Verstärkungsfaktor (μ)', en: 'Amplification Factor (μ)', fr: 'Facteur d\'amplification (μ)' }),
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 7,
      },
      {
        name: 'plate_resistance',
        displayName: ls({ de: 'Anodenwiderstand', en: 'Plate Resistance', fr: 'Résistance de plaque' }),
        unit: 'Ω',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'k', 'M'],
        sortOrder: 8,
      },
      {
        name: 'transconductance',
        displayName: ls({ de: 'Steilheit', en: 'Transconductance', fr: 'Transconductance' }),
        unit: 'S',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm', 'μ'],
        sortOrder: 9,
      },
      {
        name: 'power_output',
        displayName: ls({ de: 'Ausgangsleistung', en: 'Power Output', fr: 'Puissance de sortie' }),
        unit: 'W',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 10,
      },
    ]);
  }

  // Rectifier Tubes
  const rectifierTubesId = categoryMap.get('rectifier-tubes');
  if (rectifierTubesId) {
    await createAttributes(prisma, rectifierTubesId, [
      {
        name: 'base_type',
        displayName: ls({ de: 'Sockeltyp', en: 'Base Type', fr: 'Type de culot' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        allowedValues: ['Octal', 'Noval', '4-Pin', '5-Pin', 'Top Cap'],
        isFilterable: true,
        isRequired: true,
        sortOrder: 1,
      },
      {
        name: 'heater_voltage',
        displayName: ls({ de: 'Heizspannung', en: 'Heater Voltage', fr: 'Tension de chauffage' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: true,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 2,
      },
      {
        name: 'peak_inverse_voltage',
        displayName: ls({ de: 'Sperrspannung', en: 'Peak Inverse Voltage', fr: 'Tension inverse de crête' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 3,
      },
      {
        name: 'avg_rectified_current',
        displayName: ls({ de: 'Mittlerer Gleichrichtstrom', en: 'Avg. Rectified Current', fr: 'Courant redressé moyen' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 4,
      },
      {
        name: 'peak_current',
        displayName: ls({ de: 'Spitzenstrom', en: 'Peak Current', fr: 'Courant de crête' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 5,
      },
      {
        name: 'voltage_drop',
        displayName: ls({ de: 'Spannungsabfall', en: 'Voltage Drop', fr: 'Chute de tension' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 6,
      },
    ]);
  }

  // Transmitting Tubes
  const transmittingTubesId = categoryMap.get('transmitting-tubes');
  if (transmittingTubesId) {
    await createAttributes(prisma, transmittingTubesId, [
      {
        name: 'carrier_power',
        displayName: ls({ de: 'Trägerleistung', en: 'Carrier Power', fr: 'Puissance de porteuse' }),
        unit: 'W',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 1,
      },
      {
        name: 'plate_dissipation',
        displayName: ls({ de: 'Anodenverlustleistung', en: 'Plate Dissipation', fr: 'Dissipation de plaque' }),
        unit: 'W',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 2,
      },
      {
        name: 'max_frequency',
        displayName: ls({ de: 'Maximale Frequenz', en: 'Maximum Frequency', fr: 'Fréquence maximale' }),
        unit: 'Hz',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 3,
      },
    ]);
  }

  // Nixie Tubes
  const nixieTubesId = categoryMap.get('nixie-tubes');
  if (nixieTubesId) {
    await createAttributes(prisma, nixieTubesId, [
      {
        name: 'digit_height',
        displayName: ls({ de: 'Ziffernhöhe', en: 'Digit Height', fr: 'Hauteur des chiffres' }),
        unit: 'mm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'anode_voltage',
        displayName: ls({ de: 'Anodenspannung', en: 'Anode Voltage', fr: 'Tension d\'anode' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'cathode_current',
        displayName: ls({ de: 'Kathodenstrom', en: 'Cathode Current', fr: 'Courant de cathode' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 3,
      },
    ]);
  }

  // === GERMANIUM TRANSISTOR ATTRIBUTES ===

  const germaniumTransistorsId = categoryMap.get('germanium-transistors');
  if (germaniumTransistorsId) {
    await createAttributes(prisma, germaniumTransistorsId, [
      {
        name: 'polarity',
        displayName: ls({ de: 'Polarität', en: 'Polarity', fr: 'Polarité' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        allowedValues: ['PNP', 'NPN'],
        isFilterable: true,
        isRequired: true,
        sortOrder: 1,
      },
      {
        name: 'hfe',
        displayName: ls({ de: 'Stromverstärkung (hFE)', en: 'Current Gain (hFE)', fr: 'Gain en courant (hFE)' }),
        dataType: AttributeDataType.MIN_MAX,
        scope: AttributeScope.PART,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'collector_current',
        displayName: ls({ de: 'Kollektorstrom', en: 'Collector Current', fr: 'Courant collecteur' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 3,
      },
      {
        name: 'vceo',
        displayName: ls({ de: 'Kollektor-Emitter-Spannung (VCEO)', en: 'Collector-Emitter Voltage (VCEO)', fr: 'Tension collecteur-émetteur (VCEO)' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 4,
      },
      {
        name: 'pcmax',
        displayName: ls({ de: 'Verlustleistung max.', en: 'Max. Power Dissipation', fr: 'Dissipation max.' }),
        unit: 'W',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 5,
      },
      {
        name: 'ft',
        displayName: ls({ de: 'Transitfrequenz', en: 'Transition Frequency', fr: 'Fréquence de transition' }),
        unit: 'Hz',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.PART,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 6,
      },
    ]);
  }

  // === SELENIUM RECTIFIER ATTRIBUTES ===

  const seleniumRectifiersId = categoryMap.get('selenium-rectifiers');
  if (seleniumRectifiersId) {
    await createAttributes(prisma, seleniumRectifiersId, [
      {
        name: 'piv',
        displayName: ls({ de: 'Sperrspannung', en: 'Peak Inverse Voltage', fr: 'Tension inverse de crête' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 1,
      },
      {
        name: 'forward_current',
        displayName: ls({ de: 'Durchlassstrom', en: 'Forward Current', fr: 'Courant direct' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 2,
      },
      {
        name: 'forward_voltage_drop',
        displayName: ls({ de: 'Durchlassspannung', en: 'Forward Voltage Drop', fr: 'Chute de tension directe' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 3,
      },
    ]);
  }

  console.log('✅ Historical component attributes created');
}
