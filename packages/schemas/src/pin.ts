/**
 * Pin Mapping Schemas - Pin-Definitionen für ManufacturerParts
 */
import { z } from 'zod';
import {
  LocalizedStringSchema,
  LocalizedStringOptionalSchema,
  UUIDSchema,
  PinTypeSchema,
} from './common';

// ============================================
// PIN RESPONSE SCHEMAS
// ============================================

/**
 * Pin-Mapping Response
 */
export const PinMappingSchema = z.object({
  id: UUIDSchema,
  partId: UUIDSchema,
  pinNumber: z.string(),
  pinName: z.string(),
  pinFunction: LocalizedStringSchema.nullable(),
  pinType: PinTypeSchema.nullable(),
  maxVoltage: z.number().nullable(),
  maxCurrent: z.number().nullable(),
});

export type PinMapping = z.infer<typeof PinMappingSchema>;

// ============================================
// PIN INPUT SCHEMAS
// ============================================

/**
 * Input für neuen Pin
 */
export const CreatePinSchema = z.object({
  pinNumber: z.string().min(1).max(20),
  pinName: z.string().min(1).max(100),
  pinFunction: LocalizedStringOptionalSchema,
  pinType: PinTypeSchema.nullable().optional(),
  maxVoltage: z.number().positive().optional(),
  maxCurrent: z.number().positive().optional(),
});

export type CreatePinInput = z.infer<typeof CreatePinSchema>;

/**
 * Input für Pin-Update
 */
export const UpdatePinSchema = CreatePinSchema.partial();

export type UpdatePinInput = z.infer<typeof UpdatePinSchema>;

/**
 * Bulk-Create Input
 */
export const BulkCreatePinsSchema = z.object({
  pins: z.array(CreatePinSchema).min(1),
});

export type BulkCreatePinsInput = z.infer<typeof BulkCreatePinsSchema>;

/**
 * Pin-Reorder Input
 */
export const ReorderPinSchema = z.object({
  id: UUIDSchema,
  pinNumber: z.string().min(1).max(20),
});

export const BulkReorderPinsSchema = z.object({
  pins: z.array(ReorderPinSchema).min(1),
});

export type ReorderPinInput = z.infer<typeof ReorderPinSchema>;
export type BulkReorderPinsInput = z.infer<typeof BulkReorderPinsSchema>;
