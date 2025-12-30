// ElectroVault - Electromechanical Components Seed

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
 * Seed-Funktion für Electromechanical Components
 */
export async function seedElectromechanical(prisma: PrismaClient): Promise<void> {
  console.log('📦 Seeding Electromechanical Components...');

  // ========================================
  // Kategorie-Hierarchie
  // ========================================

  const categories: CategoryDef[] = [
    {
      slug: 'electromechanical',
      name: ls({ de: 'Elektromechanische Bauteile', en: 'Electromechanical Components' }),
      description: ls({
        de: 'Elektromechanische Komponenten wie Steckverbinder, Relais, Schalter und Motoren',
        en: 'Electromechanical components such as connectors, relays, switches and motors',
      }),
      level: 1,
      sortOrder: 40,
      children: [
        // ========================================
        // Family: Connectors
        // ========================================
        {
          slug: 'connectors',
          name: ls({ de: 'Steckverbinder', en: 'Connectors' }),
          description: ls({
            de: 'Steckverbinder und Buchsen für elektrische Verbindungen',
            en: 'Connectors and sockets for electrical connections',
          }),
          level: 2,
          sortOrder: 10,
          children: [
            // PCB Connectors
            {
              slug: 'pcb-connectors',
              name: ls({ de: 'Leiterplatten-Steckverbinder', en: 'PCB Connectors' }),
              level: 3,
              sortOrder: 10,
              children: [
                {
                  slug: 'pin-headers',
                  name: ls({ de: 'Stiftleisten', en: 'Pin Headers' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'socket-headers',
                  name: ls({ de: 'Buchsenleisten', en: 'Socket Headers' }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'card-edge',
                  name: ls({ de: 'Kartenrand-Stecker', en: 'Card Edge Connectors' }),
                  level: 4,
                  sortOrder: 30,
                },
                {
                  slug: 'fpc-ffc',
                  name: ls({ de: 'FPC/FFC-Stecker', en: 'FPC/FFC Connectors' }),
                  description: ls({
                    de: 'Flexible Printed Circuit / Flat Flex Cable',
                    en: 'Flexible Printed Circuit / Flat Flex Cable',
                  }),
                  level: 4,
                  sortOrder: 40,
                },
                {
                  slug: 'board-to-board',
                  name: ls({ de: 'Board-to-Board', en: 'Board-to-Board Connectors' }),
                  level: 4,
                  sortOrder: 50,
                },
              ],
            },
            // Wire-to-Wire
            {
              slug: 'wire-to-wire',
              name: ls({ de: 'Kabel-zu-Kabel', en: 'Wire-to-Wire Connectors' }),
              level: 3,
              sortOrder: 20,
            },
            // Wire-to-Board
            {
              slug: 'wire-to-board',
              name: ls({ de: 'Kabel-zu-Platine', en: 'Wire-to-Board Connectors' }),
              level: 3,
              sortOrder: 30,
            },
            // Circular Connectors
            {
              slug: 'circular-connectors',
              name: ls({ de: 'Rundstecker', en: 'Circular Connectors' }),
              level: 3,
              sortOrder: 40,
              children: [
                {
                  slug: 'din-connectors',
                  name: ls({ de: 'DIN-Stecker', en: 'DIN Connectors' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'm8-m12',
                  name: ls({ de: 'M8/M12-Stecker', en: 'M8/M12 Connectors' }),
                  description: ls({
                    de: 'Industrielle Rundstecker',
                    en: 'Industrial circular connectors',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'mil-spec-circular',
                  name: ls({ de: 'MIL-Spec Rundstecker', en: 'MIL-Spec Circular Connectors' }),
                  description: ls({
                    de: 'Militär-Spezifikation Rundstecker',
                    en: 'Military specification circular connectors',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            // D-Sub Connectors
            {
              slug: 'd-sub-connectors',
              name: ls({ de: 'D-Sub-Stecker', en: 'D-Sub Connectors' }),
              description: ls({
                de: 'D-Subminiatur-Stecker (D-Sub)',
                en: 'D-Subminiature connectors (D-Sub)',
              }),
              level: 3,
              sortOrder: 50,
              children: [
                {
                  slug: 'db9',
                  name: ls({ de: 'DB9', en: 'DB9' }),
                  description: ls({
                    de: '9-poliger D-Sub-Stecker (RS-232)',
                    en: '9-pin D-Sub connector (RS-232)',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'db15',
                  name: ls({ de: 'DB15', en: 'DB15' }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'db25',
                  name: ls({ de: 'DB25', en: 'DB25' }),
                  description: ls({
                    de: '25-poliger D-Sub-Stecker (Parallel-Port)',
                    en: '25-pin D-Sub connector (Parallel port)',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
                {
                  slug: 'hd15-vga',
                  name: ls({ de: 'HD15 (VGA)', en: 'HD15 (VGA)' }),
                  description: ls({
                    de: '15-poliger High-Density VGA-Stecker',
                    en: '15-pin high-density VGA connector',
                  }),
                  level: 4,
                  sortOrder: 40,
                },
              ],
            },
            // Coaxial Connectors
            {
              slug: 'coaxial-connectors',
              name: ls({ de: 'Koaxialstecker', en: 'Coaxial Connectors' }),
              description: ls({
                de: 'Steckverbinder für Koaxialkabel (HF)',
                en: 'Connectors for coaxial cables (RF)',
              }),
              level: 3,
              sortOrder: 60,
              children: [
                {
                  slug: 'bnc',
                  name: ls({ de: 'BNC', en: 'BNC' }),
                  description: ls({
                    de: 'Bayonet Neill-Concelman',
                    en: 'Bayonet Neill-Concelman',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'sma',
                  name: ls({ de: 'SMA', en: 'SMA' }),
                  description: ls({
                    de: 'SubMiniature version A',
                    en: 'SubMiniature version A',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'n-type',
                  name: ls({ de: 'N-Typ', en: 'N-Type' }),
                  level: 4,
                  sortOrder: 30,
                },
                {
                  slug: 'f-type',
                  name: ls({ de: 'F-Typ', en: 'F-Type' }),
                  description: ls({
                    de: 'TV-Antennenstecker',
                    en: 'TV antenna connector',
                  }),
                  level: 4,
                  sortOrder: 40,
                },
                {
                  slug: 'mcx-mmcx',
                  name: ls({ de: 'MCX/MMCX', en: 'MCX/MMCX' }),
                  description: ls({
                    de: 'Miniatur-Koaxialstecker',
                    en: 'Miniature coaxial connectors',
                  }),
                  level: 4,
                  sortOrder: 50,
                },
                {
                  slug: 'uhf',
                  name: ls({ de: 'UHF (PL-259)', en: 'UHF (PL-259)' }),
                  level: 4,
                  sortOrder: 60,
                },
              ],
            },
            // Power Connectors
            {
              slug: 'power-connectors',
              name: ls({ de: 'Stromstecker', en: 'Power Connectors' }),
              level: 3,
              sortOrder: 70,
              children: [
                {
                  slug: 'barrel-jacks',
                  name: ls({ de: 'Hohlstecker', en: 'Barrel Jacks' }),
                  description: ls({
                    de: 'DC-Hohlstecker (2.1mm, 2.5mm, 5.5mm)',
                    en: 'DC barrel jacks (2.1mm, 2.5mm, 5.5mm)',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'anderson-powerpole',
                  name: ls({ de: 'Anderson PowerPole', en: 'Anderson PowerPole' }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'xt-connectors',
                  name: ls({ de: 'XT-Stecker', en: 'XT Connectors' }),
                  description: ls({
                    de: 'XT30, XT60, XT90 Hochstromstecker',
                    en: 'XT30, XT60, XT90 high-current connectors',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
                {
                  slug: 'molex',
                  name: ls({ de: 'Molex', en: 'Molex Connectors' }),
                  description: ls({
                    de: 'Molex KK, Mini-Fit etc.',
                    en: 'Molex KK, Mini-Fit etc.',
                  }),
                  level: 4,
                  sortOrder: 40,
                },
                {
                  slug: 'iec-c13-c14',
                  name: ls({ de: 'IEC C13/C14', en: 'IEC C13/C14' }),
                  description: ls({
                    de: 'Kaltgerätestecker/-buchse',
                    en: 'IEC power inlet/plug',
                  }),
                  level: 4,
                  sortOrder: 50,
                },
              ],
            },
            // Audio Connectors
            {
              slug: 'audio-connectors',
              name: ls({ de: 'Audio-Stecker', en: 'Audio Connectors' }),
              level: 3,
              sortOrder: 80,
              children: [
                {
                  slug: 'jack-3-5mm',
                  name: ls({ de: '3,5mm Klinkenstecker', en: '3.5mm Jack' }),
                  description: ls({
                    de: 'Mini-Klinkenstecker (TRS)',
                    en: 'Mini jack (TRS)',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'jack-6-35mm',
                  name: ls({ de: '6,35mm Klinkenstecker', en: '6.35mm Jack' }),
                  description: ls({
                    de: 'Standard-Klinkenstecker (TRS)',
                    en: 'Standard jack (TRS)',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'xlr',
                  name: ls({ de: 'XLR', en: 'XLR' }),
                  description: ls({
                    de: 'Professioneller Audio-Stecker (3-5-polig)',
                    en: 'Professional audio connector (3-5-pin)',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
                {
                  slug: 'rca',
                  name: ls({ de: 'Cinch (RCA)', en: 'RCA' }),
                  description: ls({
                    de: 'Cinch-Stecker (Phono)',
                    en: 'RCA connector (Phono)',
                  }),
                  level: 4,
                  sortOrder: 40,
                },
                {
                  slug: 'speakon',
                  name: ls({ de: 'Speakon', en: 'Speakon' }),
                  description: ls({
                    de: 'Neutrik Speakon (Lautsprecher)',
                    en: 'Neutrik Speakon (Speaker)',
                  }),
                  level: 4,
                  sortOrder: 50,
                },
              ],
            },
            // USB Connectors
            {
              slug: 'usb-connectors',
              name: ls({ de: 'USB-Stecker', en: 'USB Connectors' }),
              level: 3,
              sortOrder: 90,
              children: [
                {
                  slug: 'usb-a',
                  name: ls({ de: 'USB-A', en: 'USB-A' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'usb-b',
                  name: ls({ de: 'USB-B', en: 'USB-B' }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'usb-c',
                  name: ls({ de: 'USB-C', en: 'USB-C' }),
                  level: 4,
                  sortOrder: 30,
                },
                {
                  slug: 'micro-usb',
                  name: ls({ de: 'Micro-USB', en: 'Micro-USB' }),
                  level: 4,
                  sortOrder: 40,
                },
                {
                  slug: 'mini-usb',
                  name: ls({ de: 'Mini-USB', en: 'Mini-USB' }),
                  level: 4,
                  sortOrder: 50,
                },
              ],
            },
            // HDMI/DisplayPort
            {
              slug: 'hdmi-displayport',
              name: ls({ de: 'HDMI/DisplayPort', en: 'HDMI/DisplayPort' }),
              description: ls({
                de: 'Digitale Video-Schnittstellen',
                en: 'Digital video interfaces',
              }),
              level: 3,
              sortOrder: 100,
            },
            // Modular/RJ Connectors
            {
              slug: 'modular-rj',
              name: ls({ de: 'Modularstecker (RJ)', en: 'Modular/RJ Connectors' }),
              level: 3,
              sortOrder: 110,
              children: [
                {
                  slug: 'rj11',
                  name: ls({ de: 'RJ11', en: 'RJ11' }),
                  description: ls({
                    de: 'Telefon-Stecker (4P4C/6P4C)',
                    en: 'Telephone connector (4P4C/6P4C)',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'rj45',
                  name: ls({ de: 'RJ45', en: 'RJ45' }),
                  description: ls({
                    de: 'Ethernet-Stecker (8P8C)',
                    en: 'Ethernet connector (8P8C)',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'rj12',
                  name: ls({ de: 'RJ12', en: 'RJ12' }),
                  description: ls({
                    de: '6P6C Modularstecker',
                    en: '6P6C modular connector',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            // Terminal Blocks
            {
              slug: 'terminal-blocks',
              name: ls({ de: 'Klemmleisten', en: 'Terminal Blocks' }),
              level: 3,
              sortOrder: 120,
              children: [
                {
                  slug: 'screw-terminals',
                  name: ls({ de: 'Schraubklemmen', en: 'Screw Terminals' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'spring-terminals',
                  name: ls({ de: 'Federklemmen', en: 'Spring Terminals' }),
                  description: ls({
                    de: 'Werkzeuglose Klemmleisten (WAGO-Klemme)',
                    en: 'Tool-free terminal blocks (WAGO-type)',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'pluggable-terminals',
                  name: ls({ de: 'Steckbare Klemmen', en: 'Pluggable Terminals' }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            // IC Sockets
            {
              slug: 'ic-sockets',
              name: ls({ de: 'IC-Sockel', en: 'IC Sockets' }),
              level: 3,
              sortOrder: 130,
              children: [
                {
                  slug: 'dip-sockets',
                  name: ls({ de: 'DIP-Sockel', en: 'DIP Sockets' }),
                  description: ls({
                    de: 'Dual In-line Package Sockel',
                    en: 'Dual In-line Package sockets',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'plcc-sockets',
                  name: ls({ de: 'PLCC-Sockel', en: 'PLCC Sockets' }),
                  description: ls({
                    de: 'Plastic Leaded Chip Carrier',
                    en: 'Plastic Leaded Chip Carrier',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'zif-sockets',
                  name: ls({ de: 'ZIF-Sockel', en: 'ZIF Sockets' }),
                  description: ls({
                    de: 'Zero Insertion Force',
                    en: 'Zero Insertion Force',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            // Banana Plugs/Jacks
            {
              slug: 'banana-plugs',
              name: ls({ de: 'Bananenstecker', en: 'Banana Plugs/Jacks' }),
              description: ls({
                de: '4mm Bananenstecker und -buchsen',
                en: '4mm banana plugs and jacks',
              }),
              level: 3,
              sortOrder: 140,
            },
          ],
        },

        // ========================================
        // Family: Relays
        // ========================================
        {
          slug: 'relays',
          name: ls({ de: 'Relais', en: 'Relays' }),
          description: ls({
            de: 'Elektromagnetische und Halbleiter-Relais',
            en: 'Electromagnetic and solid-state relays',
          }),
          level: 2,
          sortOrder: 20,
          children: [
            // Electromechanical Relays
            {
              slug: 'electromechanical-relays',
              name: ls({ de: 'Elektromagnetische Relais', en: 'Electromechanical Relays' }),
              level: 3,
              sortOrder: 10,
              children: [
                {
                  slug: 'signal-relays',
                  name: ls({ de: 'Signalrelais', en: 'Signal Relays' }),
                  description: ls({
                    de: 'Relais für Kleinspannungen und -ströme',
                    en: 'Relays for low voltage and current',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'power-relays',
                  name: ls({ de: 'Leistungsrelais', en: 'Power Relays' }),
                  description: ls({
                    de: 'Relais für hohe Ströme (>5A)',
                    en: 'Relays for high currents (>5A)',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'latching-relays',
                  name: ls({ de: 'Bistabile Relais', en: 'Latching Relays' }),
                  description: ls({
                    de: 'Relais mit magnetischer Verriegelung',
                    en: 'Relays with magnetic latching',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
                {
                  slug: 'automotive-relays',
                  name: ls({ de: 'KFZ-Relais', en: 'Automotive Relays' }),
                  level: 4,
                  sortOrder: 40,
                },
                {
                  slug: 'reed-relays',
                  name: ls({ de: 'Reed-Relais', en: 'Reed Relays' }),
                  description: ls({
                    de: 'Relais mit Reed-Kontakt',
                    en: 'Relays with reed contact',
                  }),
                  level: 4,
                  sortOrder: 50,
                },
                {
                  slug: 'time-delay-relays',
                  name: ls({ de: 'Zeitrelais', en: 'Time Delay Relays' }),
                  level: 4,
                  sortOrder: 60,
                },
              ],
            },
            // Solid State Relays
            {
              slug: 'solid-state-relays',
              name: ls({ de: 'Halbleiter-Relais', en: 'Solid State Relays' }),
              description: ls({
                de: 'SSR - ohne mechanische Kontakte',
                en: 'SSR - without mechanical contacts',
              }),
              level: 3,
              sortOrder: 20,
              children: [
                {
                  slug: 'ac-ssr',
                  name: ls({ de: 'AC-SSR', en: 'AC SSR' }),
                  description: ls({
                    de: 'Halbleiterrelais für Wechselstrom',
                    en: 'Solid state relays for AC',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'dc-ssr',
                  name: ls({ de: 'DC-SSR', en: 'DC SSR' }),
                  description: ls({
                    de: 'Halbleiterrelais für Gleichstrom',
                    en: 'Solid state relays for DC',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'photomos',
                  name: ls({ de: 'PhotoMOS', en: 'PhotoMOS' }),
                  description: ls({
                    de: 'MOSFET-basierte Optokoppler',
                    en: 'MOSFET-based optocouplers',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            // Optocouplers
            {
              slug: 'optocouplers',
              name: ls({ de: 'Optokoppler', en: 'Optocouplers' }),
              description: ls({
                de: 'Galvanische Trennung durch Licht',
                en: 'Galvanic isolation through light',
              }),
              level: 3,
              sortOrder: 30,
              children: [
                {
                  slug: 'phototransistor-output',
                  name: ls({ de: 'Phototransistor-Ausgang', en: 'Phototransistor Output' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'phototriac-output',
                  name: ls({ de: 'Phototriac-Ausgang', en: 'Phototriac Output' }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'logic-output',
                  name: ls({ de: 'Logik-Ausgang', en: 'Logic Output' }),
                  description: ls({
                    de: 'Digital-Optokoppler mit TTL/CMOS-Ausgang',
                    en: 'Digital optocouplers with TTL/CMOS output',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            // Contactors
            {
              slug: 'contactors',
              name: ls({ de: 'Schütze', en: 'Contactors' }),
              description: ls({
                de: 'Hochstrom-Schaltgeräte (>40A)',
                en: 'High-current switching devices (>40A)',
              }),
              level: 3,
              sortOrder: 40,
            },
            // Mercury Relays (historical)
            {
              slug: 'mercury-relays',
              name: ls({ de: 'Quecksilber-Relais', en: 'Mercury Relays' }),
              description: ls({
                de: 'Historisch - Quecksilberkontakte (Gefahrstoff)',
                en: 'Historical - Mercury contacts (hazardous)',
              }),
              level: 3,
              sortOrder: 50,
            },
            // Thermal Relays
            {
              slug: 'thermal-relays',
              name: ls({ de: 'Thermische Relais', en: 'Thermal Relays' }),
              description: ls({
                de: 'Überlastschutz-Relais',
                en: 'Overload protection relays',
              }),
              level: 3,
              sortOrder: 60,
            },
          ],
        },

        // ========================================
        // Family: Switches
        // ========================================
        {
          slug: 'switches',
          name: ls({ de: 'Schalter', en: 'Switches' }),
          description: ls({
            de: 'Mechanische und elektronische Schalter',
            en: 'Mechanical and electronic switches',
          }),
          level: 2,
          sortOrder: 30,
          children: [
            {
              slug: 'toggle-switches',
              name: ls({ de: 'Kippschalter', en: 'Toggle Switches' }),
              level: 3,
              sortOrder: 10,
            },
            {
              slug: 'rocker-switches',
              name: ls({ de: 'Wippschalter', en: 'Rocker Switches' }),
              level: 3,
              sortOrder: 20,
            },
            {
              slug: 'push-button-switches',
              name: ls({ de: 'Drucktaster', en: 'Push Button Switches' }),
              level: 3,
              sortOrder: 30,
              children: [
                {
                  slug: 'momentary',
                  name: ls({ de: 'Tastend', en: 'Momentary' }),
                  description: ls({
                    de: 'Rückstellend bei Loslassen',
                    en: 'Self-resetting when released',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'latching',
                  name: ls({ de: 'Rastend', en: 'Latching' }),
                  description: ls({
                    de: 'Verbleibt in Position',
                    en: 'Remains in position',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'illuminated',
                  name: ls({ de: 'Beleuchtet', en: 'Illuminated' }),
                  description: ls({
                    de: 'Mit integrierter LED',
                    en: 'With integrated LED',
                  }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            {
              slug: 'rotary-switches',
              name: ls({ de: 'Drehschalter', en: 'Rotary Switches' }),
              level: 3,
              sortOrder: 40,
            },
            {
              slug: 'dip-switches',
              name: ls({ de: 'DIP-Schalter', en: 'DIP Switches' }),
              description: ls({
                de: 'Dual In-line Package Schalter',
                en: 'Dual In-line Package switches',
              }),
              level: 3,
              sortOrder: 50,
            },
            {
              slug: 'slide-switches',
              name: ls({ de: 'Schiebeschalter', en: 'Slide Switches' }),
              level: 3,
              sortOrder: 60,
            },
            {
              slug: 'limit-switches',
              name: ls({ de: 'Endschalter', en: 'Limit Switches' }),
              level: 3,
              sortOrder: 70,
            },
            {
              slug: 'microswitch',
              name: ls({ de: 'Mikroschalter', en: 'Microswitch' }),
              description: ls({
                de: 'Schnappschalter mit Hebel',
                en: 'Snap-action switch with lever',
              }),
              level: 3,
              sortOrder: 80,
            },
            {
              slug: 'membrane-switches',
              name: ls({ de: 'Folientastaturen', en: 'Membrane Switches' }),
              level: 3,
              sortOrder: 90,
            },
            {
              slug: 'key-switches',
              name: ls({ de: 'Tastaturschalter', en: 'Key Switches' }),
              description: ls({
                de: 'Mechanische Tastaturschalter (Cherry MX etc.)',
                en: 'Mechanical keyboard switches (Cherry MX etc.)',
              }),
              level: 3,
              sortOrder: 100,
            },
            {
              slug: 'tact-switches',
              name: ls({ de: 'Taktschalter', en: 'Tact Switches' }),
              description: ls({
                de: 'Leiterplatten-Drucktaster',
                en: 'PCB-mounted tactile switches',
              }),
              level: 3,
              sortOrder: 110,
            },
            {
              slug: 'encoders',
              name: ls({ de: 'Encoder', en: 'Encoders' }),
              level: 3,
              sortOrder: 120,
              children: [
                {
                  slug: 'rotary-encoders',
                  name: ls({ de: 'Drehgeber', en: 'Rotary Encoders' }),
                  description: ls({
                    de: 'Inkrementell oder absolut',
                    en: 'Incremental or absolute',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'linear-encoders',
                  name: ls({ de: 'Lineargeber', en: 'Linear Encoders' }),
                  level: 4,
                  sortOrder: 20,
                },
              ],
            },
          ],
        },

        // ========================================
        // Family: Motors
        // ========================================
        {
          slug: 'motors',
          name: ls({ de: 'Motoren', en: 'Motors' }),
          description: ls({
            de: 'Elektrische Antriebe',
            en: 'Electric drives',
          }),
          level: 2,
          sortOrder: 40,
          children: [
            {
              slug: 'dc-motors',
              name: ls({ de: 'DC-Motoren', en: 'DC Motors' }),
              level: 3,
              sortOrder: 10,
              children: [
                {
                  slug: 'brushed-dc',
                  name: ls({ de: 'Bürstenbehaftete DC-Motoren', en: 'Brushed DC Motors' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'brushless-dc',
                  name: ls({ de: 'Bürstenlose DC-Motoren', en: 'Brushless DC Motors' }),
                  description: ls({
                    de: 'BLDC - Elektronisch kommutiert',
                    en: 'BLDC - Electronically commutated',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'coreless-dc',
                  name: ls({ de: 'Kernlose DC-Motoren', en: 'Coreless DC Motors' }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            {
              slug: 'stepper-motors',
              name: ls({ de: 'Schrittmotoren', en: 'Stepper Motors' }),
              level: 3,
              sortOrder: 20,
              children: [
                {
                  slug: 'unipolar',
                  name: ls({ de: 'Unipolar', en: 'Unipolar Stepper' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'bipolar',
                  name: ls({ de: 'Bipolar', en: 'Bipolar Stepper' }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'hybrid',
                  name: ls({ de: 'Hybrid', en: 'Hybrid Stepper' }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
            {
              slug: 'servo-motors',
              name: ls({ de: 'Servomotoren', en: 'Servo Motors' }),
              description: ls({
                de: 'Positionsgeregelte Motoren',
                en: 'Position-controlled motors',
              }),
              level: 3,
              sortOrder: 30,
            },
            {
              slug: 'ac-motors',
              name: ls({ de: 'AC-Motoren', en: 'AC Motors' }),
              level: 3,
              sortOrder: 40,
              children: [
                {
                  slug: 'single-phase',
                  name: ls({ de: 'Einphasen-Motor', en: 'Single Phase Motor' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'three-phase',
                  name: ls({ de: 'Drehstrommotor', en: 'Three Phase Motor' }),
                  level: 4,
                  sortOrder: 20,
                },
              ],
            },
            {
              slug: 'linear-motors',
              name: ls({ de: 'Linearmotoren', en: 'Linear Motors' }),
              level: 3,
              sortOrder: 50,
            },
            {
              slug: 'vibration-motors',
              name: ls({ de: 'Vibrationsmotoren', en: 'Vibration Motors' }),
              description: ls({
                de: 'Exzenter-Motoren für Handys etc.',
                en: 'Eccentric motors for phones etc.',
              }),
              level: 3,
              sortOrder: 60,
            },
            {
              slug: 'gear-motors',
              name: ls({ de: 'Getriebemotoren', en: 'Gear Motors' }),
              description: ls({
                de: 'Motoren mit integriertem Getriebe',
                en: 'Motors with integrated gearbox',
              }),
              level: 3,
              sortOrder: 70,
            },
          ],
        },

        // ========================================
        // Family: Fans & Blowers
        // ========================================
        {
          slug: 'fans-blowers',
          name: ls({ de: 'Lüfter & Gebläse', en: 'Fans & Blowers' }),
          level: 2,
          sortOrder: 50,
          children: [
            {
              slug: 'axial-fans',
              name: ls({ de: 'Axiallüfter', en: 'Axial Fans' }),
              description: ls({
                de: 'Standard PC-Lüfter (40mm - 200mm)',
                en: 'Standard PC fans (40mm - 200mm)',
              }),
              level: 3,
              sortOrder: 10,
            },
            {
              slug: 'centrifugal-fans',
              name: ls({ de: 'Radiallüfter', en: 'Centrifugal Fans' }),
              description: ls({
                de: 'Schneckenlüfter',
                en: 'Blower fans',
              }),
              level: 3,
              sortOrder: 20,
            },
            {
              slug: 'blowers',
              name: ls({ de: 'Gebläse', en: 'Blowers' }),
              level: 3,
              sortOrder: 30,
            },
            {
              slug: 'cpu-coolers',
              name: ls({ de: 'CPU-Kühler', en: 'CPU Coolers' }),
              description: ls({
                de: 'Lüfter mit Kühlkörper',
                en: 'Fans with heatsink',
              }),
              level: 3,
              sortOrder: 40,
            },
            {
              slug: 'peltier-elements',
              name: ls({ de: 'Peltier-Elemente', en: 'Peltier Elements' }),
              description: ls({
                de: 'Thermoelektrische Kühler (TEC)',
                en: 'Thermoelectric coolers (TEC)',
              }),
              level: 3,
              sortOrder: 50,
            },
          ],
        },

        // ========================================
        // Family: Speakers & Buzzers
        // ========================================
        {
          slug: 'speakers-buzzers',
          name: ls({ de: 'Lautsprecher & Summer', en: 'Speakers & Buzzers' }),
          level: 2,
          sortOrder: 60,
          children: [
            {
              slug: 'speakers',
              name: ls({ de: 'Lautsprecher', en: 'Speakers' }),
              level: 3,
              sortOrder: 10,
              children: [
                {
                  slug: 'dynamic-speakers',
                  name: ls({ de: 'Dynamische Lautsprecher', en: 'Dynamic Speakers' }),
                  description: ls({
                    de: 'Konventionelle Lautsprecher mit Spule',
                    en: 'Conventional speakers with coil',
                  }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'piezo-speakers',
                  name: ls({ de: 'Piezo-Lautsprecher', en: 'Piezo Speakers' }),
                  level: 4,
                  sortOrder: 20,
                },
              ],
            },
            {
              slug: 'buzzers',
              name: ls({ de: 'Summer', en: 'Buzzers' }),
              level: 3,
              sortOrder: 20,
              children: [
                {
                  slug: 'piezo-buzzers',
                  name: ls({ de: 'Piezo-Summer', en: 'Piezo Buzzers' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'magnetic-buzzers',
                  name: ls({ de: 'Magnetische Summer', en: 'Magnetic Buzzers' }),
                  level: 4,
                  sortOrder: 20,
                },
              ],
            },
            {
              slug: 'microphones',
              name: ls({ de: 'Mikrofone', en: 'Microphones' }),
              level: 3,
              sortOrder: 30,
              children: [
                {
                  slug: 'electret',
                  name: ls({ de: 'Elektret-Mikrofone', en: 'Electret Microphones' }),
                  level: 4,
                  sortOrder: 10,
                },
                {
                  slug: 'mems',
                  name: ls({ de: 'MEMS-Mikrofone', en: 'MEMS Microphones' }),
                  description: ls({
                    de: 'Micro-Electro-Mechanical Systems',
                    en: 'Micro-Electro-Mechanical Systems',
                  }),
                  level: 4,
                  sortOrder: 20,
                },
                {
                  slug: 'dynamic',
                  name: ls({ de: 'Dynamische Mikrofone', en: 'Dynamic Microphones' }),
                  level: 4,
                  sortOrder: 30,
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  // Kategorien erstellen
  const categoryMap = await createCategoryTree(prisma, categories);

  // ========================================
  // Attribute pro Kategorie
  // ========================================

  // Connector Attributes (alle Connector-Typen)
  const connectorAttributes: AttributeDef[] = [
    {
      name: 'contact_count',
      displayName: ls({ de: 'Kontaktanzahl', en: 'Contact Count' }),
      dataType: AttributeDataType.INTEGER,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isRequired: true,
      sortOrder: 10,
    },
    {
      name: 'pitch',
      displayName: ls({ de: 'Rastermaß', en: 'Pitch' }),
      unit: 'mm',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 20,
    },
    {
      name: 'current_rating',
      displayName: ls({ de: 'Nennstrom', en: 'Current Rating' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 30,
    },
    {
      name: 'voltage_rating',
      displayName: ls({ de: 'Nennspannung', en: 'Voltage Rating' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 40,
    },
    {
      name: 'contact_material',
      displayName: ls({ de: 'Kontaktmaterial', en: 'Contact Material' }),
      dataType: AttributeDataType.STRING,
      scope: AttributeScope.COMPONENT,
      allowedValues: ['Gold', 'Tin', 'Silver', 'Nickel', 'Copper'],
      isFilterable: true,
      sortOrder: 50,
    },
  ];

  // Auf alle Connector-Kategorien anwenden
  const connectorCategories = [
    'pcb-connectors',
    'wire-to-wire',
    'wire-to-board',
    'circular-connectors',
    'd-sub-connectors',
    'coaxial-connectors',
    'power-connectors',
    'audio-connectors',
    'usb-connectors',
    'hdmi-displayport',
    'modular-rj',
    'terminal-blocks',
    'ic-sockets',
    'banana-plugs',
  ];

  for (const catSlug of connectorCategories) {
    const catId = categoryMap.get(catSlug);
    if (catId) {
      await createAttributes(prisma, catId, connectorAttributes);
    }
  }

  // Relay Attributes
  const relayAttributes: AttributeDef[] = [
    {
      name: 'coil_voltage',
      displayName: ls({ de: 'Spulenspannung', en: 'Coil Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isRequired: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 10,
    },
    {
      name: 'contact_configuration',
      displayName: ls({ de: 'Kontaktkonfiguration', en: 'Contact Configuration' }),
      dataType: AttributeDataType.STRING,
      scope: AttributeScope.COMPONENT,
      allowedValues: ['SPST', 'SPDT', 'DPST', 'DPDT', '3PST', '3PDT', '4PST', '4PDT'],
      isLabel: true,
      isFilterable: true,
      sortOrder: 20,
    },
    {
      name: 'contact_current',
      displayName: ls({ de: 'Kontaktstrom', en: 'Contact Current' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 30,
    },
    {
      name: 'coil_resistance',
      displayName: ls({ de: 'Spulenwiderstand', en: 'Coil Resistance' }),
      unit: 'Ω',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'k', 'M'],
      sortOrder: 40,
    },
    {
      name: 'operate_time',
      displayName: ls({ de: 'Anzugszeit', en: 'Operate Time' }),
      unit: 'ms',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'µ'],
      sortOrder: 50,
    },
  ];

  const relayCategories = [
    'electromechanical-relays',
    'solid-state-relays',
    'contactors',
    'mercury-relays',
    'thermal-relays',
  ];

  for (const catSlug of relayCategories) {
    const catId = categoryMap.get(catSlug);
    if (catId) {
      await createAttributes(prisma, catId, relayAttributes);
    }
  }

  // Optocoupler Attributes (ähnlich Relay, aber spezifisch)
  const optocouplerAttributes: AttributeDef[] = [
    {
      name: 'forward_voltage',
      displayName: ls({ de: 'Durchlassspannung', en: 'Forward Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 10,
    },
    {
      name: 'forward_current',
      displayName: ls({ de: 'Durchlassstrom', en: 'Forward Current' }),
      unit: 'mA',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'µ'],
      sortOrder: 20,
    },
    {
      name: 'isolation_voltage',
      displayName: ls({ de: 'Isolationsspannung', en: 'Isolation Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 30,
    },
    {
      name: 'ctr',
      displayName: ls({ de: 'Übertragungsverhältnis (CTR)', en: 'Current Transfer Ratio (CTR)' }),
      unit: '%',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-'],
      sortOrder: 40,
    },
  ];

  const optocouplerCat = categoryMap.get('optocouplers');
  if (optocouplerCat) {
    await createAttributes(prisma, optocouplerCat, optocouplerAttributes);
  }

  // Switch Attributes
  const switchAttributes: AttributeDef[] = [
    {
      name: 'contact_configuration',
      displayName: ls({ de: 'Kontaktkonfiguration', en: 'Contact Configuration' }),
      dataType: AttributeDataType.STRING,
      scope: AttributeScope.COMPONENT,
      allowedValues: ['SPST', 'SPDT', 'DPST', 'DPDT', '3PST', '3PDT', '4PST', '4PDT', 'ON-OFF-ON', 'ON-ON'],
      isLabel: true,
      isFilterable: true,
      sortOrder: 10,
    },
    {
      name: 'current_rating',
      displayName: ls({ de: 'Nennstrom', en: 'Current Rating' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 20,
    },
    {
      name: 'voltage_rating',
      displayName: ls({ de: 'Nennspannung', en: 'Voltage Rating' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 30,
    },
    {
      name: 'actuator_type',
      displayName: ls({ de: 'Betätigungstyp', en: 'Actuator Type' }),
      dataType: AttributeDataType.STRING,
      scope: AttributeScope.COMPONENT,
      allowedValues: ['Flat', 'Round', 'Lever', 'Paddle', 'Rocker', 'Slide', 'Rotary', 'Tactile'],
      isFilterable: true,
      sortOrder: 40,
    },
    {
      name: 'mechanical_life',
      displayName: ls({ de: 'Mechanische Lebensdauer', en: 'Mechanical Life' }),
      unit: 'cycles',
      dataType: AttributeDataType.INTEGER,
      scope: AttributeScope.COMPONENT,
      sortOrder: 50,
    },
  ];

  const switchCategories = [
    'toggle-switches',
    'rocker-switches',
    'push-button-switches',
    'rotary-switches',
    'dip-switches',
    'slide-switches',
    'limit-switches',
    'microswitch',
    'membrane-switches',
    'key-switches',
    'tact-switches',
  ];

  for (const catSlug of switchCategories) {
    const catId = categoryMap.get(catSlug);
    if (catId) {
      await createAttributes(prisma, catId, switchAttributes);
    }
  }

  // Encoder Attributes (spezifisch)
  const encoderAttributes: AttributeDef[] = [
    {
      name: 'pulses_per_revolution',
      displayName: ls({ de: 'Impulse pro Umdrehung', en: 'Pulses per Revolution' }),
      unit: 'PPR',
      dataType: AttributeDataType.INTEGER,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isFilterable: true,
      sortOrder: 10,
    },
    {
      name: 'encoder_type',
      displayName: ls({ de: 'Encoder-Typ', en: 'Encoder Type' }),
      dataType: AttributeDataType.STRING,
      scope: AttributeScope.COMPONENT,
      allowedValues: ['Incremental', 'Absolute', 'Quadrature'],
      isFilterable: true,
      sortOrder: 20,
    },
    {
      name: 'voltage_rating',
      displayName: ls({ de: 'Betriebsspannung', en: 'Operating Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 30,
    },
  ];

  const encoderCat = categoryMap.get('encoders');
  if (encoderCat) {
    await createAttributes(prisma, encoderCat, encoderAttributes);
  }

  // Motor Attributes
  const motorAttributes: AttributeDef[] = [
    {
      name: 'voltage',
      displayName: ls({ de: 'Nennspannung', en: 'Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isRequired: true,
      isFilterable: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 10,
    },
    {
      name: 'current',
      displayName: ls({ de: 'Nennstrom', en: 'Current' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 20,
    },
    {
      name: 'rpm',
      displayName: ls({ de: 'Drehzahl', en: 'RPM' }),
      unit: 'RPM',
      dataType: AttributeDataType.INTEGER,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isFilterable: true,
      sortOrder: 30,
    },
    {
      name: 'torque',
      displayName: ls({ de: 'Drehmoment', en: 'Torque' }),
      unit: 'Nm',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm', 'c'],
      sortOrder: 40,
    },
    {
      name: 'power',
      displayName: ls({ de: 'Leistung', en: 'Power' }),
      unit: 'W',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 50,
    },
  ];

  const motorCategories = [
    'dc-motors',
    'stepper-motors',
    'servo-motors',
    'ac-motors',
    'linear-motors',
    'vibration-motors',
    'gear-motors',
  ];

  for (const catSlug of motorCategories) {
    const catId = categoryMap.get(catSlug);
    if (catId) {
      await createAttributes(prisma, catId, motorAttributes);
    }
  }

  // Fan & Blower Attributes
  const fanAttributes: AttributeDef[] = [
    {
      name: 'size',
      displayName: ls({ de: 'Größe', en: 'Size' }),
      unit: 'mm',
      dataType: AttributeDataType.INTEGER,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isRequired: true,
      isFilterable: true,
      sortOrder: 10,
    },
    {
      name: 'voltage',
      displayName: ls({ de: 'Betriebsspannung', en: 'Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isFilterable: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 20,
    },
    {
      name: 'airflow',
      displayName: ls({ de: 'Luftdurchsatz', en: 'Airflow' }),
      unit: 'CFM',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-'],
      sortOrder: 30,
    },
    {
      name: 'noise',
      displayName: ls({ de: 'Geräuschpegel', en: 'Noise Level' }),
      unit: 'dBA',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-'],
      sortOrder: 40,
    },
    {
      name: 'rpm',
      displayName: ls({ de: 'Drehzahl', en: 'RPM' }),
      unit: 'RPM',
      dataType: AttributeDataType.INTEGER,
      scope: AttributeScope.COMPONENT,
      sortOrder: 50,
    },
  ];

  const fanCategories = [
    'axial-fans',
    'centrifugal-fans',
    'blowers',
    'cpu-coolers',
  ];

  for (const catSlug of fanCategories) {
    const catId = categoryMap.get(catSlug);
    if (catId) {
      await createAttributes(prisma, catId, fanAttributes);
    }
  }

  // Peltier Element Attributes
  const peltierAttributes: AttributeDef[] = [
    {
      name: 'voltage',
      displayName: ls({ de: 'Nennspannung', en: 'Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 10,
    },
    {
      name: 'max_current',
      displayName: ls({ de: 'Max. Strom', en: 'Max Current' }),
      unit: 'A',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 20,
    },
    {
      name: 'cooling_power',
      displayName: ls({ de: 'Kühlleistung', en: 'Cooling Power' }),
      unit: 'W',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm', 'k'],
      sortOrder: 30,
    },
    {
      name: 'max_temperature_diff',
      displayName: ls({ de: 'Max. Temperaturdifferenz', en: 'Max Temperature Difference' }),
      unit: '°C',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-'],
      sortOrder: 40,
    },
  ];

  const peltierCat = categoryMap.get('peltier-elements');
  if (peltierCat) {
    await createAttributes(prisma, peltierCat, peltierAttributes);
  }

  // Speaker & Buzzer Attributes
  const speakerAttributes: AttributeDef[] = [
    {
      name: 'frequency_response',
      displayName: ls({ de: 'Frequenzbereich', en: 'Frequency Response' }),
      unit: 'Hz',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'k', 'M'],
      sortOrder: 10,
    },
    {
      name: 'impedance',
      displayName: ls({ de: 'Impedanz', en: 'Impedance' }),
      unit: 'Ω',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isLabel: true,
      isFilterable: true,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 20,
    },
    {
      name: 'power_rating',
      displayName: ls({ de: 'Nennleistung', en: 'Power Rating' }),
      unit: 'W',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      allowedPrefixes: ['-', 'm'],
      sortOrder: 30,
    },
    {
      name: 'spl',
      displayName: ls({ de: 'Schalldruckpegel (SPL)', en: 'Sound Pressure Level (SPL)' }),
      unit: 'dB',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-'],
      sortOrder: 40,
    },
  ];

  const speakerCategories = [
    'speakers',
    'buzzers',
  ];

  for (const catSlug of speakerCategories) {
    const catId = categoryMap.get(catSlug);
    if (catId) {
      await createAttributes(prisma, catId, speakerAttributes);
    }
  }

  // Microphone Attributes (ähnlich Speaker, aber Input-fokussiert)
  const microphoneAttributes: AttributeDef[] = [
    {
      name: 'frequency_response',
      displayName: ls({ de: 'Frequenzbereich', en: 'Frequency Response' }),
      unit: 'Hz',
      dataType: AttributeDataType.RANGE,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'k', 'M'],
      sortOrder: 10,
    },
    {
      name: 'sensitivity',
      displayName: ls({ de: 'Empfindlichkeit', en: 'Sensitivity' }),
      unit: 'dBV',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-'],
      sortOrder: 20,
    },
    {
      name: 'voltage',
      displayName: ls({ de: 'Betriebsspannung', en: 'Operating Voltage' }),
      unit: 'V',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-', 'k'],
      sortOrder: 30,
    },
    {
      name: 'snr',
      displayName: ls({ de: 'Signal-Rausch-Verhältnis (SNR)', en: 'Signal-to-Noise Ratio (SNR)' }),
      unit: 'dB',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      allowedPrefixes: ['-'],
      sortOrder: 40,
    },
  ];

  const micCat = categoryMap.get('microphones');
  if (micCat) {
    await createAttributes(prisma, micCat, microphoneAttributes);
  }

  console.log('✓ Electromechanical Components seeded successfully');
}
