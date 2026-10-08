# fotos.jurispaginas.com — estrutura própria de fotos profissionais (v0)
Página estática rápida (sem build). Vercel: root directory `sites/fotos`, framework "Other", output `public`, sem build/install.
Próximo: checkout PIX (Mercado Pago) + página privada do pedido + Supabase + pixel próprio e Conversions API.

## Checkout PIX (v1, 08/10/2026)
Fluxo: landing → `/checkout.html?p=3|15` (nome, e-mail, WhatsApp) → `/api/pedido` cria uma *order* PIX na API de Orders do Mercado Pago → QR + copia-e-cola na própria página → a página consulta `/api/status` a cada 4 s (confere no Mercado Pago) → pago → `/pedido.html?ref&id` (página privada) → envio de 1–4 selfies (`/api/selfie`, só aceita com pagamento confirmado) + estilos → `/api/finalizar`.
- Variáveis na Vercel: `MP_ACCESS_TOKEN` (Sensitive), `MP_PUBLIC_KEY`, opcional `META_PIXEL_ID` (liga o pixel próprio: PageView, InitiateCheckout, AddPaymentInfo, Purchase com eventID = ref do pedido, para deduplicar com a Conversions API depois).
- Banco: Supabase "reflex", tabela `fotos_pedidos` + bucket privado `fotos-selfies` (SQL em `supabase/001_fotos_pedidos.sql`).
- Conferência: `/api/saude` mostra se o token do Mercado Pago funciona (sem expor nada).
- Entrega das fotos: ainda manual até o motor de fotos ser escolhido (promessa na página: até 12 h).
