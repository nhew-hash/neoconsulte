import { z } from 'zod';

export const telegramStatusSchema = z.object({
  status: z.enum(['disconnected', 'waiting_auth', 'connected', 'error', 'expired']).default('disconnected'),
  message: z.string().default('A conexão não foi inicializada.'),
  connectedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  qrCode: z.string().optional(),
  error: z.string().optional(),
});
