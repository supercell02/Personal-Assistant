import { Hono } from 'hono'
import { generateTextTask } from './trigger/generate-text.js'
import { runs } from '@trigger.dev/sdk'

/**
 * Temporary public test route that triggers a text-generation task on
 * Trigger.dev and waits for the result before responding.
 *
 * GET /test-ai                 -> triggers with a default prompt
 * GET /test-ai?prompt=...      -> triggers with the provided prompt
 *
 * This route is intentionally public (no auth) so it can be hit directly for
 * testing. It is expected to be removed later.
 */
export const testAi = new Hono()

testAi.get('/', async (c) => {
  const prompt = c.req.query('prompt') || 'Say hello in one short sentence.'

  // Trigger the task on Trigger.dev's servers.
  const handle = await generateTextTask.trigger({ prompt })

  // Wait for the run to complete so we can return the AI-generated text.
  const run = await runs.poll(handle.id)

  if (!run.isSuccess || !run.output) {
    return c.json(
      {
        ok: false,
        message: 'Text generation failed',
        runId: handle.id,
        status: run.status,
        error: run.error,
      },
      run.isSuccess ? 200 : 500
    )
  }

  return c.json({
    ok: true,
    message: 'Text generated',
    runId: handle.id,
    prompt,
    result: run.output.text,
  })
})
