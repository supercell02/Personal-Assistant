import { Hono } from 'hono'

type Env = {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

// Health check
app.get('/', (c) => {
  return c.text('Telegram Echo Bot is running')
})

// Register this worker as the Telegram webhook.
// Call once: POST /set-webhook with { "url": "https://<your-worker>.workers.dev/webhook" }
app.post('/set-webhook', async (c) => {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } = c.env

  const { url } = await c.req.json<{ url?: string }>()
  if (!url) {
    return c.json({ error: 'Missing "url" in request body' }, 400)
  }

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        secret_token: TELEGRAM_WEBHOOK_SECRET,
      }),
    }
  )

  const data = await res.json()
  return c.json({
    ok: data.ok,
    result: data.result,
    description: data.description,
  })
})

// Telegram webhook endpoint. Telegram POSTs updates here.
app.post('/webhook', async (c) => {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } = c.env

  // Verify the request originates from Telegram using the secret token.
  const secretToken = c.req.header('X-Telegram-Bot-Api-Secret-Token')
  if (secretToken !== TELEGRAM_WEBHOOK_SECRET) {
    return c.text('Unauthorized', 401)
  }

  const update = await c.req.json<{
    update_id?: number
    message?: {
      message_id?: number
      from?: { id?: number }
      chat?: { id?: number | string; type?: string }
      text?: string
      date?: number
    }
  }>()

  const message = update.message
  if (!message || !message.chat?.id || !message.text) {
    // Not an echoable text message; acknowledge anyway so Telegram stops retrying.
    return c.json({ ok: true })
  }

  // Echo the user's text back to the same chat.
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: message.text,
      }),
    }
  )

  return c.json({ ok: true })
})

export default app
