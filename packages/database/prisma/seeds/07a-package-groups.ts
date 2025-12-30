// ElectroVault - Seed: Package Groups (Bauformen-Gruppierung)
// Organisiert Packages in logische Kategorien

import { PrismaClient } from '@prisma/client';

export interface PackageGroupData {
  id: string;
  slug: string;
  name: { de: string; en: string };
  description: { de: string; en: string };
  sortOrder: number;
}

// Exportiere Gruppen-IDs für Verwendung in 08-packages.ts
// UUID Format: 8-4-4-4-12 Hex-Zeichen
export const PACKAGE_GROUP_IDS = {
  DIP: '00000000-0000-4000-a001-000000000001',
  SIP: '00000000-0000-4000-a001-000000000002',
  TO: '00000000-0000-4000-a001-000000000003',
  SMD_CHIP: '00000000-0000-4000-a001-000000000004',
  SOIC: '00000000-0000-4000-a001-000000000005',
  SSOP_TSSOP: '00000000-0000-4000-a001-000000000006',
  QFP: '00000000-0000-4000-a001-000000000007',
  QFN_DFN: '00000000-0000-4000-a001-000000000008',
  BGA: '00000000-0000-4000-a001-000000000009',
  SOT: '00000000-0000-4000-a001-00000000000a',
  AXIAL: '00000000-0000-4000-a001-00000000000b',
  RADIAL: '00000000-0000-4000-a001-00000000000c',
  POWER_SMD: '00000000-0000-4000-a001-00000000000d',
  TUBE_SOCKET: '00000000-0000-4000-a001-00000000000e',
  MEMORY: '00000000-0000-4000-a001-00000000000f',
  LED: '00000000-0000-4000-a001-000000000010',
  PLCC: '00000000-0000-4000-a001-000000000011',
  CSP_WLCSP: '00000000-0000-4000-a001-000000000012',
  CPU_SOCKET: '00000000-0000-4000-a001-000000000013',
  MSOP: '00000000-0000-4000-a001-000000000014',
};

