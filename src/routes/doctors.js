import { Router } from 'express'
import { z } from 'zod'
import { models } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const DoctorSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  availability: z.array(z.string()).optional()
})

router.get('/', authenticate, async (_req, res) => {
  const doctors = await models.Doctor.findAll()
  // parse availability JSON
  const parsed = doctors.map((d) => ({ ...d.toJSON(), availability: d.availability ? JSON.parse(d.availability) : [] }))
  res.json(parsed)
})

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = DoctorSchema.parse(req.body)
    const doctor = await models.Doctor.create({ ...data, availability: JSON.stringify(data.availability || []) })
    res.status(201).json({ ...doctor.toJSON(), availability: data.availability || [] })
  } catch (err) {
    next(Object.assign(new Error('Invalid doctor data'), { status: 400 }))
  }
})

export default router








