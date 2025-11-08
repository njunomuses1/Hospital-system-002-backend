import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import app from './app_fixed.js'
import { syncDatabase } from './models/index.js'

const port = Number(process.env.PORT || 5000)
app.set('port', port)

const server = http.createServer(app)

// Try listening, and if port is in use try subsequent ports up to a limit
async function tryListen(server, startPort, maxAttempts = 10) {
  let p = startPort
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (err) => reject(err)
        const onListening = () => resolve()
        server.once('error', onError)
        server.once('listening', onListening)
        server.listen(p)
      })
      console.log(`[backend] listening on port ${p}`)
      return p
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`[backend] port ${p} in use, trying ${p + 1}`)
        p += 1
        // remove listeners carried over
        server.removeAllListeners('error')
        server.removeAllListeners('listening')
        continue
      }
      console.error('[backend] server error', err)
      process.exit(1)
    }
  }
  console.error('[backend] failed to bind to any port')
  process.exit(1)
}

async function start() {
  try {
    // Ensure DB is ready before listening
    await syncDatabase()
    await tryListen(server, port)
  } catch (err) {
    console.error('[backend] failed to start', err)
    process.exit(1)
  }
}

start()








