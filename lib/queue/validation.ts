import { z } from 'zod';

export const CATEGORIES = ['CPF', 'CNPJ', 'Nome', 'Telefone', 'Placa'] as const;
export type Category = (typeof CATEGORIES)[number];

const digits = (v: string) => v.replace(/\D/g, '');

export const validators: Record<Category, (v: string) => boolean> = {
  CPF: (v) => digits(v).length === 11,
  CNPJ: (v) => digits(v).length === 14,
  Telefone: (v) => digits(v).length >= 10 && digits(v).length <= 13,
  Placa: (v) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v.toUpperCase().replace(/[^A-Z0-9]/g, '')),
  Nome: (v) => v.trim().length >= 3,
};

export const querySchema = z
  .object({
    category: z.enum(CATEGORIES),
    input: z.string().trim().min(3).max(120),
  })
  .refine((d) => validators[d.category](d.input), {
    message: 'Valor inválido para a categoria selecionada',
    path: ['input'],
  });

export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9_-]{8,100}$/);
