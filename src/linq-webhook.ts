import { Hono } from 'hono'

export const linqWebhook = new Hono()

linqWebhook.post('/', (c) => {
  return c.json({ ok: true })
})
