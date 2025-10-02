import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.union([z.string(), z.null()]).optional().transform(val => val === '' || val === null ? null : val),
  content: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : val,
    z.union([z.string().min(1), z.null()]).optional()
  ),
  audioUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null
      if (typeof val === 'string' && val.trim() === '') return null
      return val
    },
    z.union([
      z.string().url().max(500),
      z.string().regex(/^\//).max(500), // Allow relative URLs starting with /
      z.string().regex(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/).max(500), // Allow YouTube URLs
      z.null()
    ]).optional()
  ),
  mediaId: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().uuid().nullable().optional()
  ),
  orderPosition: z.number().int().min(0).optional(),
  textAlign: z.enum(['left', 'right']).default('left'),
  verticalAlign: z.enum(['top', 'center', 'bottom']).default('center'),
  parentId: z.string().uuid().nullable().optional(),
  isFavorite: z.boolean().optional(),
  articleType: z.preprocess(
    (val) => val === '' || val === 'none' ? null : val,
    z.enum(['meditation', 'education', 'personal', 'spiritual', 'routine']).nullable().optional()
  ),
  rowBackgroundColor: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional()
  ),
  rowPublishTimeStart: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional()
  ),
  rowPublishTimeEnd: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional()
  ),
  rowPublishDays: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().max(200).nullable().optional()
  ),
  publishTimeStart: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional()
  ),
  publishTimeEnd: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional()
  ),
  publishDays: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().max(200).nullable().optional()
  ),
  isChallenge: z.boolean().optional().default(false),
  challengeDuration: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : val,
    z.number().int().nullable().optional()
  ),
  challengeStartDate: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : val,
    z.union([z.string().datetime(), z.date(), z.null()]).nullable().optional()
  ),
  challengeEndDate: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : val,
    z.union([z.string().datetime(), z.date(), z.null()]).nullable().optional()
  ),
})

export const reorderSchema = z.object({
  articles: z.array(
    z.object({
      id: z.string().uuid(),
      orderPosition: z.number().int().min(0),
    })
  ),
})

export const documentationSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.union([z.string(), z.null()]).optional().transform(val => val === '' || val === null ? null : val),
  content: z.string().min(1, "Content is required and cannot be empty"),
  orderPosition: z.number().int().min(0).optional(),
  textAlign: z.enum(['left', 'right']).default('left'),
  verticalAlign: z.enum(['top', 'center', 'bottom']).default('center'),
  parentId: z.string().uuid().nullable().optional(),
})

export const reorderDocsSchema = z.object({
  docs: z.array(
    z.object({
      id: z.string().uuid(),
      orderPosition: z.number().int().min(0),
    })
  ),
})

export type ArticleInput = z.infer<typeof articleSchema>
export type ReorderInput = z.infer<typeof reorderSchema>
export type DocumentationInput = z.infer<typeof documentationSchema>
export type ReorderDocsInput = z.infer<typeof reorderDocsSchema>