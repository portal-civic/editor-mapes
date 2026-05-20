import express from 'express'
import cors from 'cors'
import overturePoisRouter from './routes/overturePois.js'

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
]
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Render health checks, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin not allowed — ${origin}`))
  },
  methods: ['GET', 'OPTIONS'],
}))

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

app.use('/api/poi/overture', overturePoisRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, _req, res, _next) => {
  console.error('[server error]', err.message)
  const status = err.status ?? 500
  res.status(status).json({ error: err.message ?? 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`[backend] Listening on port ${PORT}`)
  console.log(`[backend] Allowed origins: ${allowedOrigins.join(', ')}`)
})
