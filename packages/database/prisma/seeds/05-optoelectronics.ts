// ElectroVault - Optoelectronics Seed
// Kategorien und Attribute für optoelektronische Bauteile

import { PrismaClient } from '@prisma/client';
import {
  ls,
  createCategoryTree,
  createAttributes,
  AttributeDataType,
  AttributeScope,
  type CategoryDef,
  type AttributeDef,
} from './types';

export async function seedOptoelectronics(prisma: PrismaClient) {
  console.log('💡 Seeding Optoelectronics...');

  // ============================================
  // KATEGORIE-HIERARCHIE
  // ============================================

  const categories: CategoryDef[] = [
    {
      slug: 'optoelectronics',
      name: ls({
        de: 'Optoelektronik',
        en: 'Optoelectronics',
        fr: 'Optoélectronique',
        es: 'Optoelectrónica',
        it: 'Optoelettronica',
      }),
      description: ls({
        de: 'Elektronische Bauteile zur Erzeugung, Detektion und Steuerung von Licht',
        en: 'Electronic components for light generation, detection and control',
      }),
      level: 0,
      sortOrder: 4,
      children: [
        // Family: LEDs
        {
          slug: 'leds',
          name: ls({
            de: 'LEDs',
            en: 'LEDs',
            fr: 'DEL',
            es: 'LED',
            it: 'LED',
          }),
          description: ls({
            de: 'Leuchtdioden und Laser-Dioden',
            en: 'Light Emitting Diodes and Laser Diodes',
          }),
          level: 1,
          sortOrder: 1,
          children: [
            {
              slug: 'standard-leds',
              name: ls({
                de: 'Standard-LEDs',
                en: 'Standard LEDs',
                fr: 'DEL standard',
                es: 'LED estándar',
              }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'through-hole-leds',
                  name: ls({
                    de: 'Bedrahtete LEDs',
                    en: 'Through-Hole LEDs',
                    fr: 'DEL traversantes',
                    es: 'LED de orificio pasante',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'smd-leds',
                  name: ls({
                    de: 'SMD-LEDs',
                    en: 'SMD LEDs',
                    fr: 'DEL CMS',
                    es: 'LED SMD',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'high-power-leds',
              name: ls({
                de: 'Hochleistungs-LEDs',
                en: 'High-Power LEDs',
                fr: 'DEL haute puissance',
                es: 'LED de alta potencia',
              }),
              level: 2,
              sortOrder: 2,
              children: [
                {
                  slug: 'cob-leds',
                  name: ls({
                    de: 'COB-LEDs',
                    en: 'COB LEDs',
                    fr: 'DEL COB',
                    es: 'LED COB',
                  }),
                  description: ls({
                    de: 'Chip-on-Board LEDs',
                    en: 'Chip-on-Board LEDs',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'multi-die-leds',
                  name: ls({
                    de: 'Multi-Die-LEDs',
                    en: 'Multi-Die LEDs',
                    fr: 'DEL multi-puces',
                    es: 'LED multi-chip',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'rgb-leds',
              name: ls({
                de: 'RGB-LEDs',
                en: 'RGB LEDs',
                fr: 'DEL RVB',
                es: 'LED RGB',
              }),
              level: 2,
              sortOrder: 3,
              children: [
                {
                  slug: 'common-anode-rgb',
                  name: ls({
                    de: 'Gemeinsame Anode',
                    en: 'Common Anode',
                    fr: 'Anode commune',
                    es: 'Ánodo común',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'common-cathode-rgb',
                  name: ls({
                    de: 'Gemeinsame Kathode',
                    en: 'Common Cathode',
                    fr: 'Cathode commune',
                    es: 'Cátodo común',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'addressable-leds',
                  name: ls({
                    de: 'Adressierbare LEDs',
                    en: 'Addressable LEDs',
                    fr: 'DEL adressables',
                    es: 'LED direccionables',
                  }),
                  description: ls({
                    de: 'WS2812, APA102, SK6812 etc.',
                    en: 'WS2812, APA102, SK6812 etc.',
                  }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'infrared-leds',
              name: ls({
                de: 'Infrarot-LEDs',
                en: 'Infrared LEDs',
                fr: 'DEL infrarouges',
                es: 'LED infrarrojos',
              }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'uv-leds',
              name: ls({
                de: 'UV-LEDs',
                en: 'UV LEDs',
                fr: 'DEL UV',
                es: 'LED UV',
              }),
              level: 2,
              sortOrder: 5,
            },
            {
              slug: 'laser-diodes',
              name: ls({
                de: 'Laserdioden',
                en: 'Laser Diodes',
                fr: 'Diodes laser',
                es: 'Diodos láser',
              }),
              level: 2,
              sortOrder: 6,
              children: [
                {
                  slug: 'visible-laser',
                  name: ls({
                    de: 'Sichtbare Laser',
                    en: 'Visible Laser',
                    fr: 'Laser visible',
                    es: 'Láser visible',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'ir-laser',
                  name: ls({
                    de: 'Infrarot-Laser',
                    en: 'IR Laser',
                    fr: 'Laser IR',
                    es: 'Láser IR',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'vcsel',
                  name: ls({
                    de: 'VCSEL',
                    en: 'VCSEL',
                    fr: 'VCSEL',
                    es: 'VCSEL',
                  }),
                  description: ls({
                    de: 'Vertical-Cavity Surface-Emitting Laser',
                    en: 'Vertical-Cavity Surface-Emitting Laser',
                  }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'led-arrays',
              name: ls({
                de: 'LED-Arrays',
                en: 'LED Arrays',
                fr: 'Matrices DEL',
                es: 'Matrices LED',
              }),
              level: 2,
              sortOrder: 7,
            },
            {
              slug: 'led-bars-strips',
              name: ls({
                de: 'LED-Balken/-Streifen',
                en: 'LED Bars/Strips',
                fr: 'Barres/Bandes DEL',
                es: 'Barras/Tiras LED',
              }),
              level: 2,
              sortOrder: 8,
            },
            {
              slug: 'organic-leds',
              name: ls({
                de: 'Organische LEDs',
                en: 'Organic LEDs',
                fr: 'DEL organiques',
                es: 'LED orgánicos',
              }),
              description: ls({
                de: 'OLED-Leuchtdioden (nicht Displays)',
                en: 'OLED light emitters (not displays)',
              }),
              level: 2,
              sortOrder: 9,
            },
          ],
        },

        // Family: Displays
        {
          slug: 'displays',
          name: ls({
            de: 'Displays',
            en: 'Displays',
            fr: 'Affichages',
            es: 'Pantallas',
            it: 'Display',
          }),
          level: 1,
          sortOrder: 2,
          children: [
            {
              slug: '7-segment-displays',
              name: ls({
                de: '7-Segment-Anzeigen',
                en: '7-Segment Displays',
                fr: 'Afficheurs 7 segments',
                es: 'Displays de 7 segmentos',
              }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'single-digit-7seg',
                  name: ls({
                    de: 'Einstellig',
                    en: 'Single Digit',
                    fr: 'Mono-chiffre',
                    es: 'Un dígito',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'multi-digit-7seg',
                  name: ls({
                    de: 'Mehrstellig',
                    en: 'Multi-Digit',
                    fr: 'Multi-chiffres',
                    es: 'Múltiples dígitos',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'alphanumeric-displays',
              name: ls({
                de: 'Alphanumerische Anzeigen',
                en: 'Alphanumeric Displays',
                fr: 'Afficheurs alphanumériques',
                es: 'Displays alfanuméricos',
              }),
              level: 2,
              sortOrder: 2,
              children: [
                {
                  slug: '14-segment',
                  name: ls({
                    de: '14-Segment',
                    en: '14-Segment',
                    fr: '14 segments',
                    es: '14 segmentos',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: '16-segment',
                  name: ls({
                    de: '16-Segment',
                    en: '16-Segment',
                    fr: '16 segments',
                    es: '16 segmentos',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'dot-matrix-displays',
              name: ls({
                de: 'Punktmatrix-Anzeigen',
                en: 'Dot Matrix Displays',
                fr: 'Afficheurs matriciels',
                es: 'Displays de matriz de puntos',
              }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'bar-graph-displays',
              name: ls({
                de: 'Balkendiagramm-Anzeigen',
                en: 'Bar Graph Displays',
                fr: 'Afficheurs à barres',
                es: 'Displays de gráfico de barras',
              }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'lcd-modules',
              name: ls({
                de: 'LCD-Module',
                en: 'LCD Modules',
                fr: 'Modules LCD',
                es: 'Módulos LCD',
              }),
              level: 2,
              sortOrder: 5,
              children: [
                {
                  slug: 'character-lcd',
                  name: ls({
                    de: 'Zeichen-LCD',
                    en: 'Character LCD',
                    fr: 'LCD à caractères',
                    es: 'LCD de caracteres',
                  }),
                  description: ls({
                    de: 'z.B. 16x2, 20x4',
                    en: 'e.g. 16x2, 20x4',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'graphic-lcd',
                  name: ls({
                    de: 'Grafik-LCD',
                    en: 'Graphic LCD',
                    fr: 'LCD graphique',
                    es: 'LCD gráfico',
                  }),
                  description: ls({
                    de: 'z.B. 128x64, 320x240',
                    en: 'e.g. 128x64, 320x240',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'segment-lcd',
                  name: ls({
                    de: 'Segment-LCD',
                    en: 'Segment LCD',
                    fr: 'LCD segmenté',
                    es: 'LCD segmentado',
                  }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'tft-displays',
              name: ls({
                de: 'TFT-Displays',
                en: 'TFT Displays',
                fr: 'Écrans TFT',
                es: 'Pantallas TFT',
              }),
              level: 2,
              sortOrder: 6,
            },
            {
              slug: 'oled-displays',
              name: ls({
                de: 'OLED-Displays',
                en: 'OLED Displays',
                fr: 'Écrans OLED',
                es: 'Pantallas OLED',
              }),
              level: 2,
              sortOrder: 7,
            },
            {
              slug: 'epaper-eink',
              name: ls({
                de: 'E-Paper/E-Ink',
                en: 'E-Paper/E-Ink',
                fr: 'Papier électronique',
                es: 'Papel electrónico',
              }),
              level: 2,
              sortOrder: 8,
            },
            {
              slug: 'vfd',
              name: ls({
                de: 'VFD',
                en: 'VFD',
                fr: 'VFD',
                es: 'VFD',
              }),
              description: ls({
                de: 'Vakuum-Fluoreszenz-Anzeigen',
                en: 'Vacuum Fluorescent Displays',
              }),
              level: 2,
              sortOrder: 9,
            },
            {
              slug: 'nixie-tubes',
              name: ls({
                de: 'Nixie-Röhren',
                en: 'Nixie Tubes',
                fr: 'Tubes Nixie',
                es: 'Tubos Nixie',
              }),
              description: ls({
                de: 'Historische Gasentladungsanzeigen',
                en: 'Historical gas discharge displays',
              }),
              level: 2,
              sortOrder: 10,
            },
            {
              slug: 'crt',
              name: ls({
                de: 'CRT',
                en: 'CRT',
                fr: 'Tube cathodique',
                es: 'Tubo de rayos catódicos',
              }),
              description: ls({
                de: 'Kathodenstrahlröhren (historisch)',
                en: 'Cathode Ray Tubes (historical)',
              }),
              level: 2,
              sortOrder: 11,
            },
            {
              slug: 'led-matrix',
              name: ls({
                de: 'LED-Matrix',
                en: 'LED Matrix',
                fr: 'Matrice LED',
                es: 'Matriz LED',
              }),
              level: 2,
              sortOrder: 12,
            },
          ],
        },

        // Family: Photo Detectors
        {
          slug: 'photo-detectors',
          name: ls({
            de: 'Photodetektoren',
            en: 'Photo Detectors',
            fr: 'Photodétecteurs',
            es: 'Fotodetectores',
          }),
          level: 1,
          sortOrder: 3,
          children: [
            {
              slug: 'photodiodes',
              name: ls({
                de: 'Photodioden',
                en: 'Photodiodes',
                fr: 'Photodiodes',
                es: 'Fotodiodos',
              }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'pin-photodiodes',
                  name: ls({
                    de: 'PIN-Photodioden',
                    en: 'PIN Photodiodes',
                    fr: 'Photodiodes PIN',
                    es: 'Fotodiodos PIN',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'avalanche-photodiodes',
                  name: ls({
                    de: 'Avalanche-Photodioden',
                    en: 'Avalanche Photodiodes',
                    fr: 'Photodiodes à avalanche',
                    es: 'Fotodiodos de avalancha',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'schottky-photodiodes',
                  name: ls({
                    de: 'Schottky-Photodioden',
                    en: 'Schottky Photodiodes',
                    fr: 'Photodiodes Schottky',
                    es: 'Fotodiodos Schottky',
                  }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'phototransistors',
              name: ls({
                de: 'Phototransistoren',
                en: 'Phototransistors',
                fr: 'Phototransistors',
                es: 'Fototransistores',
              }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'photoresistors',
              name: ls({
                de: 'Photowiderstände',
                en: 'Photoresistors',
                fr: 'Photorésistances',
                es: 'Fotorresistencias',
              }),
              description: ls({
                de: 'LDR - Light Dependent Resistors',
                en: 'LDR - Light Dependent Resistors',
              }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'photodarlingtons',
              name: ls({
                de: 'Photodarlingtons',
                en: 'Photodarlingtons',
                fr: 'Photodarlingtons',
                es: 'Fotodarlingtons',
              }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'solar-cells',
              name: ls({
                de: 'Solarzellen',
                en: 'Solar Cells',
                fr: 'Cellules solaires',
                es: 'Células solares',
              }),
              level: 2,
              sortOrder: 5,
              children: [
                {
                  slug: 'monocrystalline-solar',
                  name: ls({
                    de: 'Monokristallin',
                    en: 'Monocrystalline',
                    fr: 'Monocristallin',
                    es: 'Monocristalino',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'polycrystalline-solar',
                  name: ls({
                    de: 'Polykristallin',
                    en: 'Polycrystalline',
                    fr: 'Polycristallin',
                    es: 'Policristalino',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'thin-film-solar',
                  name: ls({
                    de: 'Dünnschicht',
                    en: 'Thin Film',
                    fr: 'Couche mince',
                    es: 'Película delgada',
                  }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'photo-ics',
              name: ls({
                de: 'Photo-ICs',
                en: 'Photo ICs',
                fr: 'CI photo',
                es: 'CI fotográficos',
              }),
              level: 2,
              sortOrder: 6,
            },
            {
              slug: 'light-to-frequency',
              name: ls({
                de: 'Licht-zu-Frequenz-Wandler',
                en: 'Light-to-Frequency Converters',
                fr: 'Convertisseurs lumière-fréquence',
                es: 'Convertidores luz-frecuencia',
              }),
              level: 2,
              sortOrder: 7,
            },
            {
              slug: 'light-to-voltage',
              name: ls({
                de: 'Licht-zu-Spannung-Wandler',
                en: 'Light-to-Voltage Converters',
                fr: 'Convertisseurs lumière-tension',
                es: 'Convertidores luz-voltaje',
              }),
              level: 2,
              sortOrder: 8,
            },
          ],
        },

        // Family: Optocouplers
        {
          slug: 'optocouplers',
          name: ls({
            de: 'Optokoppler',
            en: 'Optocouplers',
            fr: 'Optocoupleurs',
            es: 'Optoacopladores',
          }),
          level: 1,
          sortOrder: 4,
          children: [
            {
              slug: 'phototransistor-output',
              name: ls({
                de: 'Phototransistor-Ausgang',
                en: 'Phototransistor Output',
                fr: 'Sortie phototransistor',
                es: 'Salida de fototransistor',
              }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'phototriac-output',
              name: ls({
                de: 'Phototriac-Ausgang',
                en: 'Phototriac Output',
                fr: 'Sortie phototriac',
                es: 'Salida de fototriac',
              }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'photodarlington-output',
              name: ls({
                de: 'Photodarlington-Ausgang',
                en: 'Photodarlington Output',
                fr: 'Sortie photodarlington',
                es: 'Salida de fotodarlington',
              }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'logic-output-opto',
              name: ls({
                de: 'Logik-Ausgang',
                en: 'Logic Output',
                fr: 'Sortie logique',
                es: 'Salida lógica',
              }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'igbt-mosfet-driver-opto',
              name: ls({
                de: 'IGBT/MOSFET-Treiber',
                en: 'IGBT/MOSFET Driver',
                fr: 'Pilote IGBT/MOSFET',
                es: 'Driver IGBT/MOSFET',
              }),
              level: 2,
              sortOrder: 5,
            },
            {
              slug: 'linear-optocouplers',
              name: ls({
                de: 'Lineare Optokoppler',
                en: 'Linear Optocouplers',
                fr: 'Optocoupleurs linéaires',
                es: 'Optoacopladores lineales',
              }),
              level: 2,
              sortOrder: 6,
            },
            {
              slug: 'high-speed-optocouplers',
              name: ls({
                de: 'Hochgeschwindigkeits-Optokoppler',
                en: 'High-Speed Optocouplers',
                fr: 'Optocoupleurs haute vitesse',
                es: 'Optoacopladores de alta velocidad',
              }),
              level: 2,
              sortOrder: 7,
            },
          ],
        },

        // Family: Optical Sensors
        {
          slug: 'optical-sensors',
          name: ls({
            de: 'Optische Sensoren',
            en: 'Optical Sensors',
            fr: 'Capteurs optiques',
            es: 'Sensores ópticos',
          }),
          level: 1,
          sortOrder: 5,
          children: [
            {
              slug: 'ambient-light-sensors',
              name: ls({
                de: 'Umgebungslichtsensoren',
                en: 'Ambient Light Sensors',
                fr: 'Capteurs de lumière ambiante',
                es: 'Sensores de luz ambiente',
              }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'color-sensors',
              name: ls({
                de: 'Farbsensoren',
                en: 'Color Sensors',
                fr: 'Capteurs de couleur',
                es: 'Sensores de color',
              }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'uv-sensors',
              name: ls({
                de: 'UV-Sensoren',
                en: 'UV Sensors',
                fr: 'Capteurs UV',
                es: 'Sensores UV',
              }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'ir-sensors',
              name: ls({
                de: 'IR-Sensoren',
                en: 'IR Sensors',
                fr: 'Capteurs IR',
                es: 'Sensores IR',
              }),
              level: 2,
              sortOrder: 4,
              children: [
                {
                  slug: 'pir-sensors',
                  name: ls({
                    de: 'PIR-Sensoren',
                    en: 'PIR Sensors',
                    fr: 'Capteurs PIR',
                    es: 'Sensores PIR',
                  }),
                  description: ls({
                    de: 'Passiv-Infrarot-Bewegungsmelder',
                    en: 'Passive Infrared Motion Sensors',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'ir-receivers',
                  name: ls({
                    de: 'IR-Empfänger',
                    en: 'IR Receivers',
                    fr: 'Récepteurs IR',
                    es: 'Receptores IR',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'ir-proximity',
                  name: ls({
                    de: 'IR-Näherungssensoren',
                    en: 'IR Proximity',
                    fr: 'Capteurs de proximité IR',
                    es: 'Sensores de proximidad IR',
                  }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'optical-encoders',
              name: ls({
                de: 'Optische Encoder',
                en: 'Optical Encoders',
                fr: 'Encodeurs optiques',
                es: 'Codificadores ópticos',
              }),
              level: 2,
              sortOrder: 5,
              children: [
                {
                  slug: 'incremental-encoder',
                  name: ls({
                    de: 'Inkrementell',
                    en: 'Incremental',
                    fr: 'Incrémental',
                    es: 'Incremental',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'absolute-encoder',
                  name: ls({
                    de: 'Absolut',
                    en: 'Absolute',
                    fr: 'Absolu',
                    es: 'Absoluto',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'reflective-sensors',
              name: ls({
                de: 'Reflexsensoren',
                en: 'Reflective Sensors',
                fr: 'Capteurs réfléchissants',
                es: 'Sensores reflectantes',
              }),
              level: 2,
              sortOrder: 6,
            },
            {
              slug: 'through-beam-sensors',
              name: ls({
                de: 'Durchstrahlsensoren',
                en: 'Through-Beam Sensors',
                fr: 'Capteurs à faisceau traversant',
                es: 'Sensores de haz directo',
              }),
              level: 2,
              sortOrder: 7,
            },
            {
              slug: 'image-sensors',
              name: ls({
                de: 'Bildsensoren',
                en: 'Image Sensors',
                fr: 'Capteurs d\'image',
                es: 'Sensores de imagen',
              }),
              level: 2,
              sortOrder: 8,
              children: [
                {
                  slug: 'ccd-sensors',
                  name: ls({
                    de: 'CCD',
                    en: 'CCD',
                    fr: 'CCD',
                    es: 'CCD',
                  }),
                  description: ls({
                    de: 'Charge-Coupled Device',
                    en: 'Charge-Coupled Device',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'cmos-sensors',
                  name: ls({
                    de: 'CMOS',
                    en: 'CMOS',
                    fr: 'CMOS',
                    es: 'CMOS',
                  }),
                  description: ls({
                    de: 'Complementary Metal-Oxide-Semiconductor',
                    en: 'Complementary Metal-Oxide-Semiconductor',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
          ],
        },

        // Family: Fiber Optics
        {
          slug: 'fiber-optics',
          name: ls({
            de: 'Glasfasertechnik',
            en: 'Fiber Optics',
            fr: 'Fibre optique',
            es: 'Fibra óptica',
          }),
          level: 1,
          sortOrder: 6,
          children: [
            {
              slug: 'fiber-optic-transmitters',
              name: ls({
                de: 'Glasfaser-Sender',
                en: 'Fiber Optic Transmitters',
                fr: 'Émetteurs à fibre optique',
                es: 'Transmisores de fibra óptica',
              }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'fiber-optic-receivers',
              name: ls({
                de: 'Glasfaser-Empfänger',
                en: 'Fiber Optic Receivers',
                fr: 'Récepteurs à fibre optique',
                es: 'Receptores de fibra óptica',
              }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'fiber-optic-transceivers',
              name: ls({
                de: 'Glasfaser-Transceiver',
                en: 'Fiber Optic Transceivers',
                fr: 'Émetteurs-récepteurs à fibre optique',
                es: 'Transceptores de fibra óptica',
              }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'fiber-optic-cables',
              name: ls({
                de: 'Glasfaserkabel',
                en: 'Fiber Optic Cables',
                fr: 'Câbles à fibre optique',
                es: 'Cables de fibra óptica',
              }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'fiber-optic-connectors',
              name: ls({
                de: 'Glasfaser-Steckverbinder',
                en: 'Fiber Optic Connectors',
                fr: 'Connecteurs à fibre optique',
                es: 'Conectores de fibra óptica',
              }),
              level: 2,
              sortOrder: 5,
            },
            {
              slug: 'optical-switches',
              name: ls({
                de: 'Optische Schalter',
                en: 'Optical Switches',
                fr: 'Commutateurs optiques',
                es: 'Interruptores ópticos',
              }),
              level: 2,
              sortOrder: 6,
            },
          ],
        },

        // Family: Infrared Components
        {
          slug: 'infrared-components',
          name: ls({
            de: 'Infrarot-Komponenten',
            en: 'Infrared Components',
            fr: 'Composants infrarouges',
            es: 'Componentes infrarrojos',
          }),
          level: 1,
          sortOrder: 7,
          children: [
            {
              slug: 'ir-emitters',
              name: ls({
                de: 'IR-Sender',
                en: 'IR Emitters',
                fr: 'Émetteurs IR',
                es: 'Emisores IR',
              }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'ir-receivers-comp',
              name: ls({
                de: 'IR-Empfänger',
                en: 'IR Receivers',
                fr: 'Récepteurs IR',
                es: 'Receptores IR',
              }),
              level: 2,
              sortOrder: 2,
              children: [
                {
                  slug: 'ir-receiver-modules',
                  name: ls({
                    de: 'IR-Empfängermodule',
                    en: 'IR Receiver Modules',
                    fr: 'Modules récepteur IR',
                    es: 'Módulos receptores IR',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'tsop-series',
                  name: ls({
                    de: 'TSOP-Serie',
                    en: 'TSOP Series',
                    fr: 'Série TSOP',
                    es: 'Serie TSOP',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'ir-transceivers',
              name: ls({
                de: 'IR-Transceiver',
                en: 'IR Transceivers',
                fr: 'Émetteurs-récepteurs IR',
                es: 'Transceptores IR',
              }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'thermal-ir-sensors',
              name: ls({
                de: 'Thermische IR-Sensoren',
                en: 'Thermal IR Sensors',
                fr: 'Capteurs IR thermiques',
                es: 'Sensores IR térmicos',
              }),
              level: 2,
              sortOrder: 4,
              children: [
                {
                  slug: 'thermopile',
                  name: ls({
                    de: 'Thermopile',
                    en: 'Thermopile',
                    fr: 'Thermopile',
                    es: 'Termopila',
                  }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'pyroelectric',
                  name: ls({
                    de: 'Pyroelektrisch',
                    en: 'Pyroelectric',
                    fr: 'Pyroélectrique',
                    es: 'Piroeléctrico',
                  }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'bolometer',
                  name: ls({
                    de: 'Bolometer',
                    en: 'Bolometer',
                    fr: 'Bolomètre',
                    es: 'Bolómetro',
                  }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
          ],
        },

        // Family: Light Pipes
        {
          slug: 'light-pipes',
          name: ls({
            de: 'Lichtleiter',
            en: 'Light Pipes',
            fr: 'Guides de lumière',
            es: 'Guías de luz',
          }),
          level: 1,
          sortOrder: 8,
          children: [
            {
              slug: 'rigid-light-pipes',
              name: ls({
                de: 'Starre Lichtleiter',
                en: 'Rigid Light Pipes',
                fr: 'Guides de lumière rigides',
                es: 'Guías de luz rígidas',
              }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'flexible-light-pipes',
              name: ls({
                de: 'Flexible Lichtleiter',
                en: 'Flexible Light Pipes',
                fr: 'Guides de lumière flexibles',
                es: 'Guías de luz flexibles',
              }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'panel-mount-light-pipes',
              name: ls({
                de: 'Frontplatten-Lichtleiter',
                en: 'Panel Mount',
                fr: 'Montage en panneau',
                es: 'Montaje en panel',
              }),
              level: 2,
              sortOrder: 3,
            },
          ],
        },
      ],
    },
  ];

  const categoryMap = await createCategoryTree(prisma, categories);

  // ============================================
  // ATTRIBUTE DEFINITIONEN
  // ============================================

  // LEDs (Family)
  const ledsId = categoryMap.get('leds');
  if (ledsId) {
    const ledAttributes: AttributeDef[] = [
      {
        name: 'wavelength',
        displayName: ls({
          de: 'Wellenlänge',
          en: 'Wavelength',
          fr: 'Longueur d\'onde',
          es: 'Longitud de onda',
        }),
        unit: 'nm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'forward_voltage',
        displayName: ls({
          de: 'Durchlassspannung',
          en: 'Forward Voltage',
          fr: 'Tension directe',
          es: 'Voltaje directo',
        }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 2,
      },
      {
        name: 'forward_current',
        displayName: ls({
          de: 'Durchlassstrom',
          en: 'Forward Current',
          fr: 'Courant direct',
          es: 'Corriente directa',
        }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'µ', 'm'],
        sortOrder: 3,
      },
      {
        name: 'luminous_intensity',
        displayName: ls({
          de: 'Lichtstärke',
          en: 'Luminous Intensity',
          fr: 'Intensité lumineuse',
          es: 'Intensidad luminosa',
        }),
        unit: 'cd',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'm', 'k'],
        sortOrder: 4,
      },
      {
        name: 'viewing_angle',
        displayName: ls({
          de: 'Abstrahlwinkel',
          en: 'Viewing Angle',
          fr: 'Angle de vue',
          es: 'Ángulo de visión',
        }),
        unit: '°',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 5,
      },
      {
        name: 'color',
        displayName: ls({
          de: 'Farbe',
          en: 'Color',
          fr: 'Couleur',
          es: 'Color',
        }),
        dataType: AttributeDataType.SELECT,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedValues: ['Red', 'Green', 'Blue', 'White', 'Yellow', 'Orange', 'Amber', 'IR', 'UV', 'RGB'],
        sortOrder: 6,
      },
      {
        name: 'power_dissipation',
        displayName: ls({
          de: 'Verlustleistung',
          en: 'Power Dissipation',
          fr: 'Dissipation de puissance',
          es: 'Disipación de potencia',
        }),
        unit: 'W',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 7,
      },
    ];
    await createAttributes(prisma, ledsId, ledAttributes);
  }

  // Displays (Family)
  const displaysId = categoryMap.get('displays');
  if (displaysId) {
    const displayAttributes: AttributeDef[] = [
      {
        name: 'display_type',
        displayName: ls({
          de: 'Display-Typ',
          en: 'Display Type',
          fr: 'Type d\'affichage',
          es: 'Tipo de pantalla',
        }),
        dataType: AttributeDataType.SELECT,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedValues: ['7-Segment', '14-Segment', '16-Segment', 'Dot Matrix', 'LCD', 'TFT', 'OLED', 'E-Ink', 'VFD', 'Nixie', 'CRT'],
        sortOrder: 1,
      },
      {
        name: 'resolution',
        displayName: ls({
          de: 'Auflösung',
          en: 'Resolution',
          fr: 'Résolution',
          es: 'Resolución',
        }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        sortOrder: 2,
      },
      {
        name: 'diagonal',
        displayName: ls({
          de: 'Diagonale',
          en: 'Diagonal',
          fr: 'Diagonale',
          es: 'Diagonal',
        }),
        unit: 'mm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 3,
      },
      {
        name: 'interface',
        displayName: ls({
          de: 'Schnittstelle',
          en: 'Interface',
          fr: 'Interface',
          es: 'Interfaz',
        }),
        dataType: AttributeDataType.SELECT,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedValues: ['Parallel', 'SPI', 'I2C', 'UART', 'MIPI', 'LVDS', 'HDMI', 'DisplayPort'],
        sortOrder: 4,
      },
      {
        name: 'backlight',
        displayName: ls({
          de: 'Hintergrundbeleuchtung',
          en: 'Backlight',
          fr: 'Rétroéclairage',
          es: 'Retroiluminación',
        }),
        dataType: AttributeDataType.BOOLEAN,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        sortOrder: 5,
      },
      {
        name: 'digits',
        displayName: ls({
          de: 'Anzahl Ziffern',
          en: 'Number of Digits',
          fr: 'Nombre de chiffres',
          es: 'Número de dígitos',
        }),
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 6,
      },
      {
        name: 'character_height',
        displayName: ls({
          de: 'Zeichenhöhe',
          en: 'Character Height',
          fr: 'Hauteur de caractère',
          es: 'Altura del carácter',
        }),
        unit: 'mm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 7,
      },
    ];
    await createAttributes(prisma, displaysId, displayAttributes);
  }

  // Photo Detectors (Family)
  const photoDetectorsId = categoryMap.get('photo-detectors');
  if (photoDetectorsId) {
    const photoDetectorAttributes: AttributeDef[] = [
      {
        name: 'wavelength_peak',
        displayName: ls({
          de: 'Spitzen-Wellenlänge',
          en: 'Peak Wavelength',
          fr: 'Longueur d\'onde de pointe',
          es: 'Longitud de onda pico',
        }),
        unit: 'nm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'wavelength_range',
        displayName: ls({
          de: 'Wellenlängenbereich',
          en: 'Wavelength Range',
          fr: 'Plage de longueurs d\'onde',
          es: 'Rango de longitud de onda',
        }),
        unit: 'nm',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'responsivity',
        displayName: ls({
          de: 'Empfindlichkeit',
          en: 'Responsivity',
          fr: 'Sensibilité',
          es: 'Sensibilidad',
        }),
        unit: 'A/W',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 3,
      },
      {
        name: 'dark_current',
        displayName: ls({
          de: 'Dunkelstrom',
          en: 'Dark Current',
          fr: 'Courant d\'obscurité',
          es: 'Corriente oscura',
        }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'p', 'n', 'µ'],
        sortOrder: 4,
      },
      {
        name: 'response_time',
        displayName: ls({
          de: 'Ansprechzeit',
          en: 'Response Time',
          fr: 'Temps de réponse',
          es: 'Tiempo de respuesta',
        }),
        unit: 's',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'p', 'n', 'µ', 'm'],
        sortOrder: 5,
      },
      {
        name: 'active_area',
        displayName: ls({
          de: 'Aktive Fläche',
          en: 'Active Area',
          fr: 'Zone active',
          es: 'Área activa',
        }),
        unit: 'mm²',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 6,
      },
    ];
    await createAttributes(prisma, photoDetectorsId, photoDetectorAttributes);
  }

  // Optocouplers (Family)
  const optocouplersId = categoryMap.get('optocouplers');
  if (optocouplersId) {
    const optocouplerAttributes: AttributeDef[] = [
      {
        name: 'ctr',
        displayName: ls({
          de: 'Stromübertragungsrate',
          en: 'Current Transfer Ratio',
          fr: 'Taux de transfert de courant',
          es: 'Relación de transferencia de corriente',
        }),
        unit: '%',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'isolation_voltage',
        displayName: ls({
          de: 'Isolationsspannung',
          en: 'Isolation Voltage',
          fr: 'Tension d\'isolement',
          es: 'Voltaje de aislamiento',
        }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 2,
      },
      {
        name: 'bandwidth',
        displayName: ls({
          de: 'Bandbreite',
          en: 'Bandwidth',
          fr: 'Bande passante',
          es: 'Ancho de banda',
        }),
        unit: 'Hz',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 3,
      },
      {
        name: 'input_forward_voltage',
        displayName: ls({
          de: 'Eingangsspannung',
          en: 'Input Forward Voltage',
          fr: 'Tension directe d\'entrée',
          es: 'Voltaje directo de entrada',
        }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 4,
      },
      {
        name: 'output_voltage_max',
        displayName: ls({
          de: 'Max. Ausgangsspannung',
          en: 'Max Output Voltage',
          fr: 'Tension de sortie max',
          es: 'Voltaje de salida máx',
        }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 5,
      },
      {
        name: 'propagation_delay',
        displayName: ls({
          de: 'Signallaufzeit',
          en: 'Propagation Delay',
          fr: 'Délai de propagation',
          es: 'Retardo de propagación',
        }),
        unit: 's',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-', 'p', 'n', 'µ'],
        sortOrder: 6,
      },
    ];
    await createAttributes(prisma, optocouplersId, optocouplerAttributes);
  }

  // Optical Sensors (Family)
  const opticalSensorsId = categoryMap.get('optical-sensors');
  if (opticalSensorsId) {
    const opticalSensorAttributes: AttributeDef[] = [
      {
        name: 'wavelength_sensitivity',
        displayName: ls({
          de: 'Wellenlängen-Empfindlichkeit',
          en: 'Wavelength Sensitivity',
          fr: 'Sensibilité aux longueurs d\'onde',
          es: 'Sensibilidad a longitud de onda',
        }),
        unit: 'nm',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'detection_distance',
        displayName: ls({
          de: 'Erfassungsdistanz',
          en: 'Detection Distance',
          fr: 'Distance de détection',
          es: 'Distancia de detección',
        }),
        unit: 'mm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'output_type',
        displayName: ls({
          de: 'Ausgangstyp',
          en: 'Output Type',
          fr: 'Type de sortie',
          es: 'Tipo de salida',
        }),
        dataType: AttributeDataType.SELECT,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedValues: ['Analog', 'Digital', 'PWM', 'I2C', 'SPI', 'UART'],
        sortOrder: 3,
      },
      {
        name: 'detection_angle',
        displayName: ls({
          de: 'Erfassungswinkel',
          en: 'Detection Angle',
          fr: 'Angle de détection',
          es: 'Ángulo de detección',
        }),
        unit: '°',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 4,
      },
    ];
    await createAttributes(prisma, opticalSensorsId, opticalSensorAttributes);
  }

  // Fiber Optics (Family)
  const fiberOpticsId = categoryMap.get('fiber-optics');
  if (fiberOpticsId) {
    const fiberOpticAttributes: AttributeDef[] = [
      {
        name: 'wavelength',
        displayName: ls({
          de: 'Wellenlänge',
          en: 'Wavelength',
          fr: 'Longueur d\'onde',
          es: 'Longitud de onda',
        }),
        unit: 'nm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'data_rate',
        displayName: ls({
          de: 'Datenrate',
          en: 'Data Rate',
          fr: 'Débit de données',
          es: 'Tasa de datos',
        }),
        unit: 'bps',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 2,
      },
      {
        name: 'attenuation',
        displayName: ls({
          de: 'Dämpfung',
          en: 'Attenuation',
          fr: 'Atténuation',
          es: 'Atenuación',
        }),
        unit: 'dB/km',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        isRequired: false,
        allowedPrefixes: ['-'],
        sortOrder: 3,
      },
      {
        name: 'fiber_type',
        displayName: ls({
          de: 'Fasertyp',
          en: 'Fiber Type',
          fr: 'Type de fibre',
          es: 'Tipo de fibra',
        }),
        dataType: AttributeDataType.SELECT,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedValues: ['Single-Mode', 'Multi-Mode', 'Polarization-Maintaining'],
        sortOrder: 4,
      },
      {
        name: 'connector_type',
        displayName: ls({
          de: 'Stecker-Typ',
          en: 'Connector Type',
          fr: 'Type de connecteur',
          es: 'Tipo de conector',
        }),
        dataType: AttributeDataType.SELECT,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isRequired: false,
        allowedValues: ['LC', 'SC', 'ST', 'FC', 'MTP', 'MPO'],
        sortOrder: 5,
      },
    ];
    await createAttributes(prisma, fiberOpticsId, fiberOpticAttributes);
  }

  console.log('✅ Optoelectronics seeded successfully');
}
