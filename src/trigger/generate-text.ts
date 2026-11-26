import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { logger, task } from "@trigger.dev/sdk";

/**
 * Trigger.dev task that generates text using the AI SDK.
 *
 * Runs on Trigger.dev's servers. Requires NVIDIA_API_KEY to be set as an
 * environment variable/secret in your Trigger.dev project.
 */
export const generateTextTask = task({
  id: "generate-text",
  maxDuration: 300,
  run: async (payload: { prompt?: string }, { ctx }) => {
    const prompt = payload?.prompt || 'Say hello in one short sentence.'

    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) {
      throw new Error("NVIDIA_API_KEY is not set in the Trigger.dev environment")
    }

    const openai = createOpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey,
    })
    const model = openai('nvidia/nemotron-3.5-super-vl-120b-a12b')

    const { text } = await generateText({
      model,
      instructions: 'You are a helpful assistant. Respond concisely.',
      prompt,
    })

    logger.log("Generated text", { prompt, text, ctx })

    return { text }
  },
})
