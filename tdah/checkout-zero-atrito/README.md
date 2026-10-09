# KIT ADHD — checkout zero atrito (Stripe)

Evento `trafego-20261009-checkout-zero-atrito`. Checkout novo: Stripe Payment Link (e-mail + cartão/Apple Pay/Google Pay; para cartão dos EUA só país + ZIP), em teste 50/50 contra a Hotmart na LP `adhd.xyzgames.app/focus-kit/`.

Este código fica aqui porque o repo `othonrds/adhd-reflex` não estava liberado para o agente. Para ir ao ar, copie os arquivos para lá (mesmos caminhos relativos).

| Arquivo aqui | Vai para | O que faz |
|---|---|---|
| `lp/checkout-split.js` | `adhd-reflex/checkout-split.js` (raiz pública) + `<script src="/checkout-split.js" defer></script>` no fim da `focus-kit/index.html` | sorteio 50/50, cookie `chk_arm`, `utm_content=chk_hotmart / chk_stripe`, `client_reference_id=chk_stripe__<visitante>` |
| `lp/api/checkout-config.js` | `adhd-reflex/api/checkout-config.js` | flag: sem `CHK_NEW_URL` na Vercel = 100% Hotmart |
| `supabase/functions/kit/index.ts` | edge function `kit` no Supabase reflex (verify_jwt = false) | webhook Stripe com assinatura validada → `kit_purchases` + e-mail com o link do kit (Resend, opcional) |
| `supabase/migrations/20261009_kit_purchases.sql` | migration no reflex | tabela de compras (RLS ligado, sem acesso anon) |

## Entrega (igual à Hotmart hoje)
1. Payment Link → "After payment: redirect" para `https://adhd.xyzgames.app/kit-5345843cc6/?src=stripe&session_id={CHECKOUT_SESSION_ID}` → o comprador cai direto no kit (é isso que libera no iPhone).
2. Webhook `https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/kit/stripe` (eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`) grava a venda e manda o e-mail com o link (se `RESEND_API_KEY` existir).
3. `GET /functions/v1/kit/check?session_id=cs_...` responde `{paid}` caso a página do kit queira confirmar.

## Ligar / desligar
- Ligar: Vercel → adhd-reflex → Settings → Environment Variables → `CHK_NEW_URL = https://buy.stripe.com/...` (Production) → Redeploy.
- Metade/outra fração: `CHK_NEW_SHARE` (padrão 0.5). Desligar na hora: `CHK_NEW_SHARE=0` ou apagar `CHK_NEW_URL`.
- Testar sem sorteio: `adhd.xyzgames.app/focus-kit/?x_chk=stripe`.

## Leitura
- Hotmart: vendas com `utm_content=chk_hotmart` / `sck=chk_hotmart`.
- Stripe: `select arm, count(*), sum(amount) from kit_purchases where status='approved' and livemode group by 1;` + Payment Link → UTM.
- Cliques por braço: `fbq CheckoutArm {arm}` e o atributo `data-chk` no `<html>`.

Atenção: se o botão da LP não for um `<a href="https://pay.hotmart.com/...">` (ex.: `onclick` com `location.href`), troque por `<a>` ou chame `window.__chk.arm` no handler.
