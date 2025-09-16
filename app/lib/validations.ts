import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(500).optional().transform(val => val === '' ? null : val),
  content: z.string().min(1),
  audioUrl: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().url().max(500).nullable().optional()
  ),
  orderPosition: z.number().int().min(0).optional(),
  textAlign: z.enum(['left', 'right']).default('left'),
  verticalAlign: z.enum(['top', 'center', 'bottom']).default('center'),
  parentId: z.string().uuid().nullable().optional(),
})

export const reorderSchema = z.object({
  articles: z.array(
    z.object({
      id: z.string().uuid(),
      orderPosition: z.number().int().min(0),
    })
  ),
})

export type ArticleInput = z.infer<typeof articleSchema>
export type ReorderInput = z.infer<typeof reorderSchema>