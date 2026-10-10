// Worker "n3w-midia" – Central N3w. Bucket R2 privado servido por link público.
// POST /import {url, key}  (header x-n3w-key) -> copia um arquivo das fontes permitidas para o bucket
// GET  /list?prefix=...    (header x-n3w-key) -> lista arquivos
// GET  /<key>                                   -> serve o arquivo (público, para a Meta e o Instagram)
const ALLOW = [
  "https://raw.githubusercontent.com/othonrds/n3w-midia/",
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/"
];
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const authed = req.headers.get("x-n3w-key") === env.N3W_KEY;
    if (req.method === "POST" && u.pathname === "/import") {
      if (!authed) return new Response("forbidden", { status: 403 });
      const { url, key } = await req.json();
      if (!url || !key || !ALLOW.some(p => url.startsWith(p)) || key.includes("..") || key.startsWith("/"))
        return new Response("bad request", { status: 400 });
      const r = await fetch(url);
      if (!r.ok) return new Response("fetch failed " + r.status, { status: 502 });
      const buf = await r.arrayBuffer();
      await env.MIDIA.put(key, buf, { httpMetadata: { contentType: r.headers.get("content-type") || "application/octet-stream" } });
      return Response.json({ ok: true, key, size: buf.byteLength, url: u.origin + "/" + key });
    }
    if (req.method === "GET" && u.pathname === "/list") {
      if (!authed) return new Response("forbidden", { status: 403 });
      const l = await env.MIDIA.list({ prefix: u.searchParams.get("prefix") || "", limit: 1000 });
      return Response.json(l.objects.map(o => ({ key: o.key, size: o.size })));
    }
    if (req.method === "GET" && u.pathname.length > 1) {
      const obj = await env.MIDIA.get(decodeURIComponent(u.pathname.slice(1)));
      if (!obj) return new Response("not found", { status: 404 });
      const h = new Headers();
      obj.writeHttpMetadata(h);
      h.set("etag", obj.httpEtag);
      h.set("cache-control", "public, max-age=31536000");
      return new Response(obj.body, { headers: h });
    }
    return new Response("n3w-midia ok");
  }
};
