// ElectroVault - Seed: Packages / Bauformen
// Umfassende Sammlung von Gehäuseformen für alle Bauteiltypen

import { PrismaClient } from '@prisma/client';
import { MountingType } from './types';

// Package Group IDs (müssen mit 07a-package-groups.ts übereinstimmen!)
// UUID Format: 8-4-4-4-12 Hex-Zeichen
const PACKAGE_GROUP_IDS = {
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

export async function seedPackages(prisma: PrismaClient): Promise<void> {
  console.log('📦 Seeding packages...');

  // ============================================
  // THROUGH-HOLE PACKAGES
  // ============================================

  // DIP - Dual In-line Package
  const dipPackages = [
    { name: 'DIP-4', pinCount: 4, pitchMm: 2.54, widthMm: 7.62 },
    { name: 'DIP-6', pinCount: 6, pitchMm: 2.54, widthMm: 7.62 },
    { name: 'DIP-8', pinCount: 8, pitchMm: 2.54, widthMm: 7.62 },
    { name: 'DIP-14', pinCount: 14, pitchMm: 2.54, widthMm: 7.62 },
    { name: 'DIP-16', pinCount: 16, pitchMm: 2.54, widthMm: 7.62 },
    { name: 'DIP-18', pinCount: 18, pitchMm: 2.54, widthMm: 7.62 },
    { name: 'DIP-20', pinCount: 20, pitchMm: 2.54, widthMm: 7.62 },
    { name: 'DIP-24', pinCount: 24, pitchMm: 2.54, widthMm: 15.24 },
    { name: 'DIP-28', pinCount: 28, pitchMm: 2.54, widthMm: 15.24 },
    { name: 'DIP-32', pinCount: 32, pitchMm: 2.54, widthMm: 15.24 },
    { name: 'DIP-40', pinCount: 40, pitchMm: 2.54, widthMm: 15.24 },
    { name: 'DIP-48', pinCount: 48, pitchMm: 2.54, widthMm: 15.24 },
    { name: 'DIP-64', pinCount: 64, pitchMm: 2.54, widthMm: 19.05 },
  ];

  for (const pkg of dipPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: MountingType.THT,
        pinCount: pkg.pinCount,
        pitchMm: pkg.pitchMm,
        widthMm: pkg.widthMm,
        jedecStandard: 'MS-001',
        description: `${pkg.pinCount}-pin Dual In-line Package, 2.54mm pitch`,
      },
    });
  }

  // SIP - Single In-line Package
  const sipPackages = [3, 4, 5, 6, 7, 8, 9, 10, 12];
  for (const pins of sipPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: `sip-${pins}` },
      update: {},
      create: {
        name: `SIP-${pins}`,
        slug: `sip-${pins}`,
        mountingType: MountingType.THT,
        pinCount: pins,
        pitchMm: 2.54,
        description: `${pins}-pin Single In-line Package`,
      },
    });
  }

  // TO Packages (Transistor Outline)
  const toPackages = [
    { name: 'TO-3', description: 'Metal can, high power transistors', mounting: MountingType.CHASSIS },
    { name: 'TO-5', description: 'Metal can, 3-8 leads', mounting: MountingType.THT },
    { name: 'TO-8', description: 'Metal can, larger than TO-5', mounting: MountingType.THT },
    { name: 'TO-18', description: 'Metal can, small signal transistors', mounting: MountingType.THT },
    { name: 'TO-39', description: 'Metal can, similar to TO-5', mounting: MountingType.THT },
    { name: 'TO-46', description: 'Metal can, small package', mounting: MountingType.THT },
    { name: 'TO-52', description: 'Metal can, 4 leads', mounting: MountingType.THT },
    { name: 'TO-66', description: 'Metal case, power semiconductors', mounting: MountingType.CHASSIS },
    { name: 'TO-92', description: 'Plastic, small signal transistors', mounting: MountingType.THT },
    { name: 'TO-92L', description: 'TO-92 Long leads', mounting: MountingType.THT },
    { name: 'TO-94', description: 'High power package', mounting: MountingType.CHASSIS },
    { name: 'TO-99', description: 'Metal can, 8 leads', mounting: MountingType.THT },
    { name: 'TO-100', description: 'Metal can, 10 leads', mounting: MountingType.THT },
    { name: 'TO-126', description: 'Plastic, medium power', mounting: MountingType.THT },
    { name: 'TO-202', description: 'Plastic, similar to TO-126', mounting: MountingType.THT },
    { name: 'TO-218', description: 'Plastic, high power', mounting: MountingType.THT },
    { name: 'TO-220', description: 'Plastic, power semiconductors', mounting: MountingType.THT },
    { name: 'TO-220F', description: 'TO-220 Full-pak (isolated)', mounting: MountingType.THT },
    { name: 'TO-220AB', description: 'TO-220 3-lead standard', mounting: MountingType.THT },
    { name: 'TO-220-5', description: 'TO-220 5-lead variant', mounting: MountingType.THT },
    { name: 'TO-247', description: 'Plastic, high power', mounting: MountingType.THT },
    { name: 'TO-247AC', description: 'TO-247 3-lead', mounting: MountingType.THT },
    { name: 'TO-248', description: 'Super TO-247', mounting: MountingType.THT },
    { name: 'TO-251', description: 'I-Pak', mounting: MountingType.THT },
    { name: 'TO-252', description: 'D-Pak (SMD version available)', mounting: MountingType.THT },
    { name: 'TO-262', description: 'I2-Pak', mounting: MountingType.THT },
    { name: 'TO-263', description: 'D2-Pak', mounting: MountingType.SMD },
    { name: 'TO-264', description: 'Large power package', mounting: MountingType.THT },
    { name: 'TO-274', description: 'Super D2-Pak', mounting: MountingType.SMD },
  ];

  for (const pkg of toPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: pkg.mounting,
        description: pkg.description,
      },
    });
  }

  // Axial Packages
  const axialPackages = [
    { name: 'DO-7', description: 'Glass diode package' },
    { name: 'DO-13', description: 'Power diode' },
    { name: 'DO-14', description: 'Power diode' },
    { name: 'DO-15', description: 'Axial diode 400-600V' },
    { name: 'DO-26', description: 'Small axial diode' },
    { name: 'DO-34', description: 'Mini axial diode' },
    { name: 'DO-35', description: 'Small signal diode' },
    { name: 'DO-41', description: '1A rectifier diode' },
    { name: 'DO-201', description: 'Large power diode' },
    { name: 'DO-201AD', description: '3A rectifier' },
    { name: 'DO-204', description: 'Axial diode family' },
    { name: 'MELF', description: 'Metal Electrode Leadless Face' },
    { name: 'MiniMELF', description: 'Small MELF' },
    { name: 'MicroMELF', description: 'Tiny MELF' },
  ];

  for (const pkg of axialPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: MountingType.AXIAL,
        description: pkg.description,
      },
    });
  }

  // Radial Capacitor Packages
  const radialPackages = [
    { name: 'Radial 2mm', pitchMm: 2.0, description: 'Radial electrolytic, 2mm pitch' },
    { name: 'Radial 2.5mm', pitchMm: 2.5, description: 'Radial electrolytic, 2.5mm pitch' },
    { name: 'Radial 3.5mm', pitchMm: 3.5, description: 'Radial electrolytic, 3.5mm pitch' },
    { name: 'Radial 5mm', pitchMm: 5.0, description: 'Radial electrolytic, 5mm pitch' },
    { name: 'Radial 7.5mm', pitchMm: 7.5, description: 'Radial electrolytic, 7.5mm pitch' },
    { name: 'Radial 10mm', pitchMm: 10.0, description: 'Radial electrolytic, 10mm pitch' },
  ];

  for (const pkg of radialPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase().replace(/\s+/g, '-').replace(/\./, '') },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase().replace(/\s+/g, '-').replace(/\./, ''),
        mountingType: MountingType.RADIAL,
        pitchMm: pkg.pitchMm,
        description: pkg.description,
      },
    });
  }

  // ============================================
  // SMD PACKAGES - CHIP RESISTORS/CAPACITORS
  // ============================================

  const chipPackages = [
    { name: '01005', imperial: '01005', metric: '0402M', lengthMm: 0.4, widthMm: 0.2 },
    { name: '0201', imperial: '0201', metric: '0603M', lengthMm: 0.6, widthMm: 0.3 },
    { name: '0402', imperial: '0402', metric: '1005M', lengthMm: 1.0, widthMm: 0.5 },
    { name: '0603', imperial: '0603', metric: '1608M', lengthMm: 1.6, widthMm: 0.8 },
    { name: '0805', imperial: '0805', metric: '2012M', lengthMm: 2.0, widthMm: 1.25 },
    { name: '1206', imperial: '1206', metric: '3216M', lengthMm: 3.2, widthMm: 1.6 },
    { name: '1210', imperial: '1210', metric: '3225M', lengthMm: 3.2, widthMm: 2.5 },
    { name: '1218', imperial: '1218', metric: '3246M', lengthMm: 3.2, widthMm: 4.6 },
    { name: '1812', imperial: '1812', metric: '4532M', lengthMm: 4.5, widthMm: 3.2 },
    { name: '2010', imperial: '2010', metric: '5025M', lengthMm: 5.0, widthMm: 2.5 },
    { name: '2220', imperial: '2220', metric: '5750M', lengthMm: 5.7, widthMm: 5.0 },
    { name: '2512', imperial: '2512', metric: '6332M', lengthMm: 6.3, widthMm: 3.2 },
  ];

  for (const pkg of chipPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.imperial.toLowerCase() },
      update: {},
      create: {
        name: pkg.imperial,
        slug: pkg.imperial.toLowerCase(),
        mountingType: MountingType.SMD,
        lengthMm: pkg.lengthMm,
        widthMm: pkg.widthMm,
        eiaStandard: pkg.metric,
        description: `SMD chip package (Imperial: ${pkg.imperial}, Metric: ${pkg.metric})`,
      },
    });
  }

  // ============================================
  // SMD PACKAGES - IC PACKAGES
  // ============================================

  // SOIC - Small Outline IC
  const soicPackages = [
    { name: 'SOIC-8', pinCount: 8, pitchMm: 1.27, widthMm: 3.9 },
    { name: 'SOIC-8W', pinCount: 8, pitchMm: 1.27, widthMm: 5.3 },
    { name: 'SOIC-14', pinCount: 14, pitchMm: 1.27, widthMm: 3.9 },
    { name: 'SOIC-16', pinCount: 16, pitchMm: 1.27, widthMm: 3.9 },
    { name: 'SOIC-16W', pinCount: 16, pitchMm: 1.27, widthMm: 7.5 },
    { name: 'SOIC-18', pinCount: 18, pitchMm: 1.27, widthMm: 7.5 },
    { name: 'SOIC-20', pinCount: 20, pitchMm: 1.27, widthMm: 7.5 },
    { name: 'SOIC-24', pinCount: 24, pitchMm: 1.27, widthMm: 7.5 },
    { name: 'SOIC-28', pinCount: 28, pitchMm: 1.27, widthMm: 7.5 },
  ];

  for (const pkg of soicPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: MountingType.SMD,
        pinCount: pkg.pinCount,
        pitchMm: pkg.pitchMm,
        widthMm: pkg.widthMm,
        jedecStandard: 'MS-012/MS-013',
        description: `Small Outline IC, ${pkg.pinCount} pins, ${pkg.pitchMm}mm pitch`,
      },
    });
  }

  // SSOP - Shrink Small Outline Package
  const ssopPackages = [8, 14, 16, 20, 24, 28, 32, 48, 56];
  for (const pins of ssopPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: `ssop-${pins}` },
      update: {},
      create: {
        name: `SSOP-${pins}`,
        slug: `ssop-${pins}`,
        mountingType: MountingType.SMD,
        pinCount: pins,
        pitchMm: 0.65,
        description: `Shrink Small Outline Package, ${pins} pins, 0.65mm pitch`,
      },
    });
  }

  // TSSOP - Thin Shrink Small Outline Package
  const tssopPackages = [8, 14, 16, 20, 24, 28, 32, 38, 48, 56];
  for (const pins of tssopPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: `tssop-${pins}` },
      update: {},
      create: {
        name: `TSSOP-${pins}`,
        slug: `tssop-${pins}`,
        mountingType: MountingType.SMD,
        pinCount: pins,
        pitchMm: 0.65,
        heightMm: 1.0,
        description: `Thin Shrink Small Outline Package, ${pins} pins`,
      },
    });
  }

  // MSOP - Mini Small Outline Package
  const msopPackages = [8, 10, 12, 16];
  for (const pins of msopPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: `msop-${pins}` },
      update: {},
      create: {
        name: `MSOP-${pins}`,
        slug: `msop-${pins}`,
        mountingType: MountingType.SMD,
        pinCount: pins,
        pitchMm: 0.5,
        description: `Mini Small Outline Package, ${pins} pins`,
      },
    });
  }

  // QFP - Quad Flat Package
  const qfpPackages = [
    { name: 'LQFP-32', pins: 32, pitchMm: 0.8, sizeMm: 7 },
    { name: 'LQFP-44', pins: 44, pitchMm: 0.8, sizeMm: 10 },
    { name: 'LQFP-48', pins: 48, pitchMm: 0.5, sizeMm: 7 },
    { name: 'LQFP-64', pins: 64, pitchMm: 0.5, sizeMm: 10 },
    { name: 'LQFP-80', pins: 80, pitchMm: 0.5, sizeMm: 12 },
    { name: 'LQFP-100', pins: 100, pitchMm: 0.5, sizeMm: 14 },
    { name: 'LQFP-128', pins: 128, pitchMm: 0.4, sizeMm: 14 },
    { name: 'LQFP-144', pins: 144, pitchMm: 0.5, sizeMm: 20 },
    { name: 'LQFP-176', pins: 176, pitchMm: 0.5, sizeMm: 24 },
    { name: 'LQFP-208', pins: 208, pitchMm: 0.5, sizeMm: 28 },
    { name: 'TQFP-32', pins: 32, pitchMm: 0.8, sizeMm: 7 },
    { name: 'TQFP-44', pins: 44, pitchMm: 0.8, sizeMm: 10 },
    { name: 'TQFP-48', pins: 48, pitchMm: 0.5, sizeMm: 7 },
    { name: 'TQFP-64', pins: 64, pitchMm: 0.5, sizeMm: 10 },
    { name: 'TQFP-100', pins: 100, pitchMm: 0.5, sizeMm: 14 },
    { name: 'TQFP-144', pins: 144, pitchMm: 0.5, sizeMm: 20 },
    { name: 'PQFP-44', pins: 44, pitchMm: 0.8, sizeMm: 10 },
    { name: 'PQFP-100', pins: 100, pitchMm: 0.65, sizeMm: 14 },
    { name: 'PQFP-208', pins: 208, pitchMm: 0.5, sizeMm: 28 },
  ];

  for (const pkg of qfpPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: MountingType.SMD,
        pinCount: pkg.pins,
        pitchMm: pkg.pitchMm,
        lengthMm: pkg.sizeMm,
        widthMm: pkg.sizeMm,
        description: `Quad Flat Package, ${pkg.pins} pins, ${pkg.pitchMm}mm pitch, ${pkg.sizeMm}x${pkg.sizeMm}mm`,
      },
    });
  }

  // QFN/DFN - Quad/Dual Flat No-leads
  const qfnPackages = [
    { name: 'QFN-8', pins: 8, sizeMm: 2, pitchMm: 0.5 },
    { name: 'QFN-12', pins: 12, sizeMm: 3, pitchMm: 0.5 },
    { name: 'QFN-16', pins: 16, sizeMm: 3, pitchMm: 0.5 },
    { name: 'QFN-20', pins: 20, sizeMm: 4, pitchMm: 0.5 },
    { name: 'QFN-24', pins: 24, sizeMm: 4, pitchMm: 0.5 },
    { name: 'QFN-28', pins: 28, sizeMm: 5, pitchMm: 0.5 },
    { name: 'QFN-32', pins: 32, sizeMm: 5, pitchMm: 0.5 },
    { name: 'QFN-40', pins: 40, sizeMm: 6, pitchMm: 0.5 },
    { name: 'QFN-48', pins: 48, sizeMm: 7, pitchMm: 0.5 },
    { name: 'QFN-56', pins: 56, sizeMm: 8, pitchMm: 0.5 },
    { name: 'QFN-64', pins: 64, sizeMm: 9, pitchMm: 0.5 },
    { name: 'DFN-6', pins: 6, sizeMm: 2, pitchMm: 0.65 },
    { name: 'DFN-8', pins: 8, sizeMm: 3, pitchMm: 0.5 },
    { name: 'DFN-10', pins: 10, sizeMm: 3, pitchMm: 0.5 },
  ];

  for (const pkg of qfnPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: MountingType.SMD,
        pinCount: pkg.pins,
        pitchMm: pkg.pitchMm,
        lengthMm: pkg.sizeMm,
        widthMm: pkg.sizeMm,
        description: `${pkg.name.startsWith('Q') ? 'Quad' : 'Dual'} Flat No-leads, ${pkg.pins} pins`,
      },
    });
  }

  // BGA - Ball Grid Array
  const bgaPackages = [
    { name: 'BGA-49', pins: 49, pitchMm: 0.8 },
    { name: 'BGA-64', pins: 64, pitchMm: 0.8 },
    { name: 'BGA-81', pins: 81, pitchMm: 0.8 },
    { name: 'BGA-100', pins: 100, pitchMm: 0.8 },
    { name: 'BGA-144', pins: 144, pitchMm: 0.8 },
    { name: 'BGA-169', pins: 169, pitchMm: 0.8 },
    { name: 'BGA-196', pins: 196, pitchMm: 0.8 },
    { name: 'BGA-225', pins: 225, pitchMm: 0.8 },
    { name: 'BGA-256', pins: 256, pitchMm: 0.8 },
    { name: 'BGA-289', pins: 289, pitchMm: 1.0 },
    { name: 'BGA-324', pins: 324, pitchMm: 1.0 },
    { name: 'BGA-400', pins: 400, pitchMm: 1.0 },
    { name: 'BGA-484', pins: 484, pitchMm: 1.0 },
    { name: 'BGA-625', pins: 625, pitchMm: 1.0 },
    { name: 'BGA-676', pins: 676, pitchMm: 1.0 },
    { name: 'BGA-784', pins: 784, pitchMm: 1.0 },
    { name: 'BGA-900', pins: 900, pitchMm: 1.0 },
    { name: 'BGA-1156', pins: 1156, pitchMm: 1.0 },
  ];

  for (const pkg of bgaPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: MountingType.SMD,
        pinCount: pkg.pins,
        pitchMm: pkg.pitchMm,
        description: `Ball Grid Array, ${pkg.pins} balls, ${pkg.pitchMm}mm pitch`,
      },
    });
  }

  // CSP/WLCSP - Chip Scale Packages
  const cspPackages = [
    'WLCSP-4', 'WLCSP-6', 'WLCSP-8', 'WLCSP-9', 'WLCSP-12',
    'WLCSP-16', 'WLCSP-20', 'WLCSP-25', 'WLCSP-36', 'WLCSP-49',
  ];

  for (const name of cspPackages) {
    const pins = parseInt(name.split('-')[1]);
    await prisma.packageMaster.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: {
        name: name,
        slug: name.toLowerCase(),
        mountingType: MountingType.SMD,
        pinCount: pins,
        pitchMm: 0.4,
        description: `Wafer Level Chip Scale Package, ${pins} bumps`,
      },
    });
  }

  // SOT Packages - Small Outline Transistor
  const sotPackages = [
    { name: 'SOT-23', pins: 3, description: 'Small Outline Transistor, 3 leads' },
    { name: 'SOT-23-5', pins: 5, description: 'SOT-23 5-lead variant' },
    { name: 'SOT-23-6', pins: 6, description: 'SOT-23 6-lead variant' },
    { name: 'SOT-23-8', pins: 8, description: 'SOT-23 8-lead variant' },
    { name: 'SOT-89', pins: 3, description: 'Medium power SOT' },
    { name: 'SOT-143', pins: 4, description: 'SOT for RF transistors' },
    { name: 'SOT-223', pins: 4, description: 'Medium power, heat sink tab' },
    { name: 'SOT-323', pins: 3, description: 'SC-70, smaller than SOT-23' },
    { name: 'SOT-343', pins: 4, description: 'SC-70 4-lead' },
    { name: 'SOT-353', pins: 5, description: 'SC-70 5-lead' },
    { name: 'SOT-363', pins: 6, description: 'SC-70 6-lead' },
    { name: 'SOT-416', pins: 3, description: 'SC-75, very small' },
    { name: 'SOT-523', pins: 3, description: 'SC-89, tiny package' },
    { name: 'SOT-553', pins: 5, description: 'SC-89 5-lead' },
    { name: 'SOT-563', pins: 6, description: 'SC-89 6-lead' },
    { name: 'SOT-666', pins: 6, description: 'Ultra small SOT' },
    { name: 'SOT-723', pins: 3, description: 'SC-105, extremely small' },
    { name: 'SOT-883', pins: 3, description: 'DFN 1x0.6mm' },
  ];

  for (const pkg of sotPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.name.toLowerCase() },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.name.toLowerCase(),
        mountingType: MountingType.SMD,
        pinCount: pkg.pins,
        description: pkg.description,
      },
    });
  }

  // Power SMD Packages
  const powerSmdPackages = [
    { name: 'D-Pak', slug: 'd-pak', pins: 3, description: 'TO-252, power SMD' },
    { name: 'D2-Pak', slug: 'd2-pak', pins: 3, description: 'TO-263, larger D-Pak' },
    { name: 'D3-Pak', slug: 'd3-pak', pins: 3, description: 'TO-268, largest D-Pak' },
    { name: 'I-Pak', slug: 'i-pak', pins: 3, description: 'TO-251, SMD I-Pak' },
    { name: 'S-Pak', slug: 's-pak', pins: 3, description: 'Super D-Pak' },
    { name: 'DPAK-5', slug: 'dpak-5', pins: 5, description: 'D-Pak 5-lead' },
    { name: 'LFPAK33', slug: 'lfpak33', pins: 3, description: 'NXP Loss Free Package 3.3x3.3mm' },
    { name: 'LFPAK56', slug: 'lfpak56', pins: 4, description: 'NXP Loss Free Package 5x6mm' },
    { name: 'PowerPAK SO-8', slug: 'powerpak-so-8', pins: 8, description: 'Vishay power package' },
    { name: 'PowerFLAT', slug: 'powerflat', pins: 8, description: 'ST power package' },
    { name: 'DirectFET', slug: 'directfet', pins: 8, description: 'IR/Infineon bare die' },
    { name: 'TOLL', slug: 'toll', pins: 4, description: 'TO-Leadless' },
  ];

  for (const pkg of powerSmdPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.slug },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.slug,
        mountingType: MountingType.SMD,
        pinCount: pkg.pins,
        description: pkg.description,
      },
    });
  }

  // PLCC - Plastic Leaded Chip Carrier
  const plccPackages = [20, 28, 32, 44, 52, 68, 84];
  for (const pins of plccPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: `plcc-${pins}` },
      update: {},
      create: {
        name: `PLCC-${pins}`,
        slug: `plcc-${pins}`,
        mountingType: MountingType.SMD,
        pinCount: pins,
        pitchMm: 1.27,
        description: `Plastic Leaded Chip Carrier, ${pins} pins`,
      },
    });
  }

  // ============================================
  // VACUUM TUBE SOCKETS (HISTORICAL)
  // ============================================

  const tubeSocketPackages = [
    { name: 'Octal', slug: 'octal', pins: 8, description: 'Standard 8-pin tube base (e.g., 6L6, EL34)' },
    { name: 'Noval', slug: 'noval', pins: 9, description: '9-pin miniature tube base (e.g., 12AX7, EL84)' },
    { name: 'Rimlock', slug: 'rimlock', pins: 8, description: 'European 8-pin base with rim' },
    { name: 'Loctal', slug: 'loctal', pins: 8, description: 'Locking 8-pin base' },
    { name: 'Magnoval', slug: 'magnoval', pins: 9, description: 'Large 9-pin base for power tubes' },
    { name: 'Compactron', slug: 'compactron', pins: 12, description: '12-pin base for late tubes' },
    { name: 'Duodecar', slug: 'duodecar', pins: 12, description: '12-pin European base' },
    { name: 'Nuvistor', slug: 'nuvistor', pins: 7, description: 'Miniature metal tube base' },
    { name: 'Acorn', slug: 'acorn', pins: 5, description: 'UHF tube base' },
    { name: 'UX4', slug: 'ux4', pins: 4, description: '4-pin American base (e.g., 2A3)' },
    { name: 'UX5', slug: 'ux5', pins: 5, description: '5-pin American base (e.g., 27)' },
    { name: 'UX6', slug: 'ux6', pins: 6, description: '6-pin American base (e.g., 6A7)' },
    { name: 'UX7', slug: 'ux7', pins: 7, description: '7-pin American base' },
    { name: 'European 5-pin', slug: 'european-5-pin', pins: 5, description: 'European 5-pin tube base' },
    { name: 'B7G', slug: 'b7g', pins: 7, description: 'British 7-pin miniature' },
    { name: 'B9A', slug: 'b9a', pins: 9, description: 'Same as Noval' },
  ];

  for (const pkg of tubeSocketPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: `tube-${pkg.slug}` },
      update: {},
      create: {
        name: `Tube Socket ${pkg.name}`,
        slug: `tube-${pkg.slug}`,
        mountingType: MountingType.CHASSIS,
        pinCount: pkg.pins,
        description: pkg.description,
      },
    });
  }

  // ============================================
  // MODULE PACKAGES
  // ============================================

  const modulePackages = [
    { name: 'SIP Module', slug: 'sip-module', description: 'Single In-line Pin Module' },
    { name: 'DIP Module', slug: 'dip-module', description: 'Dual In-line Pin Module' },
    { name: 'SIMM-30', slug: 'simm-30', pins: 30, description: '30-pin Single Inline Memory Module' },
    { name: 'SIMM-72', slug: 'simm-72', pins: 72, description: '72-pin Single Inline Memory Module' },
    { name: 'DIMM-168', slug: 'dimm-168', pins: 168, description: 'SDRAM DIMM' },
    { name: 'DIMM-184', slug: 'dimm-184', pins: 184, description: 'DDR DIMM' },
    { name: 'DIMM-240', slug: 'dimm-240', pins: 240, description: 'DDR2/DDR3 DIMM' },
    { name: 'DIMM-288', slug: 'dimm-288', pins: 288, description: 'DDR4/DDR5 DIMM' },
    { name: 'SO-DIMM-72', slug: 'so-dimm-72', pins: 72, description: 'Small Outline DIMM' },
    { name: 'SO-DIMM-144', slug: 'so-dimm-144', pins: 144, description: 'SO-DIMM SDR' },
    { name: 'SO-DIMM-200', slug: 'so-dimm-200', pins: 200, description: 'SO-DIMM DDR/DDR2' },
    { name: 'SO-DIMM-204', slug: 'so-dimm-204', pins: 204, description: 'SO-DIMM DDR3' },
    { name: 'SO-DIMM-260', slug: 'so-dimm-260', pins: 260, description: 'SO-DIMM DDR4' },
    { name: 'SO-DIMM-262', slug: 'so-dimm-262', pins: 262, description: 'SO-DIMM DDR5' },
    { name: 'LGA-775', slug: 'lga-775', pins: 775, description: 'Intel Socket T' },
    { name: 'LGA-1151', slug: 'lga-1151', pins: 1151, description: 'Intel Socket H4' },
    { name: 'LGA-1200', slug: 'lga-1200', pins: 1200, description: 'Intel 10th/11th Gen' },
    { name: 'LGA-1700', slug: 'lga-1700', pins: 1700, description: 'Intel 12th/13th/14th Gen' },
    { name: 'AM4', slug: 'am4', pins: 1331, description: 'AMD Ryzen Socket' },
    { name: 'AM5', slug: 'am5', pins: 1718, description: 'AMD Ryzen 7000 Socket' },
  ];

  for (const pkg of modulePackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.slug },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.slug,
        mountingType: MountingType.OTHER,
        pinCount: pkg.pins,
        description: pkg.description,
      },
    });
  }

  // LED Packages
  const ledPackages = [
    { name: 'LED 3mm', slug: 'led-3mm', mountingType: MountingType.THT, pinCount: 2, description: 'Standard 3mm through-hole LED' },
    { name: 'LED 5mm', slug: 'led-5mm', mountingType: MountingType.THT, pinCount: 2, description: 'Standard 5mm through-hole LED' },
    { name: 'LED 8mm', slug: 'led-8mm', mountingType: MountingType.THT, pinCount: 2, description: '8mm through-hole LED' },
    { name: 'LED 10mm', slug: 'led-10mm', mountingType: MountingType.THT, pinCount: 2, description: '10mm through-hole LED' },
    { name: 'LED 1.8mm', slug: 'led-1-8mm', mountingType: MountingType.THT, pinCount: 2, description: '1.8mm subminiature LED' },
    { name: 'PLCC-2', slug: 'plcc-2', mountingType: MountingType.SMD, pinCount: 2, description: 'SMD LED package' },
    { name: 'PLCC-4', slug: 'plcc-4', mountingType: MountingType.SMD, pinCount: 4, description: 'SMD LED RGB package' },
    { name: 'PLCC-6', slug: 'plcc-6', mountingType: MountingType.SMD, pinCount: 6, description: 'SMD LED RGBW package' },
    { name: '5050', slug: 'led-5050', mountingType: MountingType.SMD, description: '5.0x5.0mm SMD LED' },
    { name: '3528', slug: 'led-3528', mountingType: MountingType.SMD, description: '3.5x2.8mm SMD LED' },
    { name: '2835', slug: 'led-2835', mountingType: MountingType.SMD, description: '2.8x3.5mm SMD LED' },
    { name: 'WS2812B', slug: 'ws2812b', mountingType: MountingType.SMD, pinCount: 4, description: 'Addressable RGB LED' },
  ];

  for (const pkg of ledPackages) {
    await prisma.packageMaster.upsert({
      where: { slug: pkg.slug },
      update: {},
      create: {
        name: pkg.name,
        slug: pkg.slug,
        mountingType: pkg.mountingType,
        pinCount: pkg.pinCount,
        description: pkg.description,
      },
    });
  }

  // ============================================
  // ASSIGN PACKAGES TO GROUPS
  // ============================================

  console.log('📦 Assigning packages to groups...');

  // DIP packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'dip-' } },
    data: { groupId: PACKAGE_GROUP_IDS.DIP },
  });

  // SIP packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'sip-' } },
    data: { groupId: PACKAGE_GROUP_IDS.SIP },
  });

  // TO packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'to-' } },
    data: { groupId: PACKAGE_GROUP_IDS.TO },
  });

  // SMD Chip packages (0402, 0603, 0805, etc.)
  await prisma.packageMaster.updateMany({
    where: {
      slug: {
        in: ['01005', '0201', '0402', '0603', '0805', '1206', '1210', '1218', '1812', '2010', '2220', '2512'],
      },
    },
    data: { groupId: PACKAGE_GROUP_IDS.SMD_CHIP },
  });

  // SOIC packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'soic-' } },
    data: { groupId: PACKAGE_GROUP_IDS.SOIC },
  });

  // SSOP/TSSOP packages
  await prisma.packageMaster.updateMany({
    where: {
      OR: [
        { slug: { startsWith: 'ssop-' } },
        { slug: { startsWith: 'tssop-' } },
      ],
    },
    data: { groupId: PACKAGE_GROUP_IDS.SSOP_TSSOP },
  });

  // MSOP packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'msop-' } },
    data: { groupId: PACKAGE_GROUP_IDS.MSOP },
  });

  // QFP packages (LQFP, TQFP, PQFP)
  await prisma.packageMaster.updateMany({
    where: {
      OR: [
        { slug: { startsWith: 'lqfp-' } },
        { slug: { startsWith: 'tqfp-' } },
        { slug: { startsWith: 'pqfp-' } },
      ],
    },
    data: { groupId: PACKAGE_GROUP_IDS.QFP },
  });

  // QFN/DFN packages
  await prisma.packageMaster.updateMany({
    where: {
      OR: [
        { slug: { startsWith: 'qfn-' } },
        { slug: { startsWith: 'dfn-' } },
      ],
    },
    data: { groupId: PACKAGE_GROUP_IDS.QFN_DFN },
  });

  // BGA packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'bga-' } },
    data: { groupId: PACKAGE_GROUP_IDS.BGA },
  });

  // CSP/WLCSP packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'wlcsp-' } },
    data: { groupId: PACKAGE_GROUP_IDS.CSP_WLCSP },
  });

  // SOT packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'sot-' } },
    data: { groupId: PACKAGE_GROUP_IDS.SOT },
  });

  // Axial packages (DO-xx, MELF)
  await prisma.packageMaster.updateMany({
    where: {
      OR: [
        { slug: { startsWith: 'do-' } },
        { slug: { contains: 'melf' } },
      ],
    },
    data: { groupId: PACKAGE_GROUP_IDS.AXIAL },
  });

  // Radial packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'radial-' } },
    data: { groupId: PACKAGE_GROUP_IDS.RADIAL },
  });

  // Power SMD packages
  await prisma.packageMaster.updateMany({
    where: {
      slug: {
        in: ['d-pak', 'd2-pak', 'd3-pak', 'i-pak', 's-pak', 'dpak-5', 'lfpak33', 'lfpak56', 'powerpak-so-8', 'powerflat', 'directfet', 'toll'],
      },
    },
    data: { groupId: PACKAGE_GROUP_IDS.POWER_SMD },
  });

  // PLCC packages (excluding LED PLCC-2/4/6)
  await prisma.packageMaster.updateMany({
    where: {
      slug: { startsWith: 'plcc-' },
      pinCount: { gte: 20 },
    },
    data: { groupId: PACKAGE_GROUP_IDS.PLCC },
  });

  // Tube socket packages
  await prisma.packageMaster.updateMany({
    where: { slug: { startsWith: 'tube-' } },
    data: { groupId: PACKAGE_GROUP_IDS.TUBE_SOCKET },
  });

  // Memory modules (SIMM, DIMM, SO-DIMM)
  await prisma.packageMaster.updateMany({
    where: {
      OR: [
        { slug: { startsWith: 'simm-' } },
        { slug: { startsWith: 'dimm-' } },
        { slug: { startsWith: 'so-dimm-' } },
      ],
    },
    data: { groupId: PACKAGE_GROUP_IDS.MEMORY },
  });

  // CPU sockets
  await prisma.packageMaster.updateMany({
    where: {
      slug: {
        in: ['lga-775', 'lga-1151', 'lga-1200', 'lga-1700', 'am4', 'am5'],
      },
    },
    data: { groupId: PACKAGE_GROUP_IDS.CPU_SOCKET },
  });

  // LED packages
  await prisma.packageMaster.updateMany({
    where: {
      OR: [
        { slug: { startsWith: 'led-' } },
        { slug: { in: ['plcc-2', 'plcc-4', 'plcc-6', 'ws2812b'] } },
      ],
    },
    data: { groupId: PACKAGE_GROUP_IDS.LED },
  });

  console.log('✅ Packages seeded');
}
