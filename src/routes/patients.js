import { Router } from 'express'
import { z } from 'zod'
import { models } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const PatientSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['male', 'female', 'other']),
  diagnosis: z.string().optional()
})

router.get('/', authenticate, async (_req, res) => {
  const patients = await models.Patient.findAll()
  res.json(patients)
})

router.get('/:id', authenticate, async (req, res) => {
  const p = await models.Patient.findByPk(req.params.id)
  if (!p) return res.status(404).json({ error: 'Patient not found' })
  res.json(p)
})

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = PatientSchema.parse(req.body)
    const patient = await models.Patient.create(data)
    res.status(201).json(patient)
  } catch (err) {
    next(Object.assign(new Error('Invalid patient data'), { status: 400 }))
  }
})

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const data = PatientSchema.partial().parse(req.body)
    const patient = await models.Patient.findByPk(req.params.id)
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    await patient.update(data)
    res.json(patient)
  } catch (err) {
    next(Object.assign(new Error('Invalid patient update'), { status: 400 }))
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  const patient = await models.Patient.findByPk(req.params.id)
  if (!patient) return res.status(404).json({ error: 'Patient not found' })
  await patient.destroy()
  res.status(204).end()
})

export default router








