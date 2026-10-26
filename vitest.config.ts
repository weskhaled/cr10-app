import { defineConfig } from 'vitest/config'

// pure logic only (app/utils) — no Nuxt runtime needed
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
