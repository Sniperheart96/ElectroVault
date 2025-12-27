// ElectroVault - Seed Script
// Initiale Stammdaten für Kategorien und Bauformen

import { PrismaClient, MountingType, AttributeScope, AttributeDataType } from '@prisma/client';

const prisma = new PrismaClient();

type LocalizedString = {
  de: string;
  en: string;
  fr?: string;
  es?: string;
  zh?: string;
};

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // KATEGORIEN - Hierarchische Struktur
  // ============================================
  console.log('📂 Seeding categories...');

  // Domain-Level (0): Passive Components
  const passiveComponents = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'passive-components' },
    update: {},
    create: {
      slug: 'passive-components',
      name: { de: 'Passive Bauelemente', en: 'Passive Components' } as LocalizedString,
      level: 0,
      sortOrder: 1,
    },
  });

  // Family-Level (1): Capacitors
  const capacitors = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'capacitors' },
    update: {},
    create: {
      slug: 'capacitors',
      name: { de: 'Kondensatoren', en: 'Capacitors', fr: 'Condensateurs' } as LocalizedString,
      level: 1,
      parentId: passiveComponents.id,
      sortOrder: 1,
    },
  });

  // Type-Level (2): Electrolytic Capacitors
  const electrolyticCaps = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'electrolytic-capacitors' },
    update: {},
    create: {
      slug: 'electrolytic-capacitors',
      name: { de: 'Elektrolytkondensatoren', en: 'Electrolytic Capacitors' } as LocalizedString,
      level: 2,
      parentId: capacitors.id,
      sortOrder: 1,
    },
  });

  // Subtype-Level (3): Aluminum Electrolytic
  await prisma.categoryTaxonomy.upsert({
    where: { slug: 'aluminum-electrolytic' },
    update: {},
    create: {
      slug: 'aluminum-electrolytic',
      name: { de: 'Aluminium-Elektrolytkondensatoren', en: 'Aluminum Electrolytic' } as LocalizedString,
      level: 3,
      parentId: electrolyticCaps.id,
      sortOrder: 1,
    },
  });

  // Type: Ceramic Capacitors
  await prisma.categoryTaxonomy.upsert({
    where: { slug: 'ceramic-capacitors' },
    update: {},
    create: {
      slug: 'ceramic-capacitors',
      name: { de: 'Keramik-Kondensatoren', en: 'Ceramic Capacitors' } as LocalizedString,
      level: 2,
      parentId: capacitors.id,
      sortOrder: 2,
    },
  });

  // Type: Film Capacitors
  await prisma.categoryTaxonomy.upsert({
    where: { slug: 'film-capacitors' },
    update: {},
    create: {
      slug: 'film-capacitors',
      name: { de: 'Folienkondensatoren', en: 'Film Capacitors' } as LocalizedString,
      level: 2,
      parentId: capacitors.id,
      sortOrder: 3,
    },
  });

  // Family: Resistors
  const resistors = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'resistors' },
    update: {},
    create: {
      slug: 'resistors',
      name: { de: 'Widerstände', en: 'Resistors' } as LocalizedString,
      level: 1,
      parentId: passiveComponents.id,
      sortOrder: 2,
    },
  });

  // Family: Inductors
  await prisma.categoryTaxonomy.upsert({
    where: { slug: 'inductors' },
    update: {},
    create: {
      slug: 'inductors',
      name: { de: 'Spulen', en: 'Inductors' } as LocalizedString,
      level: 1,
      parentId: passiveComponents.id,
      sortOrder: 3,
    },
  });

  // Domain-Level (0): Semiconductors
  const semiconductors = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'semiconductors' },
    update: {},
    create: {
      slug: 'semiconductors',
      name: { de: 'Halbleiter', en: 'Semiconductors' } as LocalizedString,
      level: 0,
      sortOrder: 2,
    },
  });

  // Family: Integrated Circuits
  const integratedCircuits = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'integrated-circuits' },
    update: {},
    create: {
      slug: 'integrated-circuits',
      name: { de: 'Integrierte Schaltungen', en: 'Integrated Circuits' } as LocalizedString,
      level: 1,
      parentId: semiconductors.id,
      sortOrder: 1,
    },
  });

  // Type: Analog ICs
  const analogICs = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'analog-ics' },
    update: {},
    create: {
      slug: 'analog-ics',
      name: { de: 'Analoge ICs', en: 'Analog ICs' } as LocalizedString,
      level: 2,
      parentId: integratedCircuits.id,
      sortOrder: 1,
    },
  });

  // Subtype: Timers (555 Familie)
  await prisma.categoryTaxonomy.upsert({
    where: { slug: 'timers' },
    update: {},
    create: {
      slug: 'timers',
      name: { de: 'Timer-ICs', en: 'Timer ICs' } as LocalizedString,
      level: 3,
      parentId: analogICs.id,
      sortOrder: 1,
      description: { de: 'z.B. 555, 556 Timer', en: 'e.g. 555, 556 Timers' } as LocalizedString,
    },
  });

  // Domain-Level (0): Vacuum Tubes (Historisch)
  const vacuumTubes = await prisma.categoryTaxonomy.upsert({
    where: { slug: 'vacuum-tubes' },
    update: {},
    create: {
      slug: 'vacuum-tubes',
      name: { de: 'Vakuumröhren', en: 'Vacuum Tubes' } as LocalizedString,
      level: 0,
      sortOrder: 3,
      description: { de: 'Historische Elektronenröhren', en: 'Historic Vacuum Tubes' } as LocalizedString,
    },
  });

  // Family: Triodes
  await prisma.categoryTaxonomy.upsert({
    where: { slug: 'triodes' },
    update: {},
    create: {
      slug: 'triodes',
      name: { de: 'Trioden', en: 'Triodes' } as LocalizedString,
      level: 1,
      parentId: vacuumTubes.id,
      sortOrder: 1,
    },
  });

  console.log('✅ Categories seeded');

  // ============================================
  // ATTRIBUT-DEFINITIONEN
  // ============================================
  console.log('🏷️  Seeding attribute definitions...');

  // Attribute für Kondensatoren
  await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: capacitors.id, name: 'capacitance' } },
    update: {},
    create: {
      categoryId: capacitors.id,
      name: 'capacitance',
      displayName: { de: 'Kapazität', en: 'Capacitance' } as LocalizedString,
      unit: 'F',
      siUnit: 'F',
      siMultiplier: 1,
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: true,
      sortOrder: 1,
    },
  });

  await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: capacitors.id, name: 'voltage_rating' } },
    update: {},
    create: {
      categoryId: capacitors.id,
      name: 'voltage_rating',
      displayName: { de: 'Spannungsfestigkeit', en: 'Voltage Rating' } as LocalizedString,
      unit: 'V',
      siUnit: 'V',
      siMultiplier: 1,
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.BOTH,
      isFilterable: true,
      isRequired: true,
      sortOrder: 2,
    },
  });

  await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: electrolyticCaps.id, name: 'esr' } },
    update: {},
    create: {
      categoryId: electrolyticCaps.id,
      name: 'esr',
      displayName: { de: 'ESR', en: 'ESR (Equivalent Series Resistance)' } as LocalizedString,
      unit: 'Ω',
      siUnit: 'Ω',
      siMultiplier: 1,
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.PART,
      isFilterable: true,
      isRequired: false,
      sortOrder: 3,
    },
  });

  // Attribute für Widerstände
  await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: resistors.id, name: 'resistance' } },
    update: {},
    create: {
      categoryId: resistors.id,
      name: 'resistance',
      displayName: { de: 'Widerstandswert', en: 'Resistance' } as LocalizedString,
      unit: 'Ω',
      siUnit: 'Ω',
      siMultiplier: 1,
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.COMPONENT,
      isFilterable: true,
      isRequired: true,
      sortOrder: 1,
    },
  });

  await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: resistors.id, name: 'tolerance' } },
    update: {},
    create: {
      categoryId: resistors.id,
      name: 'tolerance',
      displayName: { de: 'Toleranz', en: 'Tolerance' } as LocalizedString,
      unit: '%',
      dataType: AttributeDataType.DECIMAL,
      scope: AttributeScope.PART,
      isFilterable: true,
      isRequired: false,
      sortOrder: 2,
    },
  });

  console.log('✅ Attribute definitions seeded');

  // ============================================
  // BAUFORMEN (PACKAGES)
  // ============================================
  console.log('📦 Seeding package masters...');

  // THT Packages
  await prisma.packageMaster.upsert({
    where: { slug: 'dip-8' },
    update: {},
    create: {
      slug: 'dip-8',
      name: 'DIP-8',
      mountingType: MountingType.THT,
      pinCount: 8,
      pitchMm: 2.54,
      lengthMm: 9.27,
      widthMm: 6.35,
      jedecStandard: 'MS-001',
      description: 'Dual In-line Package, 8 Pins',
    },
  });

  await prisma.packageMaster.upsert({
    where: { slug: 'dip-14' },
    update: {},
    create: {
      slug: 'dip-14',
      name: 'DIP-14',
      mountingType: MountingType.THT,
      pinCount: 14,
      pitchMm: 2.54,
      lengthMm: 19.05,
      widthMm: 6.35,
      jedecStandard: 'MS-001',
      description: 'Dual In-line Package, 14 Pins',
    },
  });

  await prisma.packageMaster.upsert({
    where: { slug: 'to-220' },
    update: {},
    create: {
      slug: 'to-220',
      name: 'TO-220',
      mountingType: MountingType.THT,
      pinCount: 3,
      lengthMm: 10.16,
      widthMm: 15.24,
      heightMm: 4.57,
      jedecStandard: 'TO-220',
      description: 'Transistor Outline, Power Package',
    },
  });

  // SMD Packages
  await prisma.packageMaster.upsert({
    where: { slug: 'soic-8' },
    update: {},
    create: {
      slug: 'soic-8',
      name: 'SOIC-8',
      mountingType: MountingType.SMD,
      pinCount: 8,
      pitchMm: 1.27,
      lengthMm: 4.9,
      widthMm: 3.9,
      jedecStandard: 'MS-012',
      description: 'Small Outline Integrated Circuit, 8 Pins',
    },
  });

  await prisma.packageMaster.upsert({
    where: { slug: '0805' },
    update: {},
    create: {
      slug: '0805',
      name: '0805',
      mountingType: MountingType.SMD,
      lengthMm: 2.0,
      widthMm: 1.25,
      heightMm: 0.5,
      eiaStandard: '0805',
      description: 'SMD Chip Package (Metric: 2012)',
    },
  });

  await prisma.packageMaster.upsert({
    where: { slug: '1206' },
    update: {},
    create: {
      slug: '1206',
      name: '1206',
      mountingType: MountingType.SMD,
      lengthMm: 3.2,
      widthMm: 1.6,
      heightMm: 0.55,
      eiaStandard: '1206',
      description: 'SMD Chip Package (Metric: 3216)',
    },
  });

  // Radial Packages (für Elkos)
  await prisma.packageMaster.upsert({
    where: { slug: 'radial-5mm' },
    update: {},
    create: {
      slug: 'radial-5mm',
      name: 'Radial 5mm',
      mountingType: MountingType.RADIAL,
      pinCount: 2,
      pitchMm: 2.5,
      lengthMm: 5.0,
      description: 'Radial Electrolytic Capacitor, 5mm Diameter',
    },
  });

  await prisma.packageMaster.upsert({
    where: { slug: 'radial-10mm' },
    update: {},
    create: {
      slug: 'radial-10mm',
      name: 'Radial 10mm',
      mountingType: MountingType.RADIAL,
      pinCount: 2,
      pitchMm: 5.0,
      lengthMm: 10.0,
      description: 'Radial Electrolytic Capacitor, 10mm Diameter',
    },
  });

  console.log('✅ Package masters seeded');

  // ============================================
  // HERSTELLER (Beispiele)
  // ============================================
  console.log('🏭 Seeding manufacturers...');

  await prisma.manufacturerMaster.upsert({
    where: { slug: 'texas-instruments' },
    update: {},
    create: {
      slug: 'texas-instruments',
      name: 'Texas Instruments',
      cageCode: '01295',
      countryCode: 'US',
      website: 'https://www.ti.com',
      foundedYear: 1930,
      description: { de: 'US-amerikanischer Halbleiterhersteller', en: 'American semiconductor manufacturer' } as LocalizedString,
    },
  });

  await prisma.manufacturerMaster.upsert({
    where: { slug: 'nxp' },
    update: {},
    create: {
      slug: 'nxp',
      name: 'NXP Semiconductors',
      cageCode: 'S3465',
      countryCode: 'NL',
      website: 'https://www.nxp.com',
      foundedYear: 2006,
      description: { de: 'Niederländischer Halbleiterhersteller', en: 'Dutch semiconductor manufacturer' } as LocalizedString,
    },
  });

  await prisma.manufacturerMaster.upsert({
    where: { slug: 'signetics' },
    update: {},
    create: {
      slug: 'signetics',
      name: 'Signetics',
      cageCode: '06032',
      countryCode: 'US',
      foundedYear: 1961,
      defunctYear: 1997,
      status: 'ACQUIRED',
      description: { de: 'Historischer US-Halbleiterhersteller, übernommen von Philips/NXP', en: 'Historic US semiconductor manufacturer, acquired by Philips/NXP' } as LocalizedString,
    },
  });

  console.log('✅ Manufacturers seeded');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
