import { Router } from 'express'
import * as logger from 'firebase-functions/logger'

const router = Router()

// ─── GET /api/questions ───
router.get('/', async (req, res) => {
  try {
    res.json({ status: 'ok', message: 'Questions list' })
  } catch (err: any) {
    logger.error('GET /questions error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch questions' })
  }
})

// ─── GET /api/questions/:id ───
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    res.json({ status: 'ok', id })
  } catch (err: any) {
    logger.error('GET /questions/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/questions ───
router.post('/', async (req, res) => {
  try {
    const body = req.body
    res.status(201).json({ status: 'ok', created: true, data: body })
  } catch (err: any) {
    logger.error('POST /questions error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/questions/:id ───
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    res.json({ status: 'ok', updated: id })
  } catch (err: any) {
    logger.error('PUT /questions/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/questions/:id ───
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    res.json({ status: 'ok', deleted: id })
  } catch (err: any) {
    logger.error('DELETE /questions/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ═══════ CRITICAL: named export so index.ts can import it ═══════
export { router }