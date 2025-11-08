import { Router } from 'express'
import authRouter from './auth.js'
import patientsRouter from './patients.js'
import doctorsRouter from './doctors.js'
import appointmentsRouter from './appointments.js'
import recordsRouter from './records.js'
import usersRouter from './users.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ name: 'Hospital System API', version: 'v1' })
})

router.use('/auth', authRouter)
router.use('/patients', patientsRouter)
router.use('/doctors', doctorsRouter)
router.use('/appointments', appointmentsRouter)
router.use('/records', recordsRouter)
router.use('/users', usersRouter)

export default router








