import { json } from './_lib.js';
export default function handler(req, res) { res.setHeader('Cache-Control', 'public, max-age=300'); json(res, 200, { pixel: process.env.META_PIXEL_ID || null }); }
