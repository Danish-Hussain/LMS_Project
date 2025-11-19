import type { NextApiRequest, NextApiResponse } from 'next'
import { checkDb } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  try {
    const result = await checkDb()
    if (result.ok) return res.status(200).json({ ok: true, db: true, timestamp: Date.now() })
    return res.status(503).json({ ok: false, db: false, error: result.error })
  } catch (err: any) {
    console.error('pages/api/health/db error', err?.message || err)
    return res.status(500).json({ ok: false, error: 'Internal Server Error' })
  }
}
