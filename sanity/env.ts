// Prefer NEXT_PUBLIC_* env vars (used by the frontend), but fall back to
// non-prefixed variable names if your deployment adds them that way (e.g.
// SANITY_PROJECT_ID). This makes the project more tolerant to different
// host UIs (Netlify, etc.) while still failing loudly when nothing is set.
// Work in both local and Netlify:
// - Accept either NEXT_PUBLIC_* or SANITY_* env vars
// - In development, fall back to known-safe defaults (project xwf76fo4 / production)
// - In production, require envs to be set (fail fast)

const isProd = process.env.NODE_ENV === 'production'

export const apiVersion: string =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2025-11-19'

const maybeDataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  process.env.SANITY_DATASET ??
  (isProd ? undefined : 'production')

const maybeProjectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  process.env.SANITY_PROJECT_ID ??
  (isProd ? undefined : 'xwf76fo4')

if (isProd) {
  if (!maybeDataset) throw new Error('Missing environment variable: NEXT_PUBLIC_SANITY_DATASET or SANITY_DATASET')
  if (!maybeProjectId) throw new Error('Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_PROJECT_ID')
}

export const dataset: string = maybeDataset as string
export const projectId: string = maybeProjectId as string
