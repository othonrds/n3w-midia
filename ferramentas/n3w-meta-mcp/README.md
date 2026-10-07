# N3w Meta — conector próprio da Meta Ads (substitui o Windsor)

Servidor MCP remoto num Cloudflare Worker. O Claude (celular, web, desktop) fala com ele como "conector personalizado"; ele fala direto com a Meta Marketing API com o token de System User da N3w. Custo: R$ 0 (plano grátis do Workers = 100 mil requisições/dia).

## Regras gravadas no código
- Tudo é criado **PAUSADO** (campanha, conjunto, anúncio, cópias).
- `ativar` e **aumentar orçamento** são bloqueados sem `autorizacao_humana` com a frase do Othon (fica registrada na resposta).
- Pausar, reduzir orçamento, renomear, criar e ler são livres.
- Valores em reais (o conector converte para centavos).

## Ferramentas (23)
Leitura: `conta_info`, `listar_campanhas`, `listar_conjuntos`, `listar_anuncios`, `insights` (já calcula compras, checkout, CPA, ROAS), `listar_publicos`, `status_video`, `consultar` (GET livre).
Criação: `criar_campanha`, `criar_conjunto` (Advantage+ com públicos sugeridos), `duplicar_campanha`, `duplicar_conjunto`, `subir_video`, `subir_imagem`, `criar_criativo` (qualquer CTA, inclusive SEE_DETAILS), `criar_anuncio`, `criar_semelhante`.
Edição: `pausar`, `ativar`*, `alterar_orcamento`*, `renomear`, `trocar_criativo`, `editar_conjunto`.

## Estabilidade
- Versão da Graph API fixada em **uma linha** (`GRAPH_VERSION` no wrangler.toml / variável do Worker). Hoje: v26.0 (lançada 29/07/2026).
- Repetição automática com espera crescente nos erros de limite da Meta (códigos 4, 17, 32, 613, 80000–80014) e em falhas temporárias de leitura. Escrita só repete em erro de limite (evita criar duplicado).
- Erros voltam traduzidos com `code`, `subcode` e `fbtrace_id` para diagnóstico.
- Manutenção: tarefa agendada semanal confere o changelog da Meta e avisa no painel antes de qualquer versão expirar.

## Instalação (uma vez)

### 1. Token da Meta (Othon, ~10 min, no computador)
1. developers.facebook.com → Meus apps → Criar app → tipo **Empresa** → vincular ao portfólio da N3w (pule se já existir um app da empresa).
2. business.facebook.com → Configurações → Usuários → **Usuários do sistema** → Adicionar → nome `n3w-conector`, função **Administrador**.
3. Nesse usuário → **Atribuir ativos**: conta de anúncios 1805973277429998 (controle total), página, pixel.
4. **Gerar token** → escolha o app → validade **Nunca** → marque `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`, `pages_show_list`.
5. Copie o token e cole **só no Cloudflare** (passo 2). Nunca no chat.

### 2. Worker (Cloudflare)
1. Workers & Pages → Create → Worker → nome `n3w-meta` → Deploy → **Edit code** → cole `src/index.js` inteiro → Deploy.
2. Settings → Variables and Secrets:
   - Texto: `GRAPH_VERSION=v26.0`, `AD_ACCOUNT_ID=1805973277429998`, `PAGE_ID=1358861377303862`
   - Secret: `META_TOKEN` = token do passo 1
   - Secret: `CONNECTOR_KEY` = uma senha longa inventada (40+ caracteres, só letras e números)
3. Abra `https://n3w-meta.<sua-conta>.workers.dev/saude` → deve mostrar `token_configurado: true`.

(Alternativa por linha de comando: `npx wrangler deploy` + `npx wrangler secret put META_TOKEN` + `npx wrangler secret put CONNECTOR_KEY`.)

### 3. Conectar no Claude (celular ou PC)
Personalizar → Conectores → **+** → Adicionar conector personalizado → nome `N3w Meta` → URL:
`https://n3w-meta.<sua-conta>.workers.dev/mcp/<CONNECTOR_KEY>`

Pronto: o Claude passa a ver as 23 ferramentas.

## Trocar a versão da API
Mude só `GRAPH_VERSION` nas variáveis do Worker (ex.: `v27.0`) e chame `conta_info` + `insights` para conferir. Se algo quebrar, volte o valor anterior — leva 10 segundos.
