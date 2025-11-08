import jwt from 'jsonwebtoken'
import { models } from '../models/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
  // attach user basic info (including role)
  const user = await models.User.findByPk(payload.sub)
  if (!user) return res.status(401).json({ error: 'Invalid token user' })
  req.user = { id: user.id, email: user.email, name: user.name, role: user.role }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export default authenticate
