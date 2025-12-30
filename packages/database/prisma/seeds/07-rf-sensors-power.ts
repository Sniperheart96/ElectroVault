// ElectroVault - RF/Wireless, Sensors und Power Components Seed
// Kategorien und Attribute für RF-Module, Sensoren und Stromversorgung

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

/**
 * Seed-Funktion für RF/Wireless, Sensors und Power Components
 */
export async function seedRfSensorsPower(prisma: PrismaClient): Promise<void> {
  console.log('📡 Seeding RF/Wireless, Sensors and Power Components...');

  // ============================================
  // DOMAIN: RF & Wireless
  // ============================================

  const rfWirelessCategories: CategoryDef[] = [
    {
      slug: 'rf-wireless',
      name: ls({
        en: 'RF & Wireless',
        de: 'HF & Drahtlos',
        fr: 'RF et sans fil',
        es: 'RF e inalámbrico',
        it: 'RF e wireless',
      }),
      description: ls({
        en: 'RF modules, antennas and discrete RF components',
        de: 'HF-Module, Antennen und diskrete HF-Komponenten',
      }),
      level: 0,
      sortOrder: 10,
      children: [
        // Family: RF Modules
        {
          slug: 'rf-modules',
          name: ls({
            en: 'RF Modules',
            de: 'HF-Module',
            fr: 'Modules RF',
            es: 'Módulos RF',
          }),
          level: 1,
          sortOrder: 1,
          children: [
            {
              slug: 'bluetooth-modules',
              name: ls({ en: 'Bluetooth Modules', de: 'Bluetooth-Module' }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'bluetooth-classic',
                  name: ls({ en: 'Bluetooth Classic', de: 'Bluetooth Classic' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'ble',
                  name: ls({ en: 'BLE', de: 'BLE' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'bluetooth-dual-mode',
                  name: ls({ en: 'Dual-Mode', de: 'Dual-Mode' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'wifi-modules',
              name: ls({ en: 'WiFi Modules', de: 'WiFi-Module' }),
              level: 2,
              sortOrder: 2,
              children: [
                {
                  slug: 'wifi-2-4-ghz',
                  name: ls({ en: '2.4 GHz', de: '2,4 GHz' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'wifi-5-ghz',
                  name: ls({ en: '5 GHz', de: '5 GHz' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'wifi-6',
                  name: ls({ en: 'WiFi 6', de: 'WiFi 6' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'zigbee-modules',
              name: ls({ en: 'Zigbee Modules', de: 'Zigbee-Module' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'lora-modules',
              name: ls({ en: 'LoRa Modules', de: 'LoRa-Module' }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'sub-ghz-modules',
              name: ls({ en: 'Sub-GHz Modules', de: 'Sub-GHz-Module' }),
              level: 2,
              sortOrder: 5,
              children: [
                {
                  slug: 'sub-ghz-433',
                  name: ls({ en: '433 MHz', de: '433 MHz' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'sub-ghz-868',
                  name: ls({ en: '868 MHz', de: '868 MHz' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'sub-ghz-915',
                  name: ls({ en: '915 MHz', de: '915 MHz' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'gps-gnss-modules',
              name: ls({ en: 'GPS/GNSS Modules', de: 'GPS/GNSS-Module' }),
              level: 2,
              sortOrder: 6,
            },
            {
              slug: 'nfc-modules',
              name: ls({ en: 'NFC Modules', de: 'NFC-Module' }),
              level: 2,
              sortOrder: 7,
            },
            {
              slug: 'rfid-modules',
              name: ls({ en: 'RFID Modules', de: 'RFID-Module' }),
              level: 2,
              sortOrder: 8,
              children: [
                {
                  slug: 'lf-rfid',
                  name: ls({ en: 'LF RFID', de: 'LF RFID' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'hf-rfid',
                  name: ls({ en: 'HF RFID', de: 'HF RFID' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'uhf-rfid',
                  name: ls({ en: 'UHF RFID', de: 'UHF RFID' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'cellular-modules',
              name: ls({ en: 'Cellular Modules', de: 'Mobilfunk-Module' }),
              level: 2,
              sortOrder: 9,
              children: [
                {
                  slug: 'cellular-2g-gsm',
                  name: ls({ en: '2G/GSM', de: '2G/GSM' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'cellular-3g',
                  name: ls({ en: '3G', de: '3G' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'cellular-4g-lte',
                  name: ls({ en: '4G/LTE', de: '4G/LTE' }),
                  level: 3,
                  sortOrder: 3,
                },
                {
                  slug: 'cellular-5g',
                  name: ls({ en: '5G', de: '5G' }),
                  level: 3,
                  sortOrder: 4,
                },
                {
                  slug: 'cellular-nb-iot',
                  name: ls({ en: 'NB-IoT', de: 'NB-IoT' }),
                  level: 3,
                  sortOrder: 5,
                },
                {
                  slug: 'cellular-cat-m1',
                  name: ls({ en: 'Cat-M1', de: 'Cat-M1' }),
                  level: 3,
                  sortOrder: 6,
                },
              ],
            },
          ],
        },
        // Family: Antennas
        {
          slug: 'antennas',
          name: ls({
            en: 'Antennas',
            de: 'Antennen',
            fr: 'Antennes',
            es: 'Antenas',
          }),
          level: 1,
          sortOrder: 2,
          children: [
            {
              slug: 'pcb-antennas',
              name: ls({ en: 'PCB Antennas', de: 'Leiterplatten-Antennen' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'chip-antennas',
              name: ls({ en: 'Chip Antennas', de: 'Chip-Antennen' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'wire-antennas',
              name: ls({ en: 'Wire Antennas', de: 'Drahtantennen' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'external-antennas',
              name: ls({ en: 'External Antennas', de: 'Externe Antennen' }),
              level: 2,
              sortOrder: 4,
              children: [
                {
                  slug: 'whip-antennas',
                  name: ls({ en: 'Whip Antennas', de: 'Stabantennen' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'yagi-antennas',
                  name: ls({ en: 'Yagi Antennas', de: 'Yagi-Antennen' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'patch-antennas',
                  name: ls({ en: 'Patch Antennas', de: 'Patch-Antennen' }),
                  level: 3,
                  sortOrder: 3,
                },
                {
                  slug: 'parabolic-antennas',
                  name: ls({ en: 'Parabolic Antennas', de: 'Parabolantennen' }),
                  level: 3,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'gps-antennas',
              name: ls({ en: 'GPS Antennas', de: 'GPS-Antennen' }),
              level: 2,
              sortOrder: 5,
            },
            {
              slug: 'lte-cellular-antennas',
              name: ls({ en: 'LTE/Cellular Antennas', de: 'LTE/Mobilfunk-Antennen' }),
              level: 2,
              sortOrder: 6,
            },
            {
              slug: 'nfc-antennas',
              name: ls({ en: 'NFC Antennas', de: 'NFC-Antennen' }),
              level: 2,
              sortOrder: 7,
            },
          ],
        },
        // Family: RF Discrete
        {
          slug: 'rf-discrete',
          name: ls({
            en: 'RF Discrete',
            de: 'Diskrete HF-Bauteile',
            fr: 'Composants RF discrets',
          }),
          level: 1,
          sortOrder: 3,
          children: [
            {
              slug: 'rf-transistors',
              name: ls({ en: 'RF Transistors', de: 'HF-Transistoren' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'rf-diodes',
              name: ls({ en: 'RF Diodes', de: 'HF-Dioden' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'varactors',
              name: ls({ en: 'Varactors', de: 'Varaktoren' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'pin-diodes',
              name: ls({ en: 'PIN Diodes', de: 'PIN-Dioden' }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'rf-mixers',
              name: ls({ en: 'Mixers', de: 'Mischer' }),
              level: 2,
              sortOrder: 5,
            },
            {
              slug: 'rf-attenuators',
              name: ls({ en: 'Attenuators', de: 'Dämpfungsglieder' }),
              level: 2,
              sortOrder: 6,
            },
            {
              slug: 'rf-switches',
              name: ls({ en: 'RF Switches', de: 'HF-Schalter' }),
              level: 2,
              sortOrder: 7,
            },
            {
              slug: 'rf-couplers',
              name: ls({ en: 'Couplers', de: 'Koppler' }),
              level: 2,
              sortOrder: 8,
            },
            {
              slug: 'circulators-isolators',
              name: ls({ en: 'Circulators/Isolators', de: 'Zirkulatoren/Isolatoren' }),
              level: 2,
              sortOrder: 9,
            },
            {
              slug: 'baluns',
              name: ls({ en: 'Baluns', de: 'Baluns' }),
              level: 2,
              sortOrder: 10,
            },
          ],
        },
      ],
    },
  ];

  // ============================================
  // DOMAIN: Sensors
  // ============================================

  const sensorsCategories: CategoryDef[] = [
    {
      slug: 'sensors',
      name: ls({
        en: 'Sensors',
        de: 'Sensoren',
        fr: 'Capteurs',
        es: 'Sensores',
        it: 'Sensori',
      }),
      description: ls({
        en: 'Temperature, pressure, motion, position and environmental sensors',
        de: 'Temperatur-, Druck-, Bewegungs-, Positions- und Umweltsensoren',
      }),
      level: 0,
      sortOrder: 11,
      children: [
        // Family: Temperature Sensors
        {
          slug: 'temperature-sensors',
          name: ls({
            en: 'Temperature Sensors',
            de: 'Temperatursensoren',
            fr: 'Capteurs de température',
          }),
          level: 1,
          sortOrder: 1,
          children: [
            {
              slug: 'thermocouples',
              name: ls({ en: 'Thermocouples', de: 'Thermoelemente' }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'thermocouple-type-k',
                  name: ls({ en: 'Type K', de: 'Typ K' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'thermocouple-type-j',
                  name: ls({ en: 'Type J', de: 'Typ J' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'thermocouple-type-t',
                  name: ls({ en: 'Type T', de: 'Typ T' }),
                  level: 3,
                  sortOrder: 3,
                },
                {
                  slug: 'thermocouple-type-s',
                  name: ls({ en: 'Type S', de: 'Typ S' }),
                  level: 3,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'rtd',
              name: ls({ en: 'RTD', de: 'RTD' }),
              level: 2,
              sortOrder: 2,
              children: [
                {
                  slug: 'pt100',
                  name: ls({ en: 'PT100', de: 'PT100' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'pt1000',
                  name: ls({ en: 'PT1000', de: 'PT1000' }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
            {
              slug: 'digital-temperature-sensors',
              name: ls({ en: 'Digital Temperature Sensors', de: 'Digitale Temperatursensoren' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'analog-temperature-sensors',
              name: ls({ en: 'Analog Temperature Sensors', de: 'Analoge Temperatursensoren' }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'ir-temperature-sensors',
              name: ls({ en: 'IR Temperature Sensors', de: 'IR-Temperatursensoren' }),
              level: 2,
              sortOrder: 5,
            },
          ],
        },
        // Family: Pressure Sensors
        {
          slug: 'pressure-sensors',
          name: ls({
            en: 'Pressure Sensors',
            de: 'Drucksensoren',
            fr: 'Capteurs de pression',
          }),
          level: 1,
          sortOrder: 2,
          children: [
            {
              slug: 'absolute-pressure',
              name: ls({ en: 'Absolute Pressure', de: 'Absolutdruck' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'gauge-pressure',
              name: ls({ en: 'Gauge Pressure', de: 'Relativdruck' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'differential-pressure',
              name: ls({ en: 'Differential Pressure', de: 'Differenzdruck' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'barometric-pressure',
              name: ls({ en: 'Barometric Pressure', de: 'Barometrischer Druck' }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'vacuum-sensors',
              name: ls({ en: 'Vacuum Sensors', de: 'Vakuumsensoren' }),
              level: 2,
              sortOrder: 5,
            },
          ],
        },
        // Family: Motion Sensors
        {
          slug: 'motion-sensors',
          name: ls({
            en: 'Motion Sensors',
            de: 'Bewegungssensoren',
            fr: 'Capteurs de mouvement',
          }),
          level: 1,
          sortOrder: 3,
          children: [
            {
              slug: 'accelerometers',
              name: ls({ en: 'Accelerometers', de: 'Beschleunigungssensoren' }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'single-axis-accelerometer',
                  name: ls({ en: 'Single-Axis', de: 'Einachsig' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'multi-axis-accelerometer',
                  name: ls({ en: 'Multi-Axis', de: 'Mehrachsig' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'mems-accelerometer',
                  name: ls({ en: 'MEMS', de: 'MEMS' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'gyroscopes',
              name: ls({ en: 'Gyroscopes', de: 'Gyroskope' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'imu',
              name: ls({ en: 'IMU', de: 'IMU' }),
              description: ls({ en: 'Inertial Measurement Unit', de: 'Inertiale Messeinheit' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'tilt-sensors',
              name: ls({ en: 'Tilt Sensors', de: 'Neigungssensoren' }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'vibration-sensors',
              name: ls({ en: 'Vibration Sensors', de: 'Vibrationssensoren' }),
              level: 2,
              sortOrder: 5,
            },
            {
              slug: 'shock-sensors',
              name: ls({ en: 'Shock Sensors', de: 'Stoßsensoren' }),
              level: 2,
              sortOrder: 6,
            },
          ],
        },
        // Family: Position Sensors
        {
          slug: 'position-sensors',
          name: ls({
            en: 'Position Sensors',
            de: 'Positionssensoren',
            fr: 'Capteurs de position',
          }),
          level: 1,
          sortOrder: 4,
          children: [
            {
              slug: 'hall-effect-sensors',
              name: ls({ en: 'Hall Effect Sensors', de: 'Hall-Effekt-Sensoren' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'reed-switches',
              name: ls({ en: 'Reed Switches', de: 'Reed-Schalter' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'proximity-sensors',
              name: ls({ en: 'Proximity Sensors', de: 'Näherungssensoren' }),
              level: 2,
              sortOrder: 3,
              children: [
                {
                  slug: 'inductive-proximity',
                  name: ls({ en: 'Inductive', de: 'Induktiv' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'capacitive-proximity',
                  name: ls({ en: 'Capacitive', de: 'Kapazitiv' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'ultrasonic-proximity',
                  name: ls({ en: 'Ultrasonic', de: 'Ultraschall' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'linear-position-sensors',
              name: ls({ en: 'Linear Position Sensors', de: 'Lineare Positionssensoren' }),
              level: 2,
              sortOrder: 4,
              children: [
                {
                  slug: 'lvdt',
                  name: ls({ en: 'LVDT', de: 'LVDT' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'potentiometric',
                  name: ls({ en: 'Potentiometric', de: 'Potentiometrisch' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'magnetostrictive',
                  name: ls({ en: 'Magnetostrictive', de: 'Magnetostriktiv' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'rotary-position-sensors',
              name: ls({ en: 'Rotary Position Sensors', de: 'Rotatorische Positionssensoren' }),
              level: 2,
              sortOrder: 5,
              children: [
                {
                  slug: 'resolvers',
                  name: ls({ en: 'Resolvers', de: 'Resolver' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'synchros',
                  name: ls({ en: 'Synchros', de: 'Synchros' }),
                  level: 3,
                  sortOrder: 2,
                },
              ],
            },
          ],
        },
        // Family: Current Sensors
        {
          slug: 'current-sensors',
          name: ls({
            en: 'Current Sensors',
            de: 'Stromsensoren',
            fr: 'Capteurs de courant',
          }),
          level: 1,
          sortOrder: 5,
          children: [
            {
              slug: 'shunt-based-current',
              name: ls({ en: 'Shunt-Based', de: 'Shunt-basiert' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'hall-effect-current',
              name: ls({ en: 'Hall Effect', de: 'Hall-Effekt' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'rogowski-coils',
              name: ls({ en: 'Rogowski Coils', de: 'Rogowski-Spulen' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'fluxgate-current',
              name: ls({ en: 'Fluxgate', de: 'Fluxgate' }),
              level: 2,
              sortOrder: 4,
            },
          ],
        },
        // Family: Gas Sensors
        {
          slug: 'gas-sensors',
          name: ls({
            en: 'Gas Sensors',
            de: 'Gassensoren',
            fr: 'Capteurs de gaz',
          }),
          level: 1,
          sortOrder: 6,
          children: [
            {
              slug: 'co2-sensors',
              name: ls({ en: 'CO2 Sensors', de: 'CO2-Sensoren' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'co-sensors',
              name: ls({ en: 'CO Sensors', de: 'CO-Sensoren' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'voc-sensors',
              name: ls({ en: 'VOC Sensors', de: 'VOC-Sensoren' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'oxygen-sensors',
              name: ls({ en: 'Oxygen Sensors', de: 'Sauerstoffsensoren' }),
              level: 2,
              sortOrder: 4,
            },
            {
              slug: 'methane-sensors',
              name: ls({ en: 'Methane Sensors', de: 'Methan-Sensoren' }),
              level: 2,
              sortOrder: 5,
            },
            {
              slug: 'smoke-detectors',
              name: ls({ en: 'Smoke Detectors', de: 'Rauchmelder' }),
              level: 2,
              sortOrder: 6,
            },
          ],
        },
        // Family: Humidity Sensors
        {
          slug: 'humidity-sensors',
          name: ls({
            en: 'Humidity Sensors',
            de: 'Feuchtesensoren',
            fr: 'Capteurs d\'humidité',
          }),
          level: 1,
          sortOrder: 7,
          children: [
            {
              slug: 'capacitive-humidity',
              name: ls({ en: 'Capacitive Humidity', de: 'Kapazitive Feuchte' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'resistive-humidity',
              name: ls({ en: 'Resistive Humidity', de: 'Resistive Feuchte' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'thermal-humidity',
              name: ls({ en: 'Thermal Humidity', de: 'Thermische Feuchte' }),
              level: 2,
              sortOrder: 3,
            },
          ],
        },
        // Family: Flow Sensors
        {
          slug: 'flow-sensors',
          name: ls({
            en: 'Flow Sensors',
            de: 'Durchflusssensoren',
            fr: 'Capteurs de débit',
          }),
          level: 1,
          sortOrder: 8,
          children: [
            {
              slug: 'mass-flow',
              name: ls({ en: 'Mass Flow', de: 'Massendurchfluss' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'volumetric-flow',
              name: ls({ en: 'Volumetric Flow', de: 'Volumendurchfluss' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'differential-pressure-flow',
              name: ls({ en: 'Differential Pressure Flow', de: 'Differenzdruck-Durchfluss' }),
              level: 2,
              sortOrder: 3,
            },
          ],
        },
      ],
    },
  ];

  // ============================================
  // DOMAIN: Power Supplies & Energy
  // ============================================

  const powerCategories: CategoryDef[] = [
    {
      slug: 'power-energy',
      name: ls({
        en: 'Power Supplies & Energy',
        de: 'Stromversorgung & Energie',
        fr: 'Alimentations et énergie',
        es: 'Fuentes de alimentación y energía',
      }),
      description: ls({
        en: 'Power supplies, batteries, solar and energy storage',
        de: 'Netzteile, Batterien, Solar und Energiespeicher',
      }),
      level: 0,
      sortOrder: 12,
      children: [
        // Family: Power Supplies
        {
          slug: 'power-supplies',
          name: ls({
            en: 'Power Supplies',
            de: 'Netzteile',
            fr: 'Alimentations',
          }),
          level: 1,
          sortOrder: 1,
          children: [
            {
              slug: 'ac-dc-power-supplies',
              name: ls({ en: 'AC-DC Power Supplies', de: 'AC-DC-Netzteile' }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'open-frame-psu',
                  name: ls({ en: 'Open Frame', de: 'Offen' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'enclosed-psu',
                  name: ls({ en: 'Enclosed', de: 'Geschlossen' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'din-rail-psu',
                  name: ls({ en: 'DIN Rail', de: 'DIN-Schiene' }),
                  level: 3,
                  sortOrder: 3,
                },
                {
                  slug: 'external-wall-adapter',
                  name: ls({ en: 'External/Wall Adapter', de: 'Steckernetzteil' }),
                  level: 3,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'dc-dc-power-supplies',
              name: ls({ en: 'DC-DC Power Supplies', de: 'DC-DC-Wandler' }),
              level: 2,
              sortOrder: 2,
              children: [
                {
                  slug: 'isolated-dc-dc',
                  name: ls({ en: 'Isolated', de: 'Galvanisch getrennt' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'non-isolated-dc-dc',
                  name: ls({ en: 'Non-Isolated', de: 'Nicht galvanisch getrennt' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'pol-dc-dc',
                  name: ls({ en: 'POL', de: 'POL' }),
                  description: ls({ en: 'Point-of-Load', de: 'Point-of-Load' }),
                  level: 3,
                  sortOrder: 3,
                },
              ],
            },
            {
              slug: 'programmable-power-supplies',
              name: ls({ en: 'Programmable Power Supplies', de: 'Programmierbare Netzteile' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'redundant-power',
              name: ls({ en: 'Redundant Power', de: 'Redundante Versorgung' }),
              level: 2,
              sortOrder: 4,
            },
          ],
        },
        // Family: Batteries
        {
          slug: 'batteries',
          name: ls({
            en: 'Batteries',
            de: 'Batterien',
            fr: 'Batteries',
            es: 'Baterías',
          }),
          level: 1,
          sortOrder: 2,
          children: [
            {
              slug: 'primary-batteries',
              name: ls({ en: 'Primary Batteries', de: 'Primärbatterien' }),
              level: 2,
              sortOrder: 1,
              children: [
                {
                  slug: 'alkaline-batteries',
                  name: ls({ en: 'Alkaline', de: 'Alkaline' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'lithium-primary',
                  name: ls({ en: 'Lithium Primary', de: 'Lithium Primär' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'zinc-carbon',
                  name: ls({ en: 'Zinc-Carbon', de: 'Zink-Kohle' }),
                  level: 3,
                  sortOrder: 3,
                },
                {
                  slug: 'silver-oxide',
                  name: ls({ en: 'Silver Oxide', de: 'Silberoxid' }),
                  level: 3,
                  sortOrder: 4,
                },
              ],
            },
            {
              slug: 'rechargeable-batteries',
              name: ls({ en: 'Rechargeable Batteries', de: 'Wiederaufladbare Batterien' }),
              level: 2,
              sortOrder: 2,
              children: [
                {
                  slug: 'li-ion',
                  name: ls({ en: 'Li-Ion', de: 'Li-Ion' }),
                  level: 3,
                  sortOrder: 1,
                },
                {
                  slug: 'li-po',
                  name: ls({ en: 'Li-Po', de: 'Li-Po' }),
                  level: 3,
                  sortOrder: 2,
                },
                {
                  slug: 'lifepo4',
                  name: ls({ en: 'LiFePO4', de: 'LiFePO4' }),
                  level: 3,
                  sortOrder: 3,
                },
                {
                  slug: 'nimh',
                  name: ls({ en: 'NiMH', de: 'NiMH' }),
                  level: 3,
                  sortOrder: 4,
                },
                {
                  slug: 'nicd',
                  name: ls({ en: 'NiCd', de: 'NiCd' }),
                  description: ls({ en: 'Historical', de: 'Historisch' }),
                  level: 3,
                  sortOrder: 5,
                },
                {
                  slug: 'lead-acid',
                  name: ls({ en: 'Lead-Acid', de: 'Blei-Säure' }),
                  level: 3,
                  sortOrder: 6,
                },
              ],
            },
            {
              slug: 'battery-packs',
              name: ls({ en: 'Battery Packs', de: 'Batteriepacks' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'coin-cells',
              name: ls({ en: 'Coin Cells', de: 'Knopfzellen' }),
              level: 2,
              sortOrder: 4,
            },
          ],
        },
        // Family: Battery Accessories
        {
          slug: 'battery-accessories',
          name: ls({
            en: 'Battery Accessories',
            de: 'Batterie-Zubehör',
            fr: 'Accessoires de batterie',
          }),
          level: 1,
          sortOrder: 3,
          children: [
            {
              slug: 'battery-holders',
              name: ls({ en: 'Battery Holders', de: 'Batteriehalter' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'battery-chargers',
              name: ls({ en: 'Battery Chargers', de: 'Batterieladegeräte' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'battery-connectors',
              name: ls({ en: 'Battery Connectors', de: 'Batteriestecker' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'bms-modules',
              name: ls({ en: 'BMS Modules', de: 'BMS-Module' }),
              description: ls({ en: 'Battery Management System', de: 'Batterie-Management-System' }),
              level: 2,
              sortOrder: 4,
            },
          ],
        },
        // Family: Solar
        {
          slug: 'solar',
          name: ls({
            en: 'Solar',
            de: 'Solar',
            fr: 'Solaire',
            es: 'Solar',
          }),
          level: 1,
          sortOrder: 4,
          children: [
            {
              slug: 'solar-panels',
              name: ls({ en: 'Solar Panels', de: 'Solarmodule' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'solar-cells',
              name: ls({ en: 'Solar Cells', de: 'Solarzellen' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'mppt-controllers',
              name: ls({ en: 'MPPT Controllers', de: 'MPPT-Regler' }),
              level: 2,
              sortOrder: 3,
            },
            {
              slug: 'charge-controllers',
              name: ls({ en: 'Charge Controllers', de: 'Laderegler' }),
              level: 2,
              sortOrder: 4,
            },
          ],
        },
        // Family: Supercapacitors
        {
          slug: 'supercapacitors',
          name: ls({
            en: 'Supercapacitors',
            de: 'Superkondensatoren',
            fr: 'Supercondensateurs',
          }),
          level: 1,
          sortOrder: 5,
          children: [
            {
              slug: 'edlc',
              name: ls({ en: 'EDLC', de: 'EDLC' }),
              description: ls({ en: 'Electric Double-Layer Capacitor', de: 'Elektrischer Doppelschicht-Kondensator' }),
              level: 2,
              sortOrder: 1,
            },
            {
              slug: 'hybrid-supercapacitors',
              name: ls({ en: 'Hybrid Supercapacitors', de: 'Hybrid-Superkondensatoren' }),
              level: 2,
              sortOrder: 2,
            },
            {
              slug: 'supercapacitor-modules',
              name: ls({ en: 'Supercapacitor Modules', de: 'Superkondensator-Module' }),
              level: 2,
              sortOrder: 3,
            },
          ],
        },
      ],
    },
  ];

  // Create all category trees
  const rfMap = await createCategoryTree(prisma, rfWirelessCategories);
  const sensorsMap = await createCategoryTree(prisma, sensorsCategories);
  const powerMap = await createCategoryTree(prisma, powerCategories);

  // ============================================
  // ATTRIBUTES
  // ============================================
  console.log('📋 Seeding attributes...');

  // RF Modules Attributes
  const rfModulesId = rfMap.get('rf-modules');
  if (rfModulesId) {
    const rfModuleAttrs: AttributeDef[] = [
      {
        name: 'frequency',
        displayName: ls({ en: 'Frequency', de: 'Frequenz' }),
        unit: 'Hz',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 1,
      },
      {
        name: 'protocol',
        displayName: ls({ en: 'Protocol', de: 'Protokoll' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedValues: [
          'Bluetooth',
          'WiFi',
          'Zigbee',
          'LoRa',
          'LoRaWAN',
          'Z-Wave',
          'Thread',
          'Matter',
          '6LoWPAN',
          'NFC',
          'RFID',
          'GPS',
          'GNSS',
          'GSM',
          'GPRS',
          '3G',
          'LTE',
          '5G',
          'NB-IoT',
          'Cat-M1',
        ],
        sortOrder: 2,
      },
      {
        name: 'transmit_power',
        displayName: ls({ en: 'Transmit Power', de: 'Sendeleistung' }),
        unit: 'dBm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 3,
      },
      {
        name: 'receiver_sensitivity',
        displayName: ls({ en: 'Receiver Sensitivity', de: 'Empfängerempfindlichkeit' }),
        unit: 'dBm',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        allowedPrefixes: ['-'],
        sortOrder: 4,
      },
      {
        name: 'data_rate',
        displayName: ls({ en: 'Data Rate', de: 'Datenrate' }),
        unit: 'bps',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 5,
      },
      {
        name: 'antenna_type',
        displayName: ls({ en: 'Antenna Type', de: 'Antennentyp' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedValues: ['Internal', 'External', 'U.FL', 'IPEX', 'SMA', 'None'],
        sortOrder: 6,
      },
    ];
    await createAttributes(prisma, rfModulesId, rfModuleAttrs);
  }

  // Antennas Attributes
  const antennasId = rfMap.get('antennas');
  if (antennasId) {
    const antennaAttrs: AttributeDef[] = [
      {
        name: 'frequency_range',
        displayName: ls({ en: 'Frequency Range', de: 'Frequenzbereich' }),
        unit: 'Hz',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k', 'M', 'G'],
        sortOrder: 1,
      },
      {
        name: 'gain',
        displayName: ls({ en: 'Gain', de: 'Gewinn' }),
        unit: 'dBi',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'vswr',
        displayName: ls({ en: 'VSWR', de: 'VSWR' }),
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        allowedPrefixes: ['-'],
        sortOrder: 3,
      },
      {
        name: 'polarization',
        displayName: ls({ en: 'Polarization', de: 'Polarisation' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedValues: ['Linear', 'Circular', 'Elliptical', 'RHCP', 'LHCP'],
        sortOrder: 4,
      },
      {
        name: 'connector',
        displayName: ls({ en: 'Connector', de: 'Stecker' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedValues: ['SMA', 'U.FL', 'IPEX', 'N-Type', 'RP-SMA', 'BNC', 'TNC', 'MCX', 'MMCX', 'None'],
        sortOrder: 5,
      },
    ];
    await createAttributes(prisma, antennasId, antennaAttrs);
  }

  // Temperature Sensors Attributes
  const tempSensorsId = sensorsMap.get('temperature-sensors');
  if (tempSensorsId) {
    const tempSensorAttrs: AttributeDef[] = [
      {
        name: 'temperature_range',
        displayName: ls({ en: 'Temperature Range', de: 'Temperaturbereich' }),
        unit: '°C',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'accuracy',
        displayName: ls({ en: 'Accuracy', de: 'Genauigkeit' }),
        unit: '°C',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'response_time',
        displayName: ls({ en: 'Response Time', de: 'Ansprechzeit' }),
        unit: 'ms',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        allowedPrefixes: ['-'],
        sortOrder: 3,
      },
      {
        name: 'output_type',
        displayName: ls({ en: 'Output Type', de: 'Ausgabetyp' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedValues: ['Analog', 'Digital', 'I2C', 'SPI', 'UART', '1-Wire', 'PWM', 'Thermocouple', 'RTD'],
        sortOrder: 4,
      },
    ];
    await createAttributes(prisma, tempSensorsId, tempSensorAttrs);
  }

  // Pressure Sensors Attributes
  const pressureSensorsId = sensorsMap.get('pressure-sensors');
  if (pressureSensorsId) {
    const pressureSensorAttrs: AttributeDef[] = [
      {
        name: 'pressure_range',
        displayName: ls({ en: 'Pressure Range', de: 'Druckbereich' }),
        unit: 'Pa',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k', 'M'],
        sortOrder: 1,
      },
      {
        name: 'accuracy',
        displayName: ls({ en: 'Accuracy', de: 'Genauigkeit' }),
        unit: '%',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'output_type',
        displayName: ls({ en: 'Output Type', de: 'Ausgabetyp' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.PART,
        isFilterable: true,
        allowedValues: ['Analog', 'Digital', 'I2C', 'SPI', 'UART', '4-20mA'],
        sortOrder: 3,
      },
      {
        name: 'media_compatibility',
        displayName: ls({ en: 'Media Compatibility', de: 'Medienverträglichkeit' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.PART,
        isFilterable: false,
        sortOrder: 4,
      },
    ];
    await createAttributes(prisma, pressureSensorsId, pressureSensorAttrs);
  }

  // Motion Sensors Attributes
  const motionSensorsId = sensorsMap.get('motion-sensors');
  if (motionSensorsId) {
    const motionSensorAttrs: AttributeDef[] = [
      {
        name: 'range',
        displayName: ls({ en: 'Range', de: 'Bereich' }),
        unit: 'g',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 1,
      },
      {
        name: 'sensitivity',
        displayName: ls({ en: 'Sensitivity', de: 'Empfindlichkeit' }),
        unit: 'LSB/g',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: false,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'bandwidth',
        displayName: ls({ en: 'Bandwidth', de: 'Bandbreite' }),
        unit: 'Hz',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 3,
      },
      {
        name: 'axes',
        displayName: ls({ en: 'Axes', de: 'Achsen' }),
        dataType: AttributeDataType.INTEGER,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        sortOrder: 4,
      },
    ];
    await createAttributes(prisma, motionSensorsId, motionSensorAttrs);
  }

  // Power Supplies Attributes
  const powerSuppliesId = powerMap.get('power-supplies');
  if (powerSuppliesId) {
    const powerSupplyAttrs: AttributeDef[] = [
      {
        name: 'input_voltage_range',
        displayName: ls({ en: 'Input Voltage Range', de: 'Eingangsspannungsbereich' }),
        unit: 'V',
        dataType: AttributeDataType.RANGE,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 1,
      },
      {
        name: 'output_voltage',
        displayName: ls({ en: 'Output Voltage', de: 'Ausgangsspannung' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isLabel: true,
        allowedPrefixes: ['-', 'k'],
        sortOrder: 2,
      },
      {
        name: 'output_current',
        displayName: ls({ en: 'Output Current', de: 'Ausgangsstrom' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isLabel: true,
        allowedPrefixes: ['-', 'm', 'µ'],
        sortOrder: 3,
      },
      {
        name: 'efficiency',
        displayName: ls({ en: 'Efficiency', de: 'Wirkungsgrad' }),
        unit: '%',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-'],
        sortOrder: 4,
      },
      {
        name: 'topology',
        displayName: ls({ en: 'Topology', de: 'Topologie' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.PART,
        isFilterable: false,
        sortOrder: 5,
      },
    ];
    await createAttributes(prisma, powerSuppliesId, powerSupplyAttrs);
  }

  // Batteries Attributes
  const batteriesId = powerMap.get('batteries');
  if (batteriesId) {
    const batteryAttrs: AttributeDef[] = [
      {
        name: 'chemistry',
        displayName: ls({ en: 'Chemistry', de: 'Chemie' }),
        dataType: AttributeDataType.STRING,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedValues: [
          'Alkaline',
          'Li-Ion',
          'Li-Po',
          'LiFePO4',
          'NiMH',
          'NiCd',
          'Lead-Acid',
          'Zinc-Carbon',
          'Silver-Oxide',
          'Lithium',
        ],
        sortOrder: 1,
      },
      {
        name: 'nominal_voltage',
        displayName: ls({ en: 'Nominal Voltage', de: 'Nennspannung' }),
        unit: 'V',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isLabel: true,
        allowedPrefixes: ['-'],
        sortOrder: 2,
      },
      {
        name: 'capacity',
        displayName: ls({ en: 'Capacity', de: 'Kapazität' }),
        unit: 'Ah',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        isLabel: true,
        allowedPrefixes: ['-', 'm'],
        sortOrder: 3,
      },
      {
        name: 'max_discharge_current',
        displayName: ls({ en: 'Max Discharge Current', de: 'Max. Entladestrom' }),
        unit: 'A',
        dataType: AttributeDataType.DECIMAL,
        scope: AttributeScope.COMPONENT,
        isFilterable: true,
        allowedPrefixes: ['-', 'm', 'µ'],
        sortOrder: 4,
      },
      {
        name: 'cycle_life',
        displayName: ls({ en: 'Cycle Life', de: 'Lebensdauer (Zyklen)' }),
        dataType: AttributeDataType.INTEGER,
        scope: AttributeScope.PART,
        isFilterable: false,
        sortOrder: 5,
      },
    ];
    await createAttributes(prisma, batteriesId, batteryAttrs);
  }

  console.log('✅ RF/Wireless, Sensors and Power Components seeding complete');
}
