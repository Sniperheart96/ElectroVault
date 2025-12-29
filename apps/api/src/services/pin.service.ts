/**
 * Pin Service - PinMapping-Verwaltung (CRUD)
 */

import { prisma } from '@electrovault/database';
import type {
  CreatePinInput,
  UpdatePinInput,
  BulkCreatePinsInput,
  ReorderPinInput,
  PinMapping,
  LocalizedString,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors';

/**
 * Pin Service
 */
export class PinService {
  /**
   * Gibt alle Pins eines CoreComponent zurück
   */
  async getPinsByComponentId(componentId: string): Promise<PinMapping[]> {
    // Prüfen ob Component existiert
    const component = await prisma.coreComponent.findUnique({
      where: { id: componentId, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('CoreComponent', componentId);
    }

    const pins = await prisma.pinMapping.findMany({
      where: { componentId },
      orderBy: [
        // Numerische Sortierung falls pinNumber eine Zahl ist
        { pinNumber: 'asc' },
      ],
    });

    return pins.map((pin) => ({
      ...pin,
      pinFunction: pin.pinFunction as LocalizedString | null,
      maxVoltage: pin.maxVoltage ? Number(pin.maxVoltage) : null,
      maxCurrent: pin.maxCurrent ? Number(pin.maxCurrent) : null,
    }));
  }

  /**
   * Erstellt einen neuen Pin
   */
  async createPin(
    componentId: string,
    data: CreatePinInput,
    userId?: string
  ): Promise<PinMapping> {
    // Prüfen ob Component existiert
    const component = await prisma.coreComponent.findUnique({
      where: { id: componentId, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('CoreComponent', componentId);
    }

    // Prüfen ob pinNumber bereits existiert
    const existing = await prisma.pinMapping.findUnique({
      where: {
        componentId_pinNumber: {
          componentId,
          pinNumber: data.pinNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictError(
        `Pin with number '${data.pinNumber}' already exists for this component`
      );
    }

    const pin = await prisma.pinMapping.create({
      data: {
        componentId,
        pinNumber: data.pinNumber,
        pinName: data.pinName,
        pinFunction: data.pinFunction ? (data.pinFunction as object) : undefined,
        pinType: data.pinType || null,
        maxVoltage: data.maxVoltage,
        maxCurrent: data.maxCurrent,
      },
    });

    return {
      ...pin,
      pinFunction: pin.pinFunction as LocalizedString | null,
      maxVoltage: pin.maxVoltage ? Number(pin.maxVoltage) : null,
      maxCurrent: pin.maxCurrent ? Number(pin.maxCurrent) : null,
    };
  }

  /**
   * Aktualisiert einen Pin
   */
  async updatePin(
    id: string,
    data: UpdatePinInput,
    userId?: string
  ): Promise<PinMapping> {
    const existing = await prisma.pinMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('PinMapping', id);
    }

    // Wenn pinNumber geändert wird, prüfen ob Konflikt
    if (data.pinNumber && data.pinNumber !== existing.pinNumber) {
      const conflict = await prisma.pinMapping.findUnique({
        where: {
          componentId_pinNumber: {
            componentId: existing.componentId,
            pinNumber: data.pinNumber,
          },
        },
      });

      if (conflict) {
        throw new ConflictError(
          `Pin with number '${data.pinNumber}' already exists for this component`
        );
      }
    }

    const pin = await prisma.pinMapping.update({
      where: { id },
      data: {
        pinNumber: data.pinNumber,
        pinName: data.pinName,
        pinFunction: data.pinFunction as any,
        pinType: data.pinType !== undefined ? data.pinType : undefined,
        maxVoltage: data.maxVoltage,
        maxCurrent: data.maxCurrent,
      },
    });

    return {
      ...pin,
      pinFunction: pin.pinFunction as LocalizedString | null,
      maxVoltage: pin.maxVoltage ? Number(pin.maxVoltage) : null,
      maxCurrent: pin.maxCurrent ? Number(pin.maxCurrent) : null,
    };
  }

  /**
   * Löscht einen Pin
   */
  async deletePin(id: string, userId?: string): Promise<void> {
    const pin = await prisma.pinMapping.findUnique({
      where: { id },
    });

    if (!pin) {
      throw new NotFoundError('PinMapping', id);
    }

    await prisma.pinMapping.delete({
      where: { id },
    });
  }

  /**
   * Erstellt mehrere Pins auf einmal
   */
  async bulkCreatePins(
    componentId: string,
    data: BulkCreatePinsInput,
    userId?: string
  ): Promise<PinMapping[]> {
    // Prüfen ob Component existiert
    const component = await prisma.coreComponent.findUnique({
      where: { id: componentId, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('CoreComponent', componentId);
    }

    // Prüfen auf doppelte pinNumbers im Input
    const pinNumbers = data.pins.map((p) => p.pinNumber);
    const duplicates = pinNumbers.filter((num, index) => pinNumbers.indexOf(num) !== index);

    if (duplicates.length > 0) {
      throw new BadRequestError(
        `Duplicate pin numbers in input: ${duplicates.join(', ')}`
      );
    }

    // Prüfen ob pinNumbers bereits existieren
    const existingPins = await prisma.pinMapping.findMany({
      where: {
        componentId,
        pinNumber: { in: pinNumbers },
      },
    });

    if (existingPins.length > 0) {
      const existingNumbers = existingPins.map((p) => p.pinNumber);
      throw new ConflictError(
        `Pins with these numbers already exist: ${existingNumbers.join(', ')}`
      );
    }

    // Transaktion für Bulk-Create
    const pins = await prisma.$transaction(
      data.pins.map((pin) =>
        prisma.pinMapping.create({
          data: {
            componentId,
            pinNumber: pin.pinNumber,
            pinName: pin.pinName,
            pinFunction: pin.pinFunction ? (pin.pinFunction as object) : undefined,
            pinType: pin.pinType || null,
            maxVoltage: pin.maxVoltage,
            maxCurrent: pin.maxCurrent,
          },
        })
      )
    );

    return pins.map((pin) => ({
      ...pin,
      pinFunction: pin.pinFunction as LocalizedString | null,
      maxVoltage: pin.maxVoltage ? Number(pin.maxVoltage) : null,
      maxCurrent: pin.maxCurrent ? Number(pin.maxCurrent) : null,
    }));
  }

  /**
   * Ändert die Reihenfolge/Nummern von Pins
   */
  async reorderPins(
    componentId: string,
    pinOrder: ReorderPinInput[],
    userId?: string
  ): Promise<void> {
    // Prüfen ob Component existiert
    const component = await prisma.coreComponent.findUnique({
      where: { id: componentId, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('CoreComponent', componentId);
    }

    // Prüfen ob alle Pins zum Component gehören
    const pinIds = pinOrder.map((p) => p.id);
    const pins = await prisma.pinMapping.findMany({
      where: {
        id: { in: pinIds },
        componentId,
      },
    });

    if (pins.length !== pinIds.length) {
      throw new BadRequestError('Some pins do not belong to this component or do not exist');
    }

    // Prüfen auf doppelte pinNumbers im neuen Layout
    const newNumbers = pinOrder.map((p) => p.pinNumber);
    const duplicates = newNumbers.filter((num, index) => newNumbers.indexOf(num) !== index);

    if (duplicates.length > 0) {
      throw new BadRequestError(
        `Duplicate pin numbers in reorder: ${duplicates.join(', ')}`
      );
    }

    // Transaktion für Bulk-Update
    await prisma.$transaction(
      pinOrder.map((item) =>
        prisma.pinMapping.update({
          where: { id: item.id },
          data: { pinNumber: item.pinNumber },
        })
      )
    );
  }

  /**
   * Löscht alle Pins eines Components
   */
  async deleteAllPins(componentId: string, userId?: string): Promise<number> {
    const result = await prisma.pinMapping.deleteMany({
      where: { componentId },
    });

    return result.count;
  }
}

// Singleton-Export
export const pinService = new PinService();
