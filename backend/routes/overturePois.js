import { Router } from 'express'
import { parseBbox, assertBboxIsReasonable } from '../utils/bbox.js'
import { getOverturePlacesByBbox } from '../services/overturePlacesService.js'

const router = Router()

const MAX_LIMIT = 10_000
const DEFAULT_LIMIT = 5_000

/**
 * GET /api/poi/overture
 *
 * Query params:
 *   bbox          Required. "west,south,east,north"
 *   limit         Optional. Default 5000, max 10000.
 *   minConfidence Optional. Float 0–1. Filter out low-confidence POIs.
 */
router.get('/', async (req, res, next) => {
  try {
    // ── Validate bbox ───────────────────────────────────────────────────────────
    const bbox = parseBbox(req.query.bbox)
    assertBboxIsReasonable(bbox)

    // ── Validate limit ──────────────────────────────────────────────────────────
    let limit = DEFAULT_LIMIT
    if (req.query.limit !== undefined) {
      limit = parseInt(req.query.limit, 10)
      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ error: 'limit must be a positive integer' })
      }
      if (limit > MAX_LIMIT) limit = MAX_LIMIT
    }

    // ── Validate minConfidence ──────────────────────────────────────────────────
    let minConfidence = null
    if (req.query.minConfidence !== undefined) {
      minConfidence = parseFloat(req.query.minConfidence)
      if (isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1) {
        return res.status(400).json({ error: 'minConfidence must be a number between 0 and 1' })
      }
    }

    // ── Fetch ───────────────────────────────────────────────────────────────────
    console.log(`[route] GET /api/poi/overture bbox=${req.query.bbox} limit=${limit} minConf=${minConfidence}`)
    const pois = await getOverturePlacesByBbox({ bbox, limit, minConfidence })

    res.json({
      source: 'overture',
      bbox,
      count: pois.length,
      pois,
    })
  } catch (err) {
    next(err)
  }
})

export default router
