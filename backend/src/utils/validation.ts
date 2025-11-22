import { z } from 'zod';

export const optimizePromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt is too long'),
  mode: z.enum(['enhanced', 'concise']).optional().default('concise'),
  metadata: z
    .object({
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
    })
    .optional(),
  save: z.boolean().optional().default(true),
});

export const historyQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be positive'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined)),
  search: z.string().optional(),
  favorites: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((val) => !val || !isNaN(val.getTime()), 'Invalid start date'),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((val) => !val || !isNaN(val.getTime()), 'Invalid end date'),
});

export const updatePromptSchema = z.object({
  isFavorite: z.boolean(),
});

export type OptimizePromptInput = z.infer<typeof optimizePromptSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
