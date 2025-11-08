import { Router } from 'express'
import { z } from 'zod'
import { models } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const AppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  datetime: z.string(),
  reason: z.string().optional()
})

router.get('/', authenticate, async (_req, res) => {
  const appts = await models.Appointment.findAll({ include: [models.Patient, models.Doctor] })
  res.json(appts)
})

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = AppointmentSchema.parse(req.body)
    const appt = await models.Appointment.create({
      patientId: data.patientId,
      doctorId: data.doctorId || null,
      datetime: new Date(data.datetime),
      reason: data.reason || 'General checkup'
    })
    res.status(201).json(appt)
  } catch (err) {
    next(Object.assign(new Error('Invalid appointment data'), { status: 400 }))
  }
})

export default router








