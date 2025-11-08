import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { models } from '../models/index.js'

const router = Router()

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional()
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = credentialsSchema.parse(req.body)
    const existing = await models.User.findOne({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    const hash = await bcrypt.hash(password, 10)
    const user = await models.User.create({ email, passwordHash: hash, name: name || 'User' })
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    next(Object.assign(new Error('Invalid registration payload'), { status: 400 }))
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body)
    const user = await models.User.findOne({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    next(Object.assign(new Error('Invalid credentials'), { status: 400 }))
  }
})

export default router








