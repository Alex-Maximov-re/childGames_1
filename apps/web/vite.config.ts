import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appRoot = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

function siteBase(): string {
  const raw =
    process.env.npm_lifecycle_event === 'build:pages' ? '/childGames_1/' : process.env.VITE_BASE?.trim()
  if (!raw || raw === '/') return '/'
  const withSlash = raw.endsWith('/') ? raw : `${raw}/`
  return withSlash.startsWith('/') ? withSlash : `/${withSlash}`
}

export default defineConfig({
  root: appRoot,
  publicDir: fileURLToPath(new URL('../../public', import.meta.url)),
  plugins: [react()],
  base: siteBase(),
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    fs: { allow: [repoRoot, appRoot] },
  },
  preview: { host: true, port: 4173, strictPort: true },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    target: 'es2020',
  },
})
