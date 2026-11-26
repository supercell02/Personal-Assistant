export type TelegramEnv = {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
}

export type TelegramMessage = {
  message_id?: number
  from?: { id?: number }
  chat?: { id?: number | string; type?: string }
  text?: string
  date?: number
}

export type TelegramUpdate = {
  update_id?: number
  message?: TelegramMessage
}

/**
 * Build the base URL for the Telegram Bot API using the bot token.
 */
export function telegramApiUrl(token: string, method: string) {
  return `https://api.telegram.org/bot${token}/${method}`
}

/**
 * Verify that a webhook request originates from Telegram using the secret token.
 */
export function verifyWebhookSecret(
  headerValue: string | undefined,
  secret: string
): boolean {
  return headerValue === secret
}

/**
 * Parse the incoming Telegram webhook update JSON.
 */
export async function parseUpdate(
  request: Request
): Promise<TelegramUpdate | null> {
  try {
    return (await request.json()) as TelegramUpdate
  } catch {
    return null
  }
}

/**
 * Send a message to a Telegram chat.
 */
export async function sendMessage({
  token,
  chatId,
  text,
}: {
  token: string
  chatId: number | string
  text: string
}): Promise<void> {
  await fetch(telegramApiUrl(token, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  })
}

/**
 * Register a webhook URL with Telegram.
 */
export async function setWebhook({
  token,
  url,
  secretToken,
}: {
  token: string
  url: string
  secretToken: string
}): Promise<{ ok: boolean; result?: unknown; description?: string }> {
  const res = await fetch(telegramApiUrl(token, 'setWebhook'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secretToken,
    }),
  })

  const data = await res.json()
  return {
    ok: data.ok,
    result: data.result,
    description: data.description,
  }
}
