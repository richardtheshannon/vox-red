import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(500).optional(),
  content: z.string().min(1),
  orderPosition: z.number().int().min(0).optional(),
  textAlign: z.enum(['left', 'right']).default('left'),
  verticalAlign: z.enum(['top', 'center', 'bottom']).default('center'),
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