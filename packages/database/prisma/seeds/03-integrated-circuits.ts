// Seed-Datei für Integrated Circuits (ICs)

import { PrismaClient } from '@prisma/client';
import {
  ls,
  createCategoryTree,
  createAttributes,
  CategoryDef,
  AttributeDef,
  AttributeDataType,
  AttributeScope,
} from './types';

/**
 * Integrated Circuits Kategorie-Hierarchie
 * Level 0: Domain
 * Level 1: Family
 * Level 2: Type
 * Level 3: Subtype
 */
const integratedCircuitsCategories: CategoryDef[] = [
  {
    slug: 'integrated-circuits',
    name: ls({
      de: 'Integrierte Schaltkreise',
      en: 'Integrated Circuits',
    }),
    description: ls({
      de: 'Analoge, digitale und Mixed-Signal ICs',
      en: 'Analog, digital and mixed-signal ICs',
    }),
    level: 0,
    sortOrder: 300,
    children: [
      // ========================================
      // Family: Analog ICs
      // ========================================
      {
        slug: 'analog-ics',
        name: ls({
          de: 'Analoge ICs',
          en: 'Analog ICs',
        }),
        description: ls({
          de: 'Analoge integrierte Schaltkreise',
          en: 'Analog integrated circuits',
        }),
        level: 1,
        sortOrder: 100,
        children: [
          // Operational Amplifiers
          {
            slug: 'operational-amplifiers',
            name: ls({
              de: 'Operationsverstärker',
              en: 'Operational Amplifiers',
            }),
            level: 2,
            sortOrder: 100,
            children: [
              {
                slug: 'general-purpose-opamps',
                name: ls({
                  de: 'Standard-Operationsverstärker',
                  en: 'General Purpose Op-Amps',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'precision-opamps',
                name: ls({
                  de: 'Präzisions-Operationsverstärker',
                  en: 'Precision Op-Amps',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'high-speed-opamps',
                name: ls({
                  de: 'Hochgeschwindigkeits-Operationsverstärker',
                  en: 'High-Speed Op-Amps',
                }),
                level: 3,
                sortOrder: 300,
              },
              {
                slug: 'low-power-opamps',
                name: ls({
                  de: 'Stromspar-Operationsverstärker',
                  en: 'Low-Power Op-Amps',
                }),
                level: 3,
                sortOrder: 400,
              },
              {
                slug: 'rail-to-rail-opamps',
                name: ls({
                  de: 'Rail-to-Rail Operationsverstärker',
                  en: 'Rail-to-Rail Op-Amps',
                }),
                level: 3,
                sortOrder: 500,
              },
              {
                slug: 'instrumentation-amplifiers',
                name: ls({
                  de: 'Instrumentenverstärker',
                  en: 'Instrumentation Amplifiers',
                }),
                level: 3,
                sortOrder: 600,
              },
              {
                slug: 'difference-amplifiers',
                name: ls({
                  de: 'Differenzverstärker',
                  en: 'Difference Amplifiers',
                }),
                level: 3,
                sortOrder: 700,
              },
            ],
          },
          // Comparators
          {
            slug: 'comparators',
            name: ls({
              de: 'Komparatoren',
              en: 'Comparators',
            }),
            level: 2,
            sortOrder: 200,
          },
          // Audio Amplifiers
          {
            slug: 'audio-amplifiers',
            name: ls({
              de: 'Audio-Verstärker',
              en: 'Audio Amplifiers',
            }),
            level: 2,
            sortOrder: 300,
            children: [
              {
                slug: 'power-amplifiers-audio',
                name: ls({
                  de: 'Leistungsverstärker',
                  en: 'Power Amplifiers',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'preamplifiers',
                name: ls({
                  de: 'Vorverstärker',
                  en: 'Preamplifiers',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'headphone-amplifiers',
                name: ls({
                  de: 'Kopfhörerverstärker',
                  en: 'Headphone Amplifiers',
                }),
                level: 3,
                sortOrder: 300,
              },
              {
                slug: 'class-d-amplifiers',
                name: ls({
                  de: 'Class-D Verstärker',
                  en: 'Class D Amplifiers',
                }),
                level: 3,
                sortOrder: 400,
              },
            ],
          },
          // Video Amplifiers
          {
            slug: 'video-amplifiers',
            name: ls({
              de: 'Video-Verstärker',
              en: 'Video Amplifiers',
            }),
            level: 2,
            sortOrder: 400,
          },
          // RF Amplifiers
          {
            slug: 'rf-amplifiers',
            name: ls({
              de: 'HF-Verstärker',
              en: 'RF Amplifiers',
            }),
            level: 2,
            sortOrder: 500,
            children: [
              {
                slug: 'lna',
                name: ls({
                  de: 'Rauscharme Verstärker (LNA)',
                  en: 'Low Noise Amplifiers (LNA)',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'power-amplifiers-rf',
                name: ls({
                  de: 'HF-Leistungsverstärker',
                  en: 'RF Power Amplifiers',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'variable-gain-amplifiers',
                name: ls({
                  de: 'Verstärker mit variabler Verstärkung (VGA)',
                  en: 'Variable Gain Amplifiers (VGA)',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Timer ICs
          {
            slug: 'timer-ics',
            name: ls({
              de: 'Timer-ICs',
              en: 'Timer ICs',
            }),
            description: ls({
              de: '555, 556 und ähnliche Timer-Schaltkreise',
              en: '555, 556 and similar timer circuits',
            }),
            level: 2,
            sortOrder: 600,
          },
          // Analog Switches
          {
            slug: 'analog-switches',
            name: ls({
              de: 'Analog-Schalter',
              en: 'Analog Switches',
            }),
            level: 2,
            sortOrder: 700,
          },
          // Analog Multiplexers
          {
            slug: 'analog-multiplexers',
            name: ls({
              de: 'Analog-Multiplexer',
              en: 'Analog Multiplexers',
            }),
            level: 2,
            sortOrder: 800,
          },
          // Sample & Hold
          {
            slug: 'sample-hold',
            name: ls({
              de: 'Sample & Hold',
              en: 'Sample & Hold',
            }),
            level: 2,
            sortOrder: 900,
          },
          // Voltage-to-Frequency Converters
          {
            slug: 'voltage-to-frequency',
            name: ls({
              de: 'Spannungs-Frequenz-Wandler',
              en: 'Voltage-to-Frequency Converters',
            }),
            level: 2,
            sortOrder: 1000,
          },
          // PLL/Frequency Synthesizers
          {
            slug: 'pll-frequency-synthesizers',
            name: ls({
              de: 'PLL / Frequenzsynthesizer',
              en: 'PLL / Frequency Synthesizers',
            }),
            level: 2,
            sortOrder: 1100,
          },
          // RMS-to-DC Converters
          {
            slug: 'rms-to-dc',
            name: ls({
              de: 'RMS-DC-Wandler',
              en: 'RMS-to-DC Converters',
            }),
            level: 2,
            sortOrder: 1200,
          },
          // Logarithmic Amplifiers
          {
            slug: 'logarithmic-amplifiers',
            name: ls({
              de: 'Logarithmische Verstärker',
              en: 'Logarithmic Amplifiers',
            }),
            level: 2,
            sortOrder: 1300,
          },
        ],
      },

      // ========================================
      // Family: Digital ICs
      // ========================================
      {
        slug: 'digital-ics',
        name: ls({
          de: 'Digitale ICs',
          en: 'Digital ICs',
        }),
        description: ls({
          de: 'Digitale Logik-ICs',
          en: 'Digital logic ICs',
        }),
        level: 1,
        sortOrder: 200,
        children: [
          // Logic Gates
          {
            slug: 'logic-gates',
            name: ls({
              de: 'Logikgatter',
              en: 'Logic Gates',
            }),
            level: 2,
            sortOrder: 100,
            children: [
              {
                slug: 'and-gates',
                name: ls({
                  de: 'AND-Gatter',
                  en: 'AND Gates',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'or-gates',
                name: ls({
                  de: 'OR-Gatter',
                  en: 'OR Gates',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'nand-gates',
                name: ls({
                  de: 'NAND-Gatter',
                  en: 'NAND Gates',
                }),
                level: 3,
                sortOrder: 300,
              },
              {
                slug: 'nor-gates',
                name: ls({
                  de: 'NOR-Gatter',
                  en: 'NOR Gates',
                }),
                level: 3,
                sortOrder: 400,
              },
              {
                slug: 'xor-gates',
                name: ls({
                  de: 'XOR-Gatter',
                  en: 'XOR Gates',
                }),
                level: 3,
                sortOrder: 500,
              },
              {
                slug: 'inverters',
                name: ls({
                  de: 'Inverter',
                  en: 'Inverters',
                }),
                level: 3,
                sortOrder: 600,
              },
              {
                slug: 'buffers',
                name: ls({
                  de: 'Puffer',
                  en: 'Buffers',
                }),
                level: 3,
                sortOrder: 700,
              },
              {
                slug: 'schmitt-trigger',
                name: ls({
                  de: 'Schmitt-Trigger',
                  en: 'Schmitt Triggers',
                }),
                level: 3,
                sortOrder: 800,
              },
            ],
          },
          // Flip-Flops
          {
            slug: 'flip-flops',
            name: ls({
              de: 'Flip-Flops',
              en: 'Flip-Flops',
            }),
            level: 2,
            sortOrder: 200,
            children: [
              {
                slug: 'd-flip-flops',
                name: ls({
                  de: 'D-Flip-Flops',
                  en: 'D Flip-Flops',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'jk-flip-flops',
                name: ls({
                  de: 'JK-Flip-Flops',
                  en: 'JK Flip-Flops',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'sr-flip-flops',
                name: ls({
                  de: 'SR-Flip-Flops',
                  en: 'SR Flip-Flops',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Counters
          {
            slug: 'counters',
            name: ls({
              de: 'Zähler',
              en: 'Counters',
            }),
            level: 2,
            sortOrder: 300,
            children: [
              {
                slug: 'binary-counters',
                name: ls({
                  de: 'Binärzähler',
                  en: 'Binary Counters',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'decade-counters',
                name: ls({
                  de: 'Dekadenzähler',
                  en: 'Decade Counters',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'updown-counters',
                name: ls({
                  de: 'Vor-/Rückwärtszähler',
                  en: 'Up/Down Counters',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Shift Registers
          {
            slug: 'shift-registers',
            name: ls({
              de: 'Schieberegister',
              en: 'Shift Registers',
            }),
            level: 2,
            sortOrder: 400,
            children: [
              {
                slug: 'sipo',
                name: ls({
                  de: 'SIPO (Serial In Parallel Out)',
                  en: 'SIPO (Serial In Parallel Out)',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'piso',
                name: ls({
                  de: 'PISO (Parallel In Serial Out)',
                  en: 'PISO (Parallel In Serial Out)',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'siso',
                name: ls({
                  de: 'SISO (Serial In Serial Out)',
                  en: 'SISO (Serial In Serial Out)',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Multiplexers/Demultiplexers
          {
            slug: 'mux-demux',
            name: ls({
              de: 'Multiplexer / Demultiplexer',
              en: 'Multiplexers / Demultiplexers',
            }),
            level: 2,
            sortOrder: 500,
          },
          // Encoders/Decoders
          {
            slug: 'encoders-decoders',
            name: ls({
              de: 'Codierer / Decodierer',
              en: 'Encoders / Decoders',
            }),
            level: 2,
            sortOrder: 600,
            children: [
              {
                slug: 'priority-encoders',
                name: ls({
                  de: 'Prioritäts-Codierer',
                  en: 'Priority Encoders',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'bcd-decoders',
                name: ls({
                  de: 'BCD-Decodierer',
                  en: 'BCD Decoders',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'line-decoders',
                name: ls({
                  de: 'Leitungs-Decodierer',
                  en: 'Line Decoders',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Latches
          {
            slug: 'latches',
            name: ls({
              de: 'Latches',
              en: 'Latches',
            }),
            level: 2,
            sortOrder: 700,
          },
          // Arithmetic Logic Units
          {
            slug: 'arithmetic-logic-units',
            name: ls({
              de: 'Arithmetisch-Logische Einheiten',
              en: 'Arithmetic Logic Units',
            }),
            level: 2,
            sortOrder: 800,
            children: [
              {
                slug: 'adders',
                name: ls({
                  de: 'Addierer',
                  en: 'Adders',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'digital-comparators',
                name: ls({
                  de: 'Digital-Komparatoren',
                  en: 'Digital Comparators',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'alus',
                name: ls({
                  de: 'ALUs',
                  en: 'ALUs',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Level Shifters
          {
            slug: 'level-shifters',
            name: ls({
              de: 'Pegelwandler',
              en: 'Level Shifters',
            }),
            level: 2,
            sortOrder: 900,
          },
          // Bus Transceivers
          {
            slug: 'bus-transceivers',
            name: ls({
              de: 'Bus-Transceiver',
              en: 'Bus Transceivers',
            }),
            level: 2,
            sortOrder: 1000,
          },
          // Clock Generators
          {
            slug: 'clock-generators-digital',
            name: ls({
              de: 'Taktgeneratoren',
              en: 'Clock Generators',
            }),
            level: 2,
            sortOrder: 1100,
          },
          // Clock Buffers/Distributors
          {
            slug: 'clock-buffers-distributors',
            name: ls({
              de: 'Taktpuffer / Taktverteiler',
              en: 'Clock Buffers / Distributors',
            }),
            level: 2,
            sortOrder: 1200,
          },
        ],
      },

      // ========================================
      // Family: Mixed-Signal ICs
      // ========================================
      {
        slug: 'mixed-signal-ics',
        name: ls({
          de: 'Mixed-Signal ICs',
          en: 'Mixed-Signal ICs',
        }),
        description: ls({
          de: 'Analog-Digital-Wandler und gemischte Signalverarbeitung',
          en: 'Analog-to-digital converters and mixed signal processing',
        }),
        level: 1,
        sortOrder: 300,
        children: [
          // ADC
          {
            slug: 'adc',
            name: ls({
              de: 'Analog-Digital-Wandler (ADC)',
              en: 'Analog-to-Digital Converters (ADC)',
            }),
            level: 2,
            sortOrder: 100,
            children: [
              {
                slug: 'sar-adc',
                name: ls({
                  de: 'SAR-ADC',
                  en: 'SAR ADC',
                }),
                description: ls({
                  de: 'Successive Approximation Register ADC',
                  en: 'Successive Approximation Register ADC',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'sigma-delta-adc',
                name: ls({
                  de: 'Sigma-Delta ADC',
                  en: 'Sigma-Delta ADC',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'pipeline-adc',
                name: ls({
                  de: 'Pipeline-ADC',
                  en: 'Pipeline ADC',
                }),
                level: 3,
                sortOrder: 300,
              },
              {
                slug: 'flash-adc',
                name: ls({
                  de: 'Flash-ADC',
                  en: 'Flash ADC',
                }),
                level: 3,
                sortOrder: 400,
              },
            ],
          },
          // DAC
          {
            slug: 'dac',
            name: ls({
              de: 'Digital-Analog-Wandler (DAC)',
              en: 'Digital-to-Analog Converters (DAC)',
            }),
            level: 2,
            sortOrder: 200,
            children: [
              {
                slug: 'r2r-dac',
                name: ls({
                  de: 'R-2R DAC',
                  en: 'R-2R DAC',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'sigma-delta-dac',
                name: ls({
                  de: 'Sigma-Delta DAC',
                  en: 'Sigma-Delta DAC',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'current-steering-dac',
                name: ls({
                  de: 'Stromsteuerungs-DAC',
                  en: 'Current Steering DAC',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Codecs
          {
            slug: 'codecs',
            name: ls({
              de: 'Codecs',
              en: 'Codecs',
            }),
            level: 2,
            sortOrder: 300,
            children: [
              {
                slug: 'audio-codecs',
                name: ls({
                  de: 'Audio-Codecs',
                  en: 'Audio Codecs',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'video-codecs',
                name: ls({
                  de: 'Video-Codecs',
                  en: 'Video Codecs',
                }),
                level: 3,
                sortOrder: 200,
              },
            ],
          },
          // Touch Controllers
          {
            slug: 'touch-controllers',
            name: ls({
              de: 'Touch-Controller',
              en: 'Touch Controllers',
            }),
            level: 2,
            sortOrder: 400,
          },
        ],
      },

      // ========================================
      // Family: Memory ICs
      // ========================================
      {
        slug: 'memory-ics',
        name: ls({
          de: 'Speicher-ICs',
          en: 'Memory ICs',
        }),
        description: ls({
          de: 'Halbleiterspeicher',
          en: 'Semiconductor memory',
        }),
        level: 1,
        sortOrder: 400,
        children: [
          {
            slug: 'sram',
            name: ls({
              de: 'SRAM',
              en: 'SRAM',
            }),
            description: ls({
              de: 'Static Random Access Memory',
              en: 'Static Random Access Memory',
            }),
            level: 2,
            sortOrder: 100,
          },
          {
            slug: 'dram',
            name: ls({
              de: 'DRAM',
              en: 'DRAM',
            }),
            description: ls({
              de: 'Dynamic Random Access Memory',
              en: 'Dynamic Random Access Memory',
            }),
            level: 2,
            sortOrder: 200,
          },
          {
            slug: 'flash-memory',
            name: ls({
              de: 'Flash-Speicher',
              en: 'Flash Memory',
            }),
            level: 2,
            sortOrder: 300,
            children: [
              {
                slug: 'nor-flash',
                name: ls({
                  de: 'NOR-Flash',
                  en: 'NOR Flash',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'nand-flash',
                name: ls({
                  de: 'NAND-Flash',
                  en: 'NAND Flash',
                }),
                level: 3,
                sortOrder: 200,
              },
            ],
          },
          {
            slug: 'eeprom',
            name: ls({
              de: 'EEPROM',
              en: 'EEPROM',
            }),
            description: ls({
              de: 'Electrically Erasable Programmable Read-Only Memory',
              en: 'Electrically Erasable Programmable Read-Only Memory',
            }),
            level: 2,
            sortOrder: 400,
          },
          {
            slug: 'eprom',
            name: ls({
              de: 'EPROM',
              en: 'EPROM',
            }),
            description: ls({
              de: 'Erasable Programmable Read-Only Memory (historisch)',
              en: 'Erasable Programmable Read-Only Memory (historical)',
            }),
            level: 2,
            sortOrder: 500,
          },
          {
            slug: 'prom',
            name: ls({
              de: 'PROM',
              en: 'PROM',
            }),
            description: ls({
              de: 'Programmable Read-Only Memory (historisch)',
              en: 'Programmable Read-Only Memory (historical)',
            }),
            level: 2,
            sortOrder: 600,
          },
          {
            slug: 'rom',
            name: ls({
              de: 'ROM',
              en: 'ROM',
            }),
            description: ls({
              de: 'Read-Only Memory (historisch)',
              en: 'Read-Only Memory (historical)',
            }),
            level: 2,
            sortOrder: 700,
          },
          {
            slug: 'nvram',
            name: ls({
              de: 'NVRAM',
              en: 'NVRAM',
            }),
            description: ls({
              de: 'Non-Volatile Random Access Memory',
              en: 'Non-Volatile Random Access Memory',
            }),
            level: 2,
            sortOrder: 800,
          },
          {
            slug: 'fram',
            name: ls({
              de: 'FRAM',
              en: 'FRAM',
            }),
            description: ls({
              de: 'Ferroelectric Random Access Memory',
              en: 'Ferroelectric Random Access Memory',
            }),
            level: 2,
            sortOrder: 900,
          },
          {
            slug: 'mram',
            name: ls({
              de: 'MRAM',
              en: 'MRAM',
            }),
            description: ls({
              de: 'Magnetoresistive Random Access Memory',
              en: 'Magnetoresistive Random Access Memory',
            }),
            level: 2,
            sortOrder: 1000,
          },
        ],
      },

      // ========================================
      // Family: Microcontrollers
      // ========================================
      {
        slug: 'microcontrollers',
        name: ls({
          de: 'Mikrocontroller',
          en: 'Microcontrollers',
        }),
        description: ls({
          de: 'Mikrocontroller und DSPs',
          en: 'Microcontrollers and DSPs',
        }),
        level: 1,
        sortOrder: 500,
        children: [
          {
            slug: '8bit-mcu',
            name: ls({
              de: '8-Bit Mikrocontroller',
              en: '8-Bit Microcontrollers',
            }),
            level: 2,
            sortOrder: 100,
            children: [
              {
                slug: 'avr',
                name: ls({
                  de: 'AVR',
                  en: 'AVR',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'pic',
                name: ls({
                  de: 'PIC',
                  en: 'PIC',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: '8051',
                name: ls({
                  de: '8051',
                  en: '8051',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          {
            slug: '16bit-mcu',
            name: ls({
              de: '16-Bit Mikrocontroller',
              en: '16-Bit Microcontrollers',
            }),
            level: 2,
            sortOrder: 200,
            children: [
              {
                slug: 'msp430',
                name: ls({
                  de: 'MSP430',
                  en: 'MSP430',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'dspic',
                name: ls({
                  de: 'dsPIC',
                  en: 'dsPIC',
                }),
                level: 3,
                sortOrder: 200,
              },
            ],
          },
          {
            slug: '32bit-mcu',
            name: ls({
              de: '32-Bit Mikrocontroller',
              en: '32-Bit Microcontrollers',
            }),
            level: 2,
            sortOrder: 300,
            children: [
              {
                slug: 'arm-cortex-m',
                name: ls({
                  de: 'ARM Cortex-M',
                  en: 'ARM Cortex-M',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'arm-cortex-a',
                name: ls({
                  de: 'ARM Cortex-A',
                  en: 'ARM Cortex-A',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'riscv',
                name: ls({
                  de: 'RISC-V',
                  en: 'RISC-V',
                }),
                level: 3,
                sortOrder: 300,
              },
              {
                slug: 'esp32',
                name: ls({
                  de: 'ESP32',
                  en: 'ESP32',
                }),
                level: 3,
                sortOrder: 400,
              },
            ],
          },
          {
            slug: 'dsp',
            name: ls({
              de: 'DSP',
              en: 'DSP',
            }),
            description: ls({
              de: 'Digital Signal Processors',
              en: 'Digital Signal Processors',
            }),
            level: 2,
            sortOrder: 400,
          },
        ],
      },

      // ========================================
      // Family: Programmable Logic
      // ========================================
      {
        slug: 'programmable-logic',
        name: ls({
          de: 'Programmierbare Logik',
          en: 'Programmable Logic',
        }),
        description: ls({
          de: 'FPGAs, CPLDs und historische PLDs',
          en: 'FPGAs, CPLDs and historical PLDs',
        }),
        level: 1,
        sortOrder: 600,
        children: [
          {
            slug: 'cpld',
            name: ls({
              de: 'CPLD',
              en: 'CPLD',
            }),
            description: ls({
              de: 'Complex Programmable Logic Device',
              en: 'Complex Programmable Logic Device',
            }),
            level: 2,
            sortOrder: 100,
          },
          {
            slug: 'fpga',
            name: ls({
              de: 'FPGA',
              en: 'FPGA',
            }),
            description: ls({
              de: 'Field Programmable Gate Array',
              en: 'Field Programmable Gate Array',
            }),
            level: 2,
            sortOrder: 200,
          },
          {
            slug: 'pal-gal',
            name: ls({
              de: 'PAL / GAL',
              en: 'PAL / GAL',
            }),
            description: ls({
              de: 'Programmable Array Logic / Generic Array Logic (historisch)',
              en: 'Programmable Array Logic / Generic Array Logic (historical)',
            }),
            level: 2,
            sortOrder: 300,
          },
          {
            slug: 'pla',
            name: ls({
              de: 'PLA',
              en: 'PLA',
            }),
            description: ls({
              de: 'Programmable Logic Array (historisch)',
              en: 'Programmable Logic Array (historical)',
            }),
            level: 2,
            sortOrder: 400,
          },
        ],
      },

      // ========================================
      // Family: Interface ICs
      // ========================================
      {
        slug: 'interface-ics',
        name: ls({
          de: 'Interface-ICs',
          en: 'Interface ICs',
        }),
        description: ls({
          de: 'Schnittstellen-Controller und Transceiver',
          en: 'Interface controllers and transceivers',
        }),
        level: 1,
        sortOrder: 700,
        children: [
          {
            slug: 'uart',
            name: ls({
              de: 'UART',
              en: 'UART',
            }),
            description: ls({
              de: 'Universal Asynchronous Receiver/Transmitter',
              en: 'Universal Asynchronous Receiver/Transmitter',
            }),
            level: 2,
            sortOrder: 100,
          },
          {
            slug: 'spi',
            name: ls({
              de: 'SPI',
              en: 'SPI',
            }),
            description: ls({
              de: 'Serial Peripheral Interface',
              en: 'Serial Peripheral Interface',
            }),
            level: 2,
            sortOrder: 200,
          },
          {
            slug: 'i2c',
            name: ls({
              de: 'I²C',
              en: 'I²C',
            }),
            description: ls({
              de: 'Inter-Integrated Circuit',
              en: 'Inter-Integrated Circuit',
            }),
            level: 2,
            sortOrder: 300,
          },
          {
            slug: 'usb',
            name: ls({
              de: 'USB',
              en: 'USB',
            }),
            description: ls({
              de: 'Universal Serial Bus',
              en: 'Universal Serial Bus',
            }),
            level: 2,
            sortOrder: 400,
            children: [
              {
                slug: 'usb-hubs',
                name: ls({
                  de: 'USB-Hubs',
                  en: 'USB Hubs',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'usb-serial',
                name: ls({
                  de: 'USB-Serial',
                  en: 'USB-Serial',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'usb-switches',
                name: ls({
                  de: 'USB-Schalter',
                  en: 'USB Switches',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          {
            slug: 'ethernet',
            name: ls({
              de: 'Ethernet',
              en: 'Ethernet',
            }),
            level: 2,
            sortOrder: 500,
            children: [
              {
                slug: 'ethernet-phy',
                name: ls({
                  de: 'Ethernet PHY',
                  en: 'Ethernet PHY',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'ethernet-mac',
                name: ls({
                  de: 'Ethernet MAC',
                  en: 'Ethernet MAC',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'ethernet-switches',
                name: ls({
                  de: 'Ethernet-Switches',
                  en: 'Ethernet Switches',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          {
            slug: 'can',
            name: ls({
              de: 'CAN',
              en: 'CAN',
            }),
            description: ls({
              de: 'Controller Area Network',
              en: 'Controller Area Network',
            }),
            level: 2,
            sortOrder: 600,
          },
          {
            slug: 'rs232',
            name: ls({
              de: 'RS-232',
              en: 'RS-232',
            }),
            level: 2,
            sortOrder: 700,
          },
          {
            slug: 'rs485',
            name: ls({
              de: 'RS-485',
              en: 'RS-485',
            }),
            level: 2,
            sortOrder: 800,
          },
          {
            slug: 'lvds',
            name: ls({
              de: 'LVDS',
              en: 'LVDS',
            }),
            description: ls({
              de: 'Low Voltage Differential Signaling',
              en: 'Low Voltage Differential Signaling',
            }),
            level: 2,
            sortOrder: 900,
          },
          {
            slug: 'hdmi-displayport',
            name: ls({
              de: 'HDMI / DisplayPort',
              en: 'HDMI / DisplayPort',
            }),
            level: 2,
            sortOrder: 1000,
          },
          {
            slug: 'pcie',
            name: ls({
              de: 'PCIe',
              en: 'PCIe',
            }),
            description: ls({
              de: 'PCI Express',
              en: 'PCI Express',
            }),
            level: 2,
            sortOrder: 1100,
          },
        ],
      },

      // ========================================
      // Family: Power Management ICs
      // ========================================
      {
        slug: 'power-management-ics',
        name: ls({
          de: 'Power-Management-ICs',
          en: 'Power Management ICs',
        }),
        description: ls({
          de: 'Spannungsregler, Wandler und Treiber',
          en: 'Voltage regulators, converters and drivers',
        }),
        level: 1,
        sortOrder: 800,
        children: [
          // DC-DC Converters
          {
            slug: 'dcdc-converters',
            name: ls({
              de: 'DC-DC-Wandler',
              en: 'DC-DC Converters',
            }),
            level: 2,
            sortOrder: 100,
            children: [
              {
                slug: 'buck-converters',
                name: ls({
                  de: 'Buck-Wandler (Step-Down)',
                  en: 'Buck Converters (Step-Down)',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'boost-converters',
                name: ls({
                  de: 'Boost-Wandler (Step-Up)',
                  en: 'Boost Converters (Step-Up)',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'buck-boost',
                name: ls({
                  de: 'Buck-Boost',
                  en: 'Buck-Boost',
                }),
                level: 3,
                sortOrder: 300,
              },
              {
                slug: 'flyback-controllers',
                name: ls({
                  de: 'Flyback-Controller',
                  en: 'Flyback Controllers',
                }),
                level: 3,
                sortOrder: 400,
              },
              {
                slug: 'forward-controllers',
                name: ls({
                  de: 'Forward-Controller',
                  en: 'Forward Controllers',
                }),
                level: 3,
                sortOrder: 500,
              },
            ],
          },
          // AC-DC Converters
          {
            slug: 'acdc-converters',
            name: ls({
              de: 'AC-DC-Wandler',
              en: 'AC-DC Converters',
            }),
            level: 2,
            sortOrder: 200,
          },
          // Battery Management
          {
            slug: 'battery-management',
            name: ls({
              de: 'Batterie-Management',
              en: 'Battery Management',
            }),
            level: 2,
            sortOrder: 300,
            children: [
              {
                slug: 'charger-ics',
                name: ls({
                  de: 'Lade-ICs',
                  en: 'Charger ICs',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'fuel-gauges',
                name: ls({
                  de: 'Fuel Gauges',
                  en: 'Fuel Gauges',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'protection-ics',
                name: ls({
                  de: 'Schutz-ICs',
                  en: 'Protection ICs',
                }),
                level: 3,
                sortOrder: 300,
              },
            ],
          },
          // Power Supervisors
          {
            slug: 'power-supervisors',
            name: ls({
              de: 'Power-Supervisors',
              en: 'Power Supervisors',
            }),
            level: 2,
            sortOrder: 400,
          },
          // Hot Swap Controllers
          {
            slug: 'hot-swap-controllers',
            name: ls({
              de: 'Hot-Swap-Controller',
              en: 'Hot Swap Controllers',
            }),
            level: 2,
            sortOrder: 500,
          },
          // PoE Controllers
          {
            slug: 'poe-controllers',
            name: ls({
              de: 'PoE-Controller',
              en: 'PoE Controllers',
            }),
            description: ls({
              de: 'Power over Ethernet',
              en: 'Power over Ethernet',
            }),
            level: 2,
            sortOrder: 600,
          },
          // LED Drivers
          {
            slug: 'led-drivers',
            name: ls({
              de: 'LED-Treiber',
              en: 'LED Drivers',
            }),
            level: 2,
            sortOrder: 700,
          },
          // Motor Drivers
          {
            slug: 'motor-drivers',
            name: ls({
              de: 'Motortreiber',
              en: 'Motor Drivers',
            }),
            level: 2,
            sortOrder: 800,
            children: [
              {
                slug: 'brushed-dc-drivers',
                name: ls({
                  de: 'DC-Motortreiber (mit Bürsten)',
                  en: 'Brushed DC Motor Drivers',
                }),
                level: 3,
                sortOrder: 100,
              },
              {
                slug: 'brushless-dc-drivers',
                name: ls({
                  de: 'BLDC-Motortreiber',
                  en: 'Brushless DC Motor Drivers',
                }),
                level: 3,
                sortOrder: 200,
              },
              {
                slug: 'stepper-drivers',
                name: ls({
                  de: 'Schrittmotortreiber',
                  en: 'Stepper Motor Drivers',
                }),
                level: 3,
                sortOrder: 300,
              },
              {
                slug: 'hbridge',
                name: ls({
                  de: 'H-Brücken',
                  en: 'H-Bridges',
                }),
                level: 3,
                sortOrder: 400,
              },
            ],
          },
        ],
      },

      // ========================================
      // Family: Clock ICs
      // ========================================
      {
        slug: 'clock-ics',
        name: ls({
          de: 'Takt-ICs',
          en: 'Clock ICs',
        }),
        description: ls({
          de: 'Echtzeit-Uhren, Taktgeneratoren und -verteiler',
          en: 'Real-time clocks, clock generators and distributors',
        }),
        level: 1,
        sortOrder: 900,
        children: [
          {
            slug: 'real-time-clocks',
            name: ls({
              de: 'Echtzeit-Uhren (RTC)',
              en: 'Real-Time Clocks (RTC)',
            }),
            level: 2,
            sortOrder: 100,
          },
          {
            slug: 'clock-generators',
            name: ls({
              de: 'Taktgeneratoren',
              en: 'Clock Generators',
            }),
            level: 2,
            sortOrder: 200,
          },
          {
            slug: 'clock-buffers',
            name: ls({
              de: 'Taktpuffer',
              en: 'Clock Buffers',
            }),
            level: 2,
            sortOrder: 300,
          },
          {
            slug: 'jitter-cleaners',
            name: ls({
              de: 'Jitter-Cleaner',
              en: 'Jitter Cleaners',
            }),
            level: 2,
            sortOrder: 400,
          },
          {
            slug: 'frequency-synthesizers',
            name: ls({
              de: 'Frequenzsynthesizer',
              en: 'Frequency Synthesizers',
            }),
            level: 2,
            sortOrder: 500,
          },
        ],
      },
    ],
  },
];

/**
 * Attribut-Definitionen
 */

// Op-Amp Attribute
const opampAttributes: AttributeDef[] = [
  {
    name: 'supply_voltage_range',
    displayName: ls({
      de: 'Versorgungsspannungsbereich',
      en: 'Supply Voltage Range',
    }),
    unit: 'V',
    dataType: AttributeDataType.RANGE,
    scope: AttributeScope.BOTH,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'm', 'k'],
    sortOrder: 100,
  },
  {
    name: 'gbw',
    displayName: ls({
      de: 'Verstärkungs-Bandbreiten-Produkt',
      en: 'Gain-Bandwidth Product',
    }),
    unit: 'Hz',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'k', 'M', 'G'],
    sortOrder: 300,
  },
  {
    name: 'slew_rate',
    displayName: ls({
      de: 'Anstiegsrate',
      en: 'Slew Rate',
    }),
    unit: 'V/µs',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'm', 'k'],
    sortOrder: 400,
  },
  {
    name: 'input_offset_voltage',
    displayName: ls({
      de: 'Eingangs-Offsetspannung',
      en: 'Input Offset Voltage',
    }),
    unit: 'V',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'µ', 'm'],
    sortOrder: 500,
  },
  {
    name: 'input_bias_current',
    displayName: ls({
      de: 'Eingangs-Biasstrom',
      en: 'Input Bias Current',
    }),
    unit: 'A',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'p', 'n', 'µ', 'm'],
    sortOrder: 600,
  },
  {
    name: 'cmrr',
    displayName: ls({
      de: 'Gleichtaktunterdrückung',
      en: 'Common-Mode Rejection Ratio',
    }),
    unit: 'dB',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-'],
    sortOrder: 700,
  },
];

// Logic IC Attribute
const logicAttributes: AttributeDef[] = [
  {
    name: 'logic_family',
    displayName: ls({
      de: 'Logikfamilie',
      en: 'Logic Family',
    }),
    dataType: AttributeDataType.SELECT,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedValues: ['CMOS', 'TTL', 'LVTTL', 'LVCMOS', 'ECL', 'HCT', 'HC', 'LS', 'ALS', 'AS', 'F'],
    sortOrder: 100,
  },
  {
    name: 'supply_voltage_range',
    displayName: ls({
      de: 'Versorgungsspannungsbereich',
      en: 'Supply Voltage Range',
    }),
    unit: 'V',
    dataType: AttributeDataType.RANGE,
    scope: AttributeScope.BOTH,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'm', 'k'],
    sortOrder: 200,
  },
  {
    name: 'propagation_delay',
    displayName: ls({
      de: 'Laufzeit',
      en: 'Propagation Delay',
    }),
    unit: 'ns',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'p', 'n', 'µ'],
    sortOrder: 300,
  },
  {
    name: 'channels',
    displayName: ls({
      de: 'Anzahl Kanäle',
      en: 'Number of Channels',
    }),
    dataType: AttributeDataType.INTEGER,
    scope: AttributeScope.COMPONENT,
    isFilterable: true,
    isRequired: false,
    sortOrder: 400,
  },
];

// ADC/DAC Attribute
const converterAttributes: AttributeDef[] = [
  {
    name: 'resolution',
    displayName: ls({
      de: 'Auflösung',
      en: 'Resolution',
    }),
    unit: 'bit',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.COMPONENT,
    isFilterable: true,
    isRequired: true,
    isLabel: true,
    allowedPrefixes: ['-'],
    sortOrder: 100,
  },
  {
    name: 'sample_rate',
    displayName: ls({
      de: 'Abtastrate',
      en: 'Sample Rate',
    }),
    unit: 'Hz',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'k', 'M', 'G'],
    sortOrder: 200,
  },
  {
    name: 'input_voltage_range',
    displayName: ls({
      de: 'Eingangsspannungsbereich',
      en: 'Input Voltage Range',
    }),
    unit: 'V',
    dataType: AttributeDataType.RANGE,
    scope: AttributeScope.BOTH,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'm', 'k'],
    sortOrder: 300,
  },
  {
    name: 'snr',
    displayName: ls({
      de: 'Signal-Rausch-Verhältnis',
      en: 'Signal-to-Noise Ratio',
    }),
    unit: 'dB',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-'],
    sortOrder: 400,
  },
  {
    name: 'thd',
    displayName: ls({
      de: 'Klirrfaktor',
      en: 'Total Harmonic Distortion',
    }),
    unit: 'dB',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-'],
    sortOrder: 500,
  },
];

// Memory Attribute
const memoryAttributes: AttributeDef[] = [
  {
    name: 'capacity',
    displayName: ls({
      de: 'Speicherkapazität',
      en: 'Memory Capacity',
    }),
    unit: 'bit',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.COMPONENT,
    isFilterable: true,
    isRequired: true,
    isLabel: true,
    allowedPrefixes: ['-', 'k', 'M', 'G'],
    sortOrder: 100,
  },
  {
    name: 'interface',
    displayName: ls({
      de: 'Schnittstelle',
      en: 'Interface',
    }),
    dataType: AttributeDataType.SELECT,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedValues: ['Parallel', 'SPI', 'I2C', 'QSPI', 'UART', 'USB'],
    sortOrder: 200,
  },
  {
    name: 'access_time',
    displayName: ls({
      de: 'Zugriffszeit',
      en: 'Access Time',
    }),
    unit: 'ns',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'p', 'n', 'µ'],
    sortOrder: 300,
  },
  {
    name: 'retention',
    displayName: ls({
      de: 'Datenerhalt',
      en: 'Data Retention',
    }),
    unit: 'years',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-'],
    sortOrder: 400,
  },
];

// MCU Attribute
const mcuAttributes: AttributeDef[] = [
  {
    name: 'architecture',
    displayName: ls({
      de: 'Architektur',
      en: 'Architecture',
    }),
    dataType: AttributeDataType.SELECT,
    scope: AttributeScope.COMPONENT,
    isFilterable: true,
    isRequired: true,
    allowedValues: ['8-bit', '16-bit', '32-bit', '64-bit'],
    sortOrder: 100,
  },
  {
    name: 'flash_size',
    displayName: ls({
      de: 'Flash-Speicher',
      en: 'Flash Memory',
    }),
    unit: 'B',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'k', 'M', 'G'],
    sortOrder: 200,
  },
  {
    name: 'ram_size',
    displayName: ls({
      de: 'RAM-Speicher',
      en: 'RAM Memory',
    }),
    unit: 'B',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'k', 'M', 'G'],
    sortOrder: 300,
  },
  {
    name: 'max_frequency',
    displayName: ls({
      de: 'Maximale Taktfrequenz',
      en: 'Maximum Frequency',
    }),
    unit: 'Hz',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.BOTH,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'k', 'M', 'G'],
    sortOrder: 400,
  },
  {
    name: 'io_count',
    displayName: ls({
      de: 'Anzahl I/O-Pins',
      en: 'I/O Pin Count',
    }),
    dataType: AttributeDataType.INTEGER,
    scope: AttributeScope.COMPONENT,
    isFilterable: true,
    isRequired: false,
    sortOrder: 500,
  },
];

// Power Management Attribute
const powerManagementAttributes: AttributeDef[] = [
  {
    name: 'input_voltage_range',
    displayName: ls({
      de: 'Eingangsspannungsbereich',
      en: 'Input Voltage Range',
    }),
    unit: 'V',
    dataType: AttributeDataType.RANGE,
    scope: AttributeScope.BOTH,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'm', 'k'],
    sortOrder: 100,
  },
  {
    name: 'output_voltage_range',
    displayName: ls({
      de: 'Ausgangsspannungsbereich',
      en: 'Output Voltage Range',
    }),
    unit: 'V',
    dataType: AttributeDataType.RANGE,
    scope: AttributeScope.BOTH,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'm', 'k'],
    sortOrder: 200,
  },
  {
    name: 'output_current',
    displayName: ls({
      de: 'Ausgangsstrom',
      en: 'Output Current',
    }),
    unit: 'A',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'µ', 'm', 'k'],
    sortOrder: 300,
  },
  {
    name: 'efficiency',
    displayName: ls({
      de: 'Wirkungsgrad',
      en: 'Efficiency',
    }),
    unit: '%',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-'],
    sortOrder: 400,
  },
  {
    name: 'switching_frequency',
    displayName: ls({
      de: 'Schaltfrequenz',
      en: 'Switching Frequency',
    }),
    unit: 'Hz',
    dataType: AttributeDataType.DECIMAL,
    scope: AttributeScope.PART,
    isFilterable: true,
    isRequired: false,
    allowedPrefixes: ['-', 'k', 'M', 'G'],
    sortOrder: 500,
  },
];

/**
 * Hauptfunktion zum Seeden der Integrated Circuits
 */
export async function seedIntegratedCircuits(prisma: PrismaClient): Promise<void> {
  console.log('🔌 Seeding Integrated Circuits...');

  // Kategorien erstellen
  const categoryMap = await createCategoryTree(prisma, integratedCircuitsCategories);

  // Attribute zuweisen
  const attributeAssignments = [
    // Op-Amps (alle Subtypen)
    { slug: 'general-purpose-opamps', attributes: opampAttributes },
    { slug: 'precision-opamps', attributes: opampAttributes },
    { slug: 'high-speed-opamps', attributes: opampAttributes },
    { slug: 'low-power-opamps', attributes: opampAttributes },
    { slug: 'rail-to-rail-opamps', attributes: opampAttributes },
    { slug: 'instrumentation-amplifiers', attributes: opampAttributes },
    { slug: 'difference-amplifiers', attributes: opampAttributes },

    // Logic Gates (alle Subtypen)
    { slug: 'and-gates', attributes: logicAttributes },
    { slug: 'or-gates', attributes: logicAttributes },
    { slug: 'nand-gates', attributes: logicAttributes },
    { slug: 'nor-gates', attributes: logicAttributes },
    { slug: 'xor-gates', attributes: logicAttributes },
    { slug: 'inverters', attributes: logicAttributes },
    { slug: 'buffers', attributes: logicAttributes },
    { slug: 'schmitt-trigger', attributes: logicAttributes },

    // Flip-Flops
    { slug: 'd-flip-flops', attributes: logicAttributes },
    { slug: 'jk-flip-flops', attributes: logicAttributes },
    { slug: 'sr-flip-flops', attributes: logicAttributes },

    // Counters
    { slug: 'binary-counters', attributes: logicAttributes },
    { slug: 'decade-counters', attributes: logicAttributes },
    { slug: 'updown-counters', attributes: logicAttributes },

    // ADC/DAC
    { slug: 'sar-adc', attributes: converterAttributes },
    { slug: 'sigma-delta-adc', attributes: converterAttributes },
    { slug: 'pipeline-adc', attributes: converterAttributes },
    { slug: 'flash-adc', attributes: converterAttributes },
    { slug: 'r2r-dac', attributes: converterAttributes },
    { slug: 'sigma-delta-dac', attributes: converterAttributes },
    { slug: 'current-steering-dac', attributes: converterAttributes },

    // Memory
    { slug: 'sram', attributes: memoryAttributes },
    { slug: 'dram', attributes: memoryAttributes },
    { slug: 'nor-flash', attributes: memoryAttributes },
    { slug: 'nand-flash', attributes: memoryAttributes },
    { slug: 'eeprom', attributes: memoryAttributes },
    { slug: 'eprom', attributes: memoryAttributes },
    { slug: 'prom', attributes: memoryAttributes },
    { slug: 'rom', attributes: memoryAttributes },
    { slug: 'nvram', attributes: memoryAttributes },
    { slug: 'fram', attributes: memoryAttributes },
    { slug: 'mram', attributes: memoryAttributes },

    // MCU
    { slug: 'avr', attributes: mcuAttributes },
    { slug: 'pic', attributes: mcuAttributes },
    { slug: '8051', attributes: mcuAttributes },
    { slug: 'msp430', attributes: mcuAttributes },
    { slug: 'dspic', attributes: mcuAttributes },
    { slug: 'arm-cortex-m', attributes: mcuAttributes },
    { slug: 'arm-cortex-a', attributes: mcuAttributes },
    { slug: 'riscv', attributes: mcuAttributes },
    { slug: 'esp32', attributes: mcuAttributes },

    // Power Management
    { slug: 'buck-converters', attributes: powerManagementAttributes },
    { slug: 'boost-converters', attributes: powerManagementAttributes },
    { slug: 'buck-boost', attributes: powerManagementAttributes },
    { slug: 'flyback-controllers', attributes: powerManagementAttributes },
    { slug: 'forward-controllers', attributes: powerManagementAttributes },
    { slug: 'led-drivers', attributes: powerManagementAttributes },
  ];

  for (const assignment of attributeAssignments) {
    const categoryId = categoryMap.get(assignment.slug);
    if (categoryId) {
      await createAttributes(prisma, categoryId, assignment.attributes);
    } else {
      console.warn(`⚠️  Category not found: ${assignment.slug}`);
    }
  }

  console.log('✅ Integrated Circuits seeded successfully');
}
