import { z } from 'zod';
import {
  MAX_ACTIVE_SEGMENTS,
  MAX_WEIGHT,
  MIN_ACTIVE_SEGMENTS,
  SEGMENT_TYPES,
} from './engine';

/** Id de loja/vendedor: os ids reais são UUID (gen_random_uuid). */
export const idSchema = z.string().trim().uuid('Identificador inválido.');

export const MAX_GRANT_PER_REQUEST = 50;

export const spinRequestSchema = z.object({
  storeId: idSchema,
  sellerId: idSchema,
});

export const grantRequestSchema = z.object({
  storeId: idSchema,
  sellerId: idSchema,
  credits: z
    .number({ invalid_type_error: 'Quantidade deve ser um número.' })
    .int('Quantidade deve ser um número inteiro.')
    .min(1, 'Conceda pelo menos 1 giro.')
    .max(MAX_GRANT_PER_REQUEST, `Máximo de ${MAX_GRANT_PER_REQUEST} giros por concessão.`),
});

export const segmentInputSchema = z
  .object({
    id: z.string().max(64).optional().nullable(),
    label: z.string().trim().min(1, 'Informe o nome do prêmio.').max(100, 'Nome com no máximo 100 caracteres.'),
    type: z.enum(SEGMENT_TYPES, { errorMap: () => ({ message: 'Tipo de prêmio inválido.' }) }),
    value: z.union([z.number(), z.null()]).optional(),
    description: z.string().trim().max(255, 'Descrição com no máximo 255 caracteres.').optional().nullable(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida.').optional().nullable(),
    weight: z
      .number({ invalid_type_error: 'Peso deve ser um número.' })
      .int('Peso deve ser um número inteiro.')
      .min(1, 'Prêmio ativo precisa de peso maior que zero.')
      .max(MAX_WEIGHT, `Peso máximo é ${MAX_WEIGHT}.`),
  })
  .superRefine((s, ctx) => {
    if (s.type === 'money') {
      if (s.value === null || s.value === undefined || !Number.isFinite(s.value) || s.value < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'Informe o valor em R$ (zero ou mais).' });
      }
    }
  });

export const settingsRequestSchema = z.object({
  storeId: idSchema,
  segments: z
    .array(segmentInputSchema)
    .min(MIN_ACTIVE_SEGMENTS, `A roleta precisa de pelo menos ${MIN_ACTIVE_SEGMENTS} prêmios ativos.`)
    .max(MAX_ACTIVE_SEGMENTS, `A roleta aceita no máximo ${MAX_ACTIVE_SEGMENTS} prêmios ativos.`),
});

export type SegmentInput = z.infer<typeof segmentInputSchema>;

/** Converte erros do zod em uma lista simples de mensagens (com a posição do prêmio, se houver). */
export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const [first, index] = issue.path;
    if (first === 'segments' && typeof index === 'number') return `Prêmio ${index + 1}: ${issue.message}`;
    return issue.message;
  });
}
