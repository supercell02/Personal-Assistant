import { Hono } from 'hono'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

type Env = {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
  NVIDIA_API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

// Health check
app.get('/', (c) => {
  return c.text('Telegram AI Bot is running')
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
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NVIDIA_API_KEY } = c.env

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
    // Not a text message; acknowledge anyway so Telegram stops retrying.
    return c.json({ ok: true })
  }

  // Create NVIDIA NIM (OpenAI-compatible) client and model.
  const openai = createOpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: NVIDIA_API_KEY,
  })
  const model = openai('nvidia/nemotron-3.5-super-vl-120b-a12b')

  // Generate an AI response to the user's message instead of echoing.
  const { text } = await generateText({
    model,
    instructions:
      'You are a helpful assistant in a Telegram bot. Respond concisely and helpfully to the user.',
    prompt: message.text,
  })

  // Send the AI-generated response back to the same chat.
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text,
      }),
    }
  )

  return c.json({ ok: true })
})

export default app
