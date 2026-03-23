import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const localBackendTarget = 'http://localhost:9090'
  const localWsBackendTarget = 'ws://localhost:9090'

  return {
    plugins: [vue()],
    base: '/',
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    optimizeDeps: {
      include: ['docx']
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api']
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router'],
            'relation-graph': ['relation-graph-vue3']
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: localBackendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          timeout: 120000,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (req.url?.includes('/common/upload')) {
                proxyReq.setTimeout(300000)
              }
            })
            proxy.on('error', (err, req, res) => {
              console.error('代理错误:', err)
            })
          }
        },
        '/ws': {
          target: localWsBackendTarget,
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ws/, ''),
          configure: (proxy) => {
            proxy.on('proxyReqWs', (proxyReq, req) => {
              if (req.url) {
                const url = new URL(req.url, 'http://localhost')
                const token = url.searchParams.get('token')
                if (token) {
                  proxyReq.setHeader('Authorization', token)
                  url.searchParams.delete('token')
                  proxyReq.path = url.pathname + url.search
                }
              }
            })
          }
        }
      }
    }
  }
})
