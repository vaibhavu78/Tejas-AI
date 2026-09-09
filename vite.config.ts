import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage } from 'node:http'

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk; if (body.length > 2_000_000) reject(new Error('Request too large')) })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/** Local-only AI proxy. GitHub Pages uses direct HTTPS requests from the browser. */
function omniRouteProxy(): Plugin {
  return { name: 'tejas-local-ai-proxy', configureServer(server) {
    server.middlewares.use('/api/omniroute', async (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      try {
        const baseUrl=String(req.headers['x-omniroute-url']||'').trim().replace(/\/$/,'').replace(/\/v1$/,'')
        const apiKey=String(req.headers['x-omniroute-key']||'').trim().replace(/^Bearer\s+/i,'')
        if(!baseUrl||!apiKey)throw new Error('API URL or key missing')
        const route=req.url?.startsWith('/chat')?'/v1/chat/completions':'/v1/models'
        const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),route.includes('chat')?180000:30000)
        const upstream=await fetch(baseUrl+route,{method:route.includes('chat')?'POST':'GET',headers:{Authorization:`Bearer ${apiKey}`,'X-API-Key':apiKey,'Content-Type':'application/json',Accept:'application/json'},body:route.includes('chat')?await readBody(req):undefined,signal:controller.signal})
        clearTimeout(timeout);res.statusCode=upstream.status;res.end(await upstream.text())
      } catch(error) {res.statusCode=502;res.end(JSON.stringify({error:{message:error instanceof Error?error.message:'AI connection failed'}}))}
    })
  }}
}

export default defineConfig({
  // Workflow supplies /REPOSITORY_NAME/. Local and custom-domain builds use /.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), omniRouteProxy()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '0.0.0.0', allowedHosts: true }
})
