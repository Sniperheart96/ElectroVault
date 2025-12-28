/**
 * Pin Service Tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@electrovault/database';
import { pinService } from './pin.service';
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors';
import type { CreatePinInput, BulkCreatePinsInput } from '@electrovault/schemas';

describe('Pin Service', () => {
  let testManufacturerId: string;
  let testCoreComponentId: string;
  let testPartId: string;

  beforeAll(async () => {
    // Test-Manufacturer erstellen
    const manufacturer = await prisma.manufacturerMaster.create({
      data: {
        name: 'Test Manufacturer (Pins)',
        slug: 'test-mfr-pins',
      },
    });
    testManufacturerId = manufacturer.id;

    // Test-Kategorie erstellen
    const category = await prisma.categoryTaxonomy.create({
      data: {
        name: { en: 'Test Category (Pins)', de: 'Test-Kategorie (Pins)' },
        slug: 'test-category-pins',
        level: 1,
      },
    });

    // Test-CoreComponent erstellen
    const component = await prisma.coreComponent.create({
      data: {
        name: { en: 'Test Component (Pins)', de: 'Test-Komponente (Pins)' },
        slug: 'test-component-pins',
        categoryId: category.id,
      },
    });
    testCoreComponentId = component.id;

    // Test-ManufacturerPart erstellen
    const part = await prisma.manufacturerPart.create({
      data: {
        coreComponentId: testCoreComponentId,
        manufacturerId: testManufacturerId,
        mpn: 'TEST-PIN-001',
      },
    });
    testPartId = part.id;
  });

  afterAll(async () => {
    // Cleanup in korrekter Reihenfolge
    await prisma.pinMapping.deleteMany({ where: { partId: testPartId } });
    await prisma.manufacturerPart.deleteMany({ where: { id: testPartId } });
    await prisma.coreComponent.deleteMany({ where: { id: testCoreComponentId } });
    await prisma.categoryTaxonomy.deleteMany({ where: { slug: 'test-category-pins' } });
    await prisma.manufacturerMaster.deleteMany({ where: { id: testManufacturerId } });
  });

  beforeEach(async () => {
    // Alle Pins vor jedem Test löschen
    await prisma.pinMapping.deleteMany({ where: { partId: testPartId } });
  });

  describe('getPinsByPartId', () => {
    it('should return empty array for part without pins', async () => {
      const pins = await pinService.getPinsByPartId(testPartId);
      expect(pins).toEqual([]);
    });

    it('should return all pins for a part', async () => {
      // Pins erstellen
      await prisma.pinMapping.createMany({
        data: [
          { partId: testPartId, pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
          { partId: testPartId, pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
          { partId: testPartId, pinNumber: '3', pinName: 'OUT', pinType: 'OUTPUT' },
        ],
      });

      const pins = await pinService.getPinsByPartId(testPartId);
      expect(pins).toHaveLength(3);
      expect(pins[0].pinName).toBe('VCC');
      expect(pins[1].pinName).toBe('GND');
      expect(pins[2].pinName).toBe('OUT');
    });

    it('should throw NotFoundError for non-existent part', async () => {
      await expect(
        pinService.getPinsByPartId('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createPin', () => {
    it('should create a new pin', async () => {
      const input: CreatePinInput = {
        pinNumber: '1',
        pinName: 'VCC',
        pinType: 'POWER',
        maxVoltage: 5.0,
        maxCurrent: 1.0,
      };

      const pin = await pinService.createPin(testPartId, input);

      expect(pin.id).toBeDefined();
      expect(pin.pinNumber).toBe('1');
      expect(pin.pinName).toBe('VCC');
      expect(pin.pinType).toBe('POWER');
      expect(pin.maxVoltage).toBe(5.0);
      expect(pin.maxCurrent).toBe(1.0);
    });

    it('should create pin with localized function description', async () => {
      const input: CreatePinInput = {
        pinNumber: '1',
        pinName: 'VCC',
        pinFunction: { en: 'Power supply', de: 'Stromversorgung' },
        pinType: 'POWER',
      };

      const pin = await pinService.createPin(testPartId, input);

      expect(pin.pinFunction).toEqual({ en: 'Power supply', de: 'Stromversorgung' });
    });

    it('should throw ConflictError for duplicate pin number', async () => {
      const input: CreatePinInput = {
        pinNumber: '1',
        pinName: 'VCC',
        pinType: 'POWER',
      };

      await pinService.createPin(testPartId, input);

      await expect(pinService.createPin(testPartId, input)).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError for non-existent part', async () => {
      const input: CreatePinInput = {
        pinNumber: '1',
        pinName: 'VCC',
        pinType: 'POWER',
      };

      await expect(
        pinService.createPin('00000000-0000-0000-0000-000000000000', input)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updatePin', () => {
    it('should update pin properties', async () => {
      const created = await prisma.pinMapping.create({
        data: {
          partId: testPartId,
          pinNumber: '1',
          pinName: 'VCC',
          pinType: 'POWER',
        },
      });

      const updated = await pinService.updatePin(created.id, {
        pinName: 'VDD',
        maxVoltage: 3.3,
      });

      expect(updated.pinName).toBe('VDD');
      expect(updated.maxVoltage).toBe(3.3);
      expect(updated.pinNumber).toBe('1'); // Unverändert
    });

    it('should allow changing pin number if not conflicting', async () => {
      const created = await prisma.pinMapping.create({
        data: {
          partId: testPartId,
          pinNumber: '1',
          pinName: 'VCC',
          pinType: 'POWER',
        },
      });

      const updated = await pinService.updatePin(created.id, {
        pinNumber: '8',
      });

      expect(updated.pinNumber).toBe('8');
    });

    it('should throw ConflictError when changing to existing pin number', async () => {
      await prisma.pinMapping.createMany({
        data: [
          { partId: testPartId, pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
          { partId: testPartId, pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
        ],
      });

      const pin1 = await prisma.pinMapping.findFirst({
        where: { partId: testPartId, pinNumber: '1' },
      });

      await expect(
        pinService.updatePin(pin1!.id, { pinNumber: '2' })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError for non-existent pin', async () => {
      await expect(
        pinService.updatePin('00000000-0000-0000-0000-000000000000', { pinName: 'TEST' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deletePin', () => {
    it('should delete a pin', async () => {
      const created = await prisma.pinMapping.create({
        data: {
          partId: testPartId,
          pinNumber: '1',
          pinName: 'VCC',
          pinType: 'POWER',
        },
      });

      await pinService.deletePin(created.id);

      const deleted = await prisma.pinMapping.findUnique({
        where: { id: created.id },
      });
      expect(deleted).toBeNull();
    });

    it('should throw NotFoundError for non-existent pin', async () => {
      await expect(
        pinService.deletePin('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('bulkCreatePins', () => {
    it('should create multiple pins at once', async () => {
      const input: BulkCreatePinsInput = {
        pins: [
          { pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
          { pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
          { pinNumber: '3', pinName: 'IN', pinType: 'INPUT' },
          { pinNumber: '4', pinName: 'OUT', pinType: 'OUTPUT' },
        ],
      };

      const pins = await pinService.bulkCreatePins(testPartId, input);

      expect(pins).toHaveLength(4);
      expect(pins[0].pinName).toBe('VCC');
      expect(pins[3].pinName).toBe('OUT');
    });

    it('should throw BadRequestError for duplicate pin numbers in input', async () => {
      const input: BulkCreatePinsInput = {
        pins: [
          { pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
          { pinNumber: '1', pinName: 'GND', pinType: 'GROUND' }, // Duplikat
        ],
      };

      await expect(pinService.bulkCreatePins(testPartId, input)).rejects.toThrow(
        BadRequestError
      );
    });

    it('should throw ConflictError if any pin number already exists', async () => {
      await prisma.pinMapping.create({
        data: {
          partId: testPartId,
          pinNumber: '1',
          pinName: 'VCC',
          pinType: 'POWER',
        },
      });

      const input: BulkCreatePinsInput = {
        pins: [
          { pinNumber: '1', pinName: 'VCC', pinType: 'POWER' }, // Existiert bereits
          { pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
        ],
      };

      await expect(pinService.bulkCreatePins(testPartId, input)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('reorderPins', () => {
    it('should reorder pin numbers', async () => {
      const created = await prisma.pinMapping.createMany({
        data: [
          { partId: testPartId, pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
          { partId: testPartId, pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
          { partId: testPartId, pinNumber: '3', pinName: 'OUT', pinType: 'OUTPUT' },
        ],
      });

      const pins = await prisma.pinMapping.findMany({ where: { partId: testPartId } });

      await pinService.reorderPins(testPartId, [
        { id: pins[0].id, pinNumber: '8' },
        { id: pins[1].id, pinNumber: '4' },
        { id: pins[2].id, pinNumber: '1' },
      ]);

      const reordered = await prisma.pinMapping.findMany({
        where: { partId: testPartId },
        orderBy: { pinNumber: 'asc' },
      });

      expect(reordered[0].pinNumber).toBe('1');
      expect(reordered[0].pinName).toBe('OUT');
      expect(reordered[1].pinNumber).toBe('4');
      expect(reordered[1].pinName).toBe('GND');
      expect(reordered[2].pinNumber).toBe('8');
      expect(reordered[2].pinName).toBe('VCC');
    });

    it('should throw BadRequestError for duplicate pin numbers', async () => {
      const pins = await prisma.pinMapping.createMany({
        data: [
          { partId: testPartId, pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
          { partId: testPartId, pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
        ],
      });

      const allPins = await prisma.pinMapping.findMany({ where: { partId: testPartId } });

      await expect(
        pinService.reorderPins(testPartId, [
          { id: allPins[0].id, pinNumber: '1' },
          { id: allPins[1].id, pinNumber: '1' }, // Duplikat
        ])
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteAllPins', () => {
    it('should delete all pins for a part', async () => {
      await prisma.pinMapping.createMany({
        data: [
          { partId: testPartId, pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
          { partId: testPartId, pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
          { partId: testPartId, pinNumber: '3', pinName: 'OUT', pinType: 'OUTPUT' },
        ],
      });

      const count = await pinService.deleteAllPins(testPartId);

      expect(count).toBe(3);

      const remaining = await prisma.pinMapping.findMany({ where: { partId: testPartId } });
      expect(remaining).toHaveLength(0);
    });

    it('should return 0 if no pins exist', async () => {
      const count = await pinService.deleteAllPins(testPartId);
      expect(count).toBe(0);
    });
  });
});
