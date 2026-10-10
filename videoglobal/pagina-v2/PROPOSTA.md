# VIDEOGLOBAL — Página de vendas v2 (PROPOSTA, não publicada)

Data: 2026-10-10 · Autor: Criador de Produtos · Produto: AI Photo & Video Kit (US$ 9,90, inglês, global)
Base: página atual `video-global/index.html` (n3w-midia) + "Padrões de oferta" do Banco de Espionagem (https://claude.ai/code/artifact/f672f45f-7596-4cc5-a431-5b920249d9e1).
Status: rascunho. Nada publicado, nenhum deploy, nada no Meta.

## O que mudou em relação à página atual
1. **Promessa de resultado, não de habilidade.** H1 saiu de "Create professional photos and videos with AI" para "Pro photos and videos of you or your product — without a camera" + seção "What you'll have by the end of the weekend" (fotos de perfil, foto de produto, Reels prontos, foto que se mexe).
2. **Âncora de preço** "US$ 47 value → US$ 9.90" no topo e no bloco de oferta, com a pilha de valor item a item (guia US$ 19 + prompts US$ 17 + checklist US$ 7 + mapa de custos US$ 4 = US$ 47).
3. **Bônus contado:** "150+ copy-paste prompts" como bônus nomeado; checklist anti-cara-de-IA e mapa de custos de ferramentas também viram bônus.
4. **Seção anti-"looks like AI"** (medo nº 1 do banco): antes/depois em texto + 6 sinais de IA com a correção de prompt de cada um. FAQ ganhou "Will my photos look fake?".
5. **Garantia 7 dias** virou bloco próprio com selo (antes só aparecia no FAQ e na linha pequena).
6. **"How it works"** reescrito como fluxo de resultado: escolha o resultado → copie o prompt → rode a lista de correções.
7. Mantido: prova "o anúncio foi feito assim", aviso de pessoa gerada por IA, FAQ honesto, sem timer, sem depoimento, sem número de vendas/alunos, sem foto de pessoa real. Robots agora `noindex`.
8. **Link de checkout mantido igual ao atual: `#CHECKOUT_HOTMART`** (no repositório a página atual usa esse placeholder; não inventei link).

## Estimativas a validar
- Âncora **US$ 47** e o valor de cada item (19 / 17 / 7 / 4): estimativa, sem base em preço praticado. Validar no teste (e garantir que a âncora seja defensável: os itens precisam existir e ter esse valor percebido).
- **"150+ prompts"**: quantidade-alvo. O pacote precisa ser produzido e contado antes de publicar — hoje o entregável cita só "ready-to-copy prompt templates".
- Checklist "6 tells" e "Tool cost map" precisam existir como peças no entregável.
- Promessa "by the end of the weekend": tempo estimado, validar com o conteúdo real.
- Preços do order bump e do upsell abaixo.

## Order bump (no checkout)
- **Nome:** Viral Reels Prompt Vault
- **Promessa:** "+100 prompts and templates for the 6 Reels formats that stop the scroll (before/after, product reveal, 'which one is real?', POV, era swap, photo-to-motion)."
- **Preço sugerido:** US$ 9 (faixa de teste US$ 7–12) — estimativa.
- **Onde aparece:** caixa de seleção do order bump no checkout Hotmart, logo abaixo do produto principal. Uma linha + 3 bullets, sem imagem de pessoa real.

## Upsell (pós-compra, 1 clique)
- **Nome:** AI UGC Creator Module
- **Promessa:** "Create a consistent AI creator — same face in every video — and make UGC-style product videos that look real, without hiring creators."
- **Conteúdo:** personagem consistente (referência travada), roteiros UGC de 15–25 s, voz e legenda naturais, checklist de rotulagem de conteúdo de IA, prompts do módulo.
- **Preço sugerido:** US$ 37 (faixa de teste US$ 27–47) — estimativa. Downsell opcional US$ 19 (só o pack de prompts do módulo).
- **Onde aparece:** página de upsell entre o pagamento aprovado e a `thanks.html` (oferta 1 clique da Hotmart). Regras: personagem fictício, nunca imitar pessoa real, rótulo de IA.

## Antes de publicar (precisa do sim do Othon)
- Trocar `#CHECKOUT_HOTMART` pelo link real e configurar bump/upsell (Checkout Expert; preço novo exige aprovação).
- Produzir os bônus prometidos.
- Remover a faixa amarela "DRAFT v2".
- Conflito em aberto: `claude/projetos/global-editing-modelagem.md` propõe substituir este kit pelo "Cinematic AI Playbook" (US$ 9,90 × 19,99). Decidir qual oferta vai ao teste antes de investir na página.
