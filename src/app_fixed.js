import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { errorHandler, notFoundHandler } from './middleware/errors.js'
import apiRouter from './routes/index.js'

const app = express()

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

const DEFAULT_DEV_ORIGINS = 'http://localhost:5173,http://localhost:5179'
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || DEFAULT_DEV_ORIGINS
const allowedOrigins = allowedOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      if ((process.env.NODE_ENV || 'development') !== 'production') {
        try {
          const url = new URL(origin)
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return cb(null, true)
        } catch (e) {}
      }
      cb(new Error('Not allowed by CORS'), false)
    },
    credentials: true
  })
)

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

app.use('/v1', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
