import { Router } from 'express'
import { z } from 'zod'
import { models } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const RecordSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  type: z.enum(['prescription', 'note']).default('prescription'),
  medication: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional()
})

// List records (optionally filtered by patientId)
router.get('/', authenticate, async (req, res) => {
  const where = {}
  if (req.query.patientId) where.patientId = req.query.patientId
  const records = await models.Record.findAll({ where, include: [models.Patient, models.Doctor], order: [['date', 'DESC']] })
  res.json(records)
})

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = RecordSchema.parse(req.body)
    const record = await models.Record.create({
      patientId: data.patientId,
      doctorId: data.doctorId || null,
      type: data.type,
      medication: data.medication || null,
      notes: data.notes || null,
      date: data.date ? new Date(data.date) : undefined
    })
    res.status(201).json(record)
  } catch (err) {
    next(Object.assign(new Error('Invalid record data'), { status: 400 }))
  }
})

router.get('/:id', authenticate, async (req, res) => {
  const r = await models.Record.findByPk(req.params.id, { include: [models.Patient, models.Doctor] })
  if (!r) return res.status(404).json({ error: 'Record not found' })
  res.json(r)
})

router.delete('/:id', authenticate, async (req, res) => {
  const r = await models.Record.findByPk(req.params.id)
  if (!r) return res.status(404).json({ error: 'Record not found' })
  await r.destroy()
  res.status(204).end()
})

export default router
