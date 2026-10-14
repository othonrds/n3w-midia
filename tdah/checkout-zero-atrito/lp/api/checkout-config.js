// Vercel Function (projeto adhd-reflex): GET /api/checkout-config
// Liga/desliga o braço novo SEM mexer no código. Sem as variáveis -> 100% Hotmart (nada muda no ar).
//   CHK_NEW_URL    link do Payment Link da Stripe (https://buy.stripe.com/...)  — é público, não é segredo
//   CHK_NEW_SHARE  fração do tráfego no braço novo (padrão 0.5 quando CHK_NEW_URL existe; "0" desliga)
export default function handler(req, res) {
  const url = (process.env.CHK_NEW_URL || "").trim();
  const share = url && /^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//.test(url)
    ? Math.min(1, Math.max(0, Number(process.env.CHK_NEW_SHARE ?? 0.5) || 0))
    : 0;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "public, max-age=60, s-maxage=60");
  res.end(JSON.stringify({ arm: "chk_stripe", url: share ? url : "", share }));
}
