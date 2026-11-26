import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './app.js'

serve(
  {
    // Pass process.env as the Hono env binding so routes can read
    // secrets (e.g. NVIDIA_API_KEY) via c.env in local development.
    fetch: (req) => app.fetch(req, process.env),
    port: Number(process.env.PORT) || 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
