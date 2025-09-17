import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.union([z.string(), z.null()]).optional().transform(val => val === '' || val === null ? null : val),
  content: z.string().min(1, "Content is required and cannot be empty"),
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