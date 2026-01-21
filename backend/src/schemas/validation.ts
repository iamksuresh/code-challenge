import { z } from 'zod';

//Connection ID Validation
//Connection ID must be 3 digits (000-999)
export const connectionIdSchema = z
  .string()
  .regex(/^\d{3}$/, 'Connection ID must be exactly 3 digits (e.g., 001, 042, 999)');

//Name Validation
export const nameSchema = z
  .string()
  .min(3, 'Name must be at least 3 characters')
  .max(15, 'Name must be 15 characters or less')
  .regex(/^[a-zA-Z0-9]+$/, 'Name can only contain letters and numbers')
  .trim();

//Register Request Schema
export const registerRequestSchema = z.object({
  connectionId: connectionIdSchema,
  name: nameSchema,
});

//Validate Request Schema
export const validateRequestSchema = z.object({
  connectionId: connectionIdSchema,
});

//Chat Message Validation
export const chatMessageSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(1000, 'Message must be 1000 characters or less');