const packageGroups: PackageGroupData[] = [
  {
    id: PACKAGE_GROUP_IDS.DIP,
    slug: 'dip',
    name: { de: 'DIP (Dual In-line Package)', en: 'DIP (Dual In-line Package)' },
    description: {
      de: 'Klassisches THT-Gehäuse mit zwei parallelen Pinreihen im 2,54mm Raster',
      en: 'Classic THT package with two parallel pin rows at 2.54mm pitch',
    },
    sortOrder: 0,
  },
  {
    id: PACKAGE_GROUP_IDS.SIP,
    slug: 'sip',
    name: { de: 'SIP (Single In-line Package)', en: 'SIP (Single In-line Package)' },
    description: {
      de: 'THT-Gehäuse mit einer einzelnen Pinreihe',
      en: 'THT package with a single row of pins',
    },
    sortOrder: 1,
  },
  {
    id: PACKAGE_GROUP_IDS.TO,
    slug: 'to-transistor-outline',
    name: { de: 'TO (Transistor Outline)', en: 'TO (Transistor Outline)' },
    description: {
      de: 'Standard-Transistorgehäuse in verschiedenen Größen (TO-92, TO-220, TO-247, etc.)',
      en: 'Standard transistor packages in various sizes (TO-92, TO-220, TO-247, etc.)',
    },
    sortOrder: 2,
  },
  {
    id: PACKAGE_GROUP_IDS.SMD_CHIP,
    slug: 'smd-chip',
    name: { de: 'SMD Chip (0402, 0603, 0805, ...)', en: 'SMD Chip (0402, 0603, 0805, ...)' },
    description: {
      de: 'Kleine SMD-Gehäuse für Widerstände, Kondensatoren und Induktivitäten',
      en: 'Small SMD packages for resistors, capacitors, and inductors',
    },
    sortOrder: 3,
  },
  {
    id: PACKAGE_GROUP_IDS.SOIC,
    slug: 'soic',
    name: { de: 'SOIC (Small Outline IC)', en: 'SOIC (Small Outline IC)' },
    description: {
      de: 'SMD-IC-Gehäuse mit Gull-Wing-Pins im 1,27mm Raster',
      en: 'SMD IC package with gull-wing leads at 1.27mm pitch',
    },
    sortOrder: 4,
  },
  {
    id: PACKAGE_GROUP_IDS.SSOP_TSSOP,
    slug: 'ssop-tssop',
    name: { de: 'SSOP / TSSOP', en: 'SSOP / TSSOP' },
    description: {
      de: 'Shrink/Thin Small Outline Packages mit feinerem Pinraster',
      en: 'Shrink/Thin Small Outline Packages with finer pin pitch',
    },
    sortOrder: 5,
  },
  {
    id: PACKAGE_GROUP_IDS.MSOP,
    slug: 'msop',
    name: { de: 'MSOP (Mini Small Outline)', en: 'MSOP (Mini Small Outline)' },
    description: {
      de: 'Noch kleinere SOIC-Variante mit 0,5mm Raster',
      en: 'Even smaller SOIC variant with 0.5mm pitch',
    },
    sortOrder: 6,
  },
  {
    id: PACKAGE_GROUP_IDS.QFP,
    slug: 'qfp',
    name: { de: 'QFP (Quad Flat Package)', en: 'QFP (Quad Flat Package)' },
    description: {
      de: 'SMD-Gehäuse mit Pins an allen vier Seiten (LQFP, TQFP, PQFP)',
      en: 'SMD package with leads on all four sides (LQFP, TQFP, PQFP)',
    },
    sortOrder: 7,
  },
  {
    id: PACKAGE_GROUP_IDS.QFN_DFN,
    slug: 'qfn-dfn',
    name: { de: 'QFN / DFN (No-Lead)', en: 'QFN / DFN (No-Lead)' },
    description: {
      de: 'Leadless-Gehäuse mit Kontaktflächen statt Pins',
      en: 'Leadless packages with pads instead of leads',
    },
    sortOrder: 8,
  },
  {
    id: PACKAGE_GROUP_IDS.BGA,
    slug: 'bga',
    name: { de: 'BGA (Ball Grid Array)', en: 'BGA (Ball Grid Array)' },
    description: {
      de: 'Lötball-Array auf der Unterseite für hohe Pinzahlen',
      en: 'Solder ball array on bottom for high pin counts',
    },
    sortOrder: 9,
  },
  {
    id: PACKAGE_GROUP_IDS.CSP_WLCSP,
    slug: 'csp-wlcsp',
    name: { de: 'CSP / WLCSP', en: 'CSP / WLCSP' },
    description: {
      de: 'Chip-Scale und Wafer-Level Chip-Scale Packages',
      en: 'Chip-Scale and Wafer-Level Chip-Scale Packages',
    },
    sortOrder: 10,
  },
  {
    id: PACKAGE_GROUP_IDS.SOT,
    slug: 'sot',
    name: { de: 'SOT (Small Outline Transistor)', en: 'SOT (Small Outline Transistor)' },
    description: {
      de: 'Kleine SMD-Transistorgehäuse (SOT-23, SOT-223, SOT-323, etc.)',
      en: 'Small SMD transistor packages (SOT-23, SOT-223, SOT-323, etc.)',
    },
    sortOrder: 11,
  },
  {
    id: PACKAGE_GROUP_IDS.POWER_SMD,
    slug: 'power-smd',
    name: { de: 'Power SMD', en: 'Power SMD' },
    description: {
      de: 'SMD-Leistungsgehäuse wie D-Pak, D2-Pak, LFPAK',
      en: 'SMD power packages like D-Pak, D2-Pak, LFPAK',
    },
    sortOrder: 12,
  },
  {
    id: PACKAGE_GROUP_IDS.AXIAL,
    slug: 'axial',
    name: { de: 'Axial', en: 'Axial' },
    description: {
      de: 'Bauteile mit axialen Anschlussdrähten (Dioden, Widerstände)',
      en: 'Components with axial leads (diodes, resistors)',
    },
    sortOrder: 13,
  },
  {
    id: PACKAGE_GROUP_IDS.RADIAL,
    slug: 'radial',
    name: { de: 'Radial', en: 'Radial' },
    description: {
      de: 'Bauteile mit radialen Anschlüssen (Elkos, Keramik-Kondensatoren)',
      en: 'Components with radial leads (electrolytics, ceramic capacitors)',
    },
    sortOrder: 14,
  },
  {
    id: PACKAGE_GROUP_IDS.PLCC,
    slug: 'plcc',
    name: { de: 'PLCC', en: 'PLCC' },
    description: {
      de: 'Plastic Leaded Chip Carrier - J-Lead-Gehäuse',
      en: 'Plastic Leaded Chip Carrier - J-lead package',
    },
    sortOrder: 15,
  },
  {
    id: PACKAGE_GROUP_IDS.LED,
    slug: 'led',
    name: { de: 'LED-Gehäuse', en: 'LED Packages' },
    description: {
      de: 'Gehäuse für LEDs (THT und SMD)',
      en: 'Packages for LEDs (THT and SMD)',
    },
    sortOrder: 16,
  },
  {
    id: PACKAGE_GROUP_IDS.TUBE_SOCKET,
    slug: 'tube-socket',
    name: { de: 'Röhrensockel', en: 'Tube Sockets' },
    description: {
      de: 'Historische Sockeltypen für Elektronenröhren',
      en: 'Historical socket types for vacuum tubes',
    },
    sortOrder: 17,
  },
  {
    id: PACKAGE_GROUP_IDS.MEMORY,
    slug: 'memory-modules',
    name: { de: 'Speichermodule', en: 'Memory Modules' },
    description: {
      de: 'SIMM, DIMM und SO-DIMM Speichermodule',
      en: 'SIMM, DIMM and SO-DIMM memory modules',
    },
    sortOrder: 18,
  },
  {
    id: PACKAGE_GROUP_IDS.CPU_SOCKET,
    slug: 'cpu-socket',
    name: { de: 'CPU-Sockel', en: 'CPU Sockets' },
    description: {
      de: 'Prozessorsockel (LGA, AM4, AM5)',
      en: 'Processor sockets (LGA, AM4, AM5)',
    },
    sortOrder: 19,
  },
];

export async function seedPackageGroups(prisma: PrismaClient): Promise<void> {
  console.log('📦 Seeding package groups...');

  for (const group of packageGroups) {
    await prisma.packageGroup.upsert({
      where: { slug: group.slug },
      update: {
        name: group.name,
        description: group.description,
        sortOrder: group.sortOrder,
      },
      create: {
        id: group.id,
        slug: group.slug,
        name: group.name,
        description: group.description,
        sortOrder: group.sortOrder,
      },
    });
  }

  console.log('✅ Package groups seeded');
}
