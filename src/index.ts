import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})
.get('/marco', (c) => {
  return c.text('polo')
})

export default app
