import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})
.get('/marco', (c) => {
  return c.text('polo')
})

export default app

if (import.meta.main) {
  const { serve } = await import('@hono/node-server')

  serve(
    {
      fetch: app.fetch,
      port: 3000,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`)
    }
  )
}
