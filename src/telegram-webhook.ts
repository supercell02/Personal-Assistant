import { Hono } from 'hono'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import {
  sendMessage,
  verifyWebhookSecret,
  parseUpdate,
  type TelegramEnv,
} from './telegram.js'

export const telegramWebhook = new Hono<{
  Bindings: TelegramEnv & {
    NVIDIA_API_KEY: string
  }
}>()

telegramWebhook.post('/', async (c) => {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NVIDIA_API_KEY } =
    c.env

  // Verify the request originates from Telegram using the secret token.
  const secretToken = c.req.header('X-Telegram-Bot-Api-Secret-Token')
  if (!verifyWebhookSecret(secretToken, TELEGRAM_WEBHOOK_SECRET)) {
    return c.text('Unauthorized', 401)
  }

  const update = await parseUpdate(c.req.raw)
  if (!update) {
    return c.json({ ok: true })
  }

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
  let reply: string
  try {
    const { text } = await generateText({
      model,
      instructions:
        'You are a helpful assistant in a Telegram bot. Respond concisely and helpfully to the user.',
      prompt: message.text,
    })
    reply = text
  } catch {
    reply = 'Sorry, I could not generate a response right now. Please try again later.'
  }

  // Send the AI-generated response back to the same chat.
  await sendMessage({
    token: TELEGRAM_BOT_TOKEN,
    chatId: message.chat.id,
    text: reply,
  })

  return c.json({ ok: true })
})
