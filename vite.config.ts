import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Fixture mode must work with no SDK installed. The live adapter (`src/data/saaskit.ts`) is only
 * imported lazily; if the SDK packages cannot be resolved we swap that module for a stub that
 * throws a clear error when (and only when) someone tries to use it.
 */
function optionalLiveAdapter(): Plugin {
  const STUB = '\0saaskit-live-stub'
  return {
    name: 'optional-live-adapter',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer || importer.startsWith('\0') || !/(^|\/)saaskit(\.ts)?$/.test(source)) return null
      const hit = await this.resolve('@frappe-saaskit/client', importer, { skipSelf: true })
      return hit ? null : STUB
    },
    load(id) {
      if (id !== STUB) return null
      return `throw new Error('The live adapter needs @frappe-saaskit/client and @frappe-saaskit/react. Run npm install, then set VITE_DATA_ADAPTER=saaskit.')`
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.SAAS_BACKEND_URL || 'http://localhost:8000'
  const proxy = { target: backend, changeOrigin: true, cookieDomainRewrite: '' }
  return {
    plugins: [optionalLiveAdapter(), react()],
    // One copy of React / react-query, even if the SDK tarballs ship their own nested copies.
    resolve: { dedupe: ['react', 'react-dom', '@tanstack/react-query', 'react-router-dom'] },
    // Same-origin proxy to a Frappe site so cookie auth works in dev and `vite preview`.
    server: { proxy: { '/api': proxy, '/files': proxy } },
    preview: { proxy: { '/api': proxy, '/files': proxy } },
  }
})
