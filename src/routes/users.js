import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { models } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const UserCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']).optional()
})

const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'user']).optional()
})

function requireAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin required' })
    return false
  }
  return true
}

// list users (admin only)
router.get('/', authenticate, async (req, res) => {
  if (!requireAdmin(req, res)) return
  const users = await models.User.findAll({ attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'] })
  res.json(users)
})

// get single user (admin or self)
router.get('/:id', authenticate, async (req, res) => {
  const id = req.params.id
  if (req.user.id !== id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const user = await models.User.findByPk(id, { attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'] })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// create user (admin only)
router.post('/', authenticate, async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return
    const data = UserCreateSchema.parse(req.body)
    const existing = await models.User.findOne({ where: { email: data.email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    const hash = await bcrypt.hash(data.password, 10)
    const user = await models.User.create({ name: data.name, email: data.email, passwordHash: hash, role: data.role || 'user' })
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (err) {
    next(Object.assign(new Error('Invalid user data'), { status: 400 }))
  }
})

// update user (admin or self)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id
    if (req.user.id !== id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const data = UserUpdateSchema.parse(req.body)
    const user = await models.User.findByPk(id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (data.password) data.passwordHash = await bcrypt.hash(data.password, 10)
    delete data.password
    // only admin can change role
    if (data.role && req.user.role !== 'admin') delete data.role
    await user.update(data)
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (err) {
    next(Object.assign(new Error('Invalid user update'), { status: 400 }))
  }
})

// delete user (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  if (!requireAdmin(req, res)) return
  const user = await models.User.findByPk(req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  await user.destroy()
  res.status(204).end()
})

export default router
