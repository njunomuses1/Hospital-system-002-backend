import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { errorHandler, notFoundHandler } from './middleware/errors.js'
import apiRouter from './routes/index.js'

const app = express()

// Trust proxy for platforms like Railway
app.set('trust proxy', 1)

// Security & parsing
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS configuration
// Default allowed dev origins; override with ALLOWED_ORIGINS env var (comma-separated)
const DEFAULT_DEV_ORIGINS = 'http://localhost:5173,http://localhost:5179'
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || DEFAULT_DEV_ORIGINS
const allowedOrigins = allowedOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server or tools (no origin)
      if (!origin) return cb(null, true)

      // allow explicit configured origins
      if (allowedOrigins.includes(origin)) return cb(null, true)

      // in development allow any localhost with any port (http://localhost:xxxx)
      if ((process.env.NODE_ENV || 'development') !== 'production') {
        try {
          const url = new URL(origin)
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return cb(null, true)
        } catch (e) {
          // invalid origin, fall through to deny
        }
      }

      cb(new Error('Not allowed by CORS'), false)
    },
    credentials: true
  })
)

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// API v1
app.use('/v1', apiRouter)

// 404 and errors
app.use(notFoundHandler)
app.use(errorHandler)

export default app
