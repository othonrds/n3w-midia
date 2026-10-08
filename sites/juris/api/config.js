// Pixel Meta do Juris (liga quando META_PIXEL_ID existir nas variáveis da Vercel).
export default function handler(req, res) { res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'public, max-age=300'); res.end(JSON.stringify({ pixel: process.env.META_PIXEL_ID || null })); }
