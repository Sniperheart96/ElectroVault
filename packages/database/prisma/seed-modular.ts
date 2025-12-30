// ElectroVault - Modulares Seed Script
// Importiert und führt alle Seed-Module aus

import { PrismaClient } from '@prisma/client';
import { seedPassiveComponents } from './seeds/01-passive-components';
import { seedActiveComponents } from './seeds/02-active-components';
import { seedIntegratedCircuits } from './seeds/03-integrated-circuits';
import { seedElectromechanical } from './seeds/04-electromechanical';
import { seedOptoelectronics } from './seeds/05-optoelectronics';
import { seedHistoricalComponents } from './seeds/06-historical-components';
import { seedRfSensorsPower } from './seeds/07-rf-sensors-power';
import { seedPackageGroups } from './seeds/07a-package-groups';
import { seedPackages } from './seeds/08-packages';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting modular seed...\n');

  // 1. Package Groups zuerst (Packages referenzieren diese)
  console.log('📦 [1/9] Seeding Package Groups...');
  await seedPackageGroups(prisma);
  console.log('✅ Package Groups seeded\n');

  // 2. Packages (referenzieren Package Groups)
  console.log('📦 [2/9] Seeding Packages...');
  await seedPackages(prisma);
  console.log('✅ Packages seeded\n');

  // 3. Passive Components (Resistors, Capacitors, Inductors, etc.)
  console.log('🔌 [3/9] Seeding Passive Components...');
  await seedPassiveComponents(prisma);
  console.log('✅ Passive Components seeded\n');

  // 4. Active Components (Diodes, Transistors, Thyristors, etc.)
  console.log('⚡ [4/9] Seeding Active Components...');
  await seedActiveComponents(prisma);
  console.log('✅ Active Components seeded\n');

  // 5. Integrated Circuits (OpAmps, Logic, MCUs, Memory, etc.)
  console.log('🧠 [5/9] Seeding Integrated Circuits...');
  await seedIntegratedCircuits(prisma);
  console.log('✅ Integrated Circuits seeded\n');

  // 6. Electromechanical (Connectors, Relays, Switches, Motors, etc.)
  console.log('🔧 [6/9] Seeding Electromechanical Components...');
  await seedElectromechanical(prisma);
  console.log('✅ Electromechanical Components seeded\n');

  // 7. Optoelectronics (LEDs, Displays, Photo Detectors, etc.)
  console.log('💡 [7/9] Seeding Optoelectronics...');
  await seedOptoelectronics(prisma);
  console.log('✅ Optoelectronics seeded\n');

  // 8. Historical Components (Vacuum Tubes, Germanium, etc.)
  console.log('📻 [8/9] Seeding Historical Components...');
  await seedHistoricalComponents(prisma);
  console.log('✅ Historical Components seeded\n');

  // 9. RF, Sensors & Power (Antennas, Sensors, Power Supplies, etc.)
  console.log('📡 [9/9] Seeding RF, Sensors & Power...');
  await seedRfSensorsPower(prisma);
  console.log('✅ RF, Sensors & Power seeded\n');

  console.log('🎉 Modular seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
