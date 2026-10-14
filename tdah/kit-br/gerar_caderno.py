# Gera o Caderno de Foco (PT-BR) do Kit Foco em PDF A4, fontes padrão (sem embutir), leve.
import sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

OUT = sys.argv[1]
W, H = A4
M = 50
INK = HexColor("#1b1e33"); MUTE = HexColor("#6b7090"); ACC = HexColor("#f2b705"); LINE = HexColor("#c9ccdb"); SOFT = HexColor("#f4f5fa")
c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Kit Foco - Caderno de Foco"); c.setAuthor("Kit Foco"); c.setSubject("Caderno de rotina e organização")
page = [0]

def wrap(text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if c.stringWidth(t, font, size) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def para(x, y, text, size=11, font="Helvetica", color=INK, width=None, lead=None):
    width = width or (W - 2 * M); lead = lead or size * 1.45
    c.setFont(font, size); c.setFillColor(color)
    for ln in wrap(text, font, size, width):
        c.drawString(x, y, ln); y -= lead
    return y

def header(title, sub=None):
    page[0] += 1
    c.setFillColor(ACC); c.rect(M, H - M - 6, 40, 6, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 22); c.drawString(M, H - M - 36, title)
    y = H - M - 58
    if sub: y = para(M, y, sub, 11, color=MUTE) - 6
    c.setFont("Helvetica", 8); c.setFillColor(MUTE)
    c.drawString(M, 28, "Kit Foco - Caderno de Foco"); c.drawRightString(W - M, 28, str(page[0]))
    return y

def lines(y, n, gap=24, x0=M, x1=None):
    x1 = x1 or W - M; c.setStrokeColor(LINE); c.setLineWidth(0.7)
    for i in range(n):
        y -= gap; c.line(x0, y, x1, y)
    return y

def box(x, y, w, h, label=None):
    c.setStrokeColor(LINE); c.setFillColor(SOFT); c.roundRect(x, y - h, w, h, 8, fill=1, stroke=1)
    if label:
        c.setFillColor(INK); c.setFont("Helvetica-Bold", 10); c.drawString(x + 10, y - 16, label)

def checkbox(x, y, s=11):
    c.setStrokeColor(MUTE); c.setLineWidth(0.9); c.rect(x, y - s + 2, s, s, fill=0, stroke=1)

def end(): c.showPage()

# 1 Capa
page[0] += 1
c.setFillColor(INK); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFillColor(ACC); c.rect(M, H - 260, 60, 8, fill=1, stroke=0)
c.setFillColor(HexColor("#ffffff")); c.setFont("Helvetica-Bold", 40); c.drawString(M, H - 310, "Caderno de Foco")
c.setFont("Helvetica", 16); c.setFillColor(HexColor("#c9ccdb"))
c.drawString(M, H - 340, "Rotina, prioridades e o Desafio de 30 dias")
c.setFont("Helvetica", 11)
y = para(M, 150, "Parte do Kit Foco: jogos de atenção, sons de foco e este caderno. Material de organização pessoal. "
         "Não é teste médico, diagnóstico nem tratamento, e não substitui acompanhamento profissional.", 10, color=HexColor("#a9aec8"))
end()

# 2 Como usar
y = header("Como usar este caderno", "Imprima as páginas que quiser usar mais de uma vez (planejador diário, revisão da semana) ou preencha num tablet.")
items = [
    ("1. Comece pelo Desafio de 30 dias", "Uma sessão por dia: 2 ou 3 jogos do kit e um bloco de 25 minutos numa tarefa. Marque o dia no quadro. A meta é a constância, não a perfeição."),
    ("2. Esvazie a cabeça", "Quando a lista mental estiver cheia, use a página Despejo mental. Escreva tudo, sem ordem. Depois escolha o que importa."),
    ("3. Escolha 3 prioridades", "No Planejador diário, escreva só 3 coisas importantes. O resto é bônus."),
    ("4. Trabalhe em blocos", "25 minutos numa única tarefa, 5 de pausa. Use o timer e os sons de foco do kit."),
    ("5. Revise a semana", "Toda semana, 10 minutos: o que funcionou, o que travou, o que muda na próxima."),
]
y -= 6
for t, d in items:
    c.setFont("Helvetica-Bold", 13); c.setFillColor(INK); c.drawString(M, y, t); y -= 18
    y = para(M, y, d, 11, color=MUTE) - 12
y -= 6
box(M, y, W - 2 * M, 70)
para(M + 12, y - 22, "Lembrete: este caderno é uma ferramenta de organização. Se você tem dúvidas sobre sua saúde, atenção ou humor, "
     "converse com um profissional de saúde.", 10, color=INK, width=W - 2 * M - 24)
end()

# 3 Desafio de 30 dias
y = header("Desafio de 30 dias", "Cada dia: 1 sessão de jogos (2 ou 3 jogos) + 1 bloco de foco de 25 minutos. Pinte o quadrado quando terminar.")
cols, rows = 5, 6; gw = (W - 2 * M - (cols - 1) * 10) / cols; gh = 78; y -= 4
for r in range(rows):
    for col in range(cols):
        d = r * cols + col + 1; x = M + col * (gw + 10); yy = y - r * (gh + 10)
        box(x, yy, gw, gh)
        c.setFillColor(INK); c.setFont("Helvetica-Bold", 16); c.drawString(x + 8, yy - 20, str(d))
        c.setFont("Helvetica", 8); c.setFillColor(MUTE)
        checkbox(x + 8, yy - 36, 9); c.drawString(x + 21, yy - 35, "jogos")
        checkbox(x + 8, yy - 52, 9); c.drawString(x + 21, yy - 51, "bloco 25 min")
y = y - rows * (gh + 10) - 6
para(M, y, "Perdeu um dia? Não recomece do zero: continue do próximo número.", 10, color=MUTE)
end()

# 4 Registro dos jogos
y = header("Registro dos jogos", "Anote seu melhor resultado da semana. Serve só para você acompanhar a própria evolução nos jogos.")
games = ["Reflexo (pontos)", "Caça-Números (segundos)", "Choque de Cores (pontos)", "Luzes em Eco (luzes)", "Blocos (pontos)", "Junta-Junta (pontos)", "Separa-Cores (fase)"]
colw = [190] + [(W - 2 * M - 190) / 4] * 4
y -= 10; xs = [M]
for w_ in colw[:-1]: xs.append(xs[-1] + w_)
c.setFont("Helvetica-Bold", 10); c.setFillColor(INK)
for i, h_ in enumerate(["Jogo", "Semana 1", "Semana 2", "Semana 3", "Semana 4"]): c.drawString(xs[i] + 6, y, h_)
y -= 10
for g in games:
    c.setStrokeColor(LINE); c.line(M, y, W - M, y); y -= 34
    c.setFont("Helvetica", 11); c.setFillColor(INK); c.drawString(M + 6, y + 12, g)
c.line(M, y, W - M, y)
for x in xs[1:]: c.line(x, y, x, y + 34 * len(games))
end()

# 5-6 Planejador diário (2 cópias)
for k in range(2):
    y = header("Planejador diário", "Data: ____ / ____ / ________")
    box(M, y, W - 2 * M, 120, "As 3 prioridades de hoje")
    yy = y - 34
    for i in range(3):
        checkbox(M + 12, yy); c.setStrokeColor(LINE); c.line(M + 30, yy - 9, W - M - 12, yy - 9); yy -= 28
    y -= 136
    half = (W - 2 * M - 12) / 2
    box(M, y, half, 230, "Blocos de foco (25 min)")
    yy = y - 36
    for i in range(6):
        c.setFont("Helvetica", 9); c.setFillColor(MUTE); c.drawString(M + 12, yy, "%d." % (i + 1))
        c.setStrokeColor(LINE); c.line(M + 26, yy - 2, M + half - 12, yy - 2); yy -= 32
    box(M + half + 12, y, half, 230, "Outras tarefas (se der)")
    lines(y - 24, 7, 28, M + half + 24, W - M - 12)
    y -= 246
    box(M, y, W - 2 * M, 110, "Anotações / ideias que apareceram")
    lines(y - 22, 3, 26, M + 12, W - M - 12)
    end()

# 7 Despejo mental
y = header("Despejo mental", "Escreva tudo o que está ocupando sua cabeça. Sem ordem, sem filtro. Depois marque: F = fazer hoje, A = agendar, D = delegar, X = descartar.")
yy = lines(y, 22, 26)
end()

# 8 Matriz de prioridades
y = header("Matriz de prioridades", "Distribua as tarefas do despejo mental. Comece pelo quadrante 1, reserve horário para o 2.")
q = (W - 2 * M - 12) / 2; qh = 280
labels = [("1. Importante e urgente", "Fazer agora"), ("2. Importante, não urgente", "Agendar um bloco"),
          ("3. Urgente, não importante", "Delegar ou resolver rápido"), ("4. Nem urgente nem importante", "Descartar")]
for i, (t, s) in enumerate(labels):
    x = M + (i % 2) * (q + 12); yy = y - (i // 2) * (qh + 12)
    box(x, yy, q, qh, t); c.setFont("Helvetica", 9); c.setFillColor(MUTE); c.drawString(x + 10, yy - 30, s)
end()

# 9 Rotinas
y = header("Rotina da manhã e da noite", "Poucos passos, sempre na mesma ordem. Escreva os seus e marque por 7 dias.")
for title, sug in [("Manhã", ["Copo de água", "Ver as 3 prioridades", "1 jogo do kit (2 min)"]),
                   ("Noite", ["Revisar o dia (2 linhas)", "Escolher as prioridades de amanhã", "Celular longe da cama"])]:
    box(M, y, W - 2 * M, 270, title)
    c.setFont("Helvetica-Bold", 9); c.setFillColor(MUTE)
    for d in range(7): c.drawString(W - M - 150 + d * 20, y - 34, "STQQSSD"[d])
    yy = y - 54
    for i in range(6):
        c.setFont("Helvetica", 10); c.setFillColor(MUTE)
        if i < len(sug): c.drawString(M + 12, yy, sug[i])
        else: c.setStrokeColor(LINE); c.line(M + 12, yy - 2, W - M - 170, yy - 2)
        for d in range(7): checkbox(W - M - 151 + d * 20, yy + 9, 10)
        yy -= 34
    y -= 286
end()

# 10 Ambiente
y = header("Checklist do ambiente de foco", "Antes de um bloco de 25 minutos, confira:")
for it in ["Uma única tarefa escrita no planejador", "Celular no silencioso e fora do alcance", "Abas e janelas que não são da tarefa fechadas",
           "Água por perto", "Som de foco ligado (fone)", "Timer de 25 minutos iniciado", "Papel ao lado para anotar distrações e voltar à tarefa",
           "Pausa de 5 minutos combinada (levantar, alongar, olhar longe)"]:
    checkbox(M, y); y = para(M + 20, y, it, 12) - 10
y -= 10
box(M, y, W - 2 * M, 160, "Minhas distrações mais comuns e o que vou fazer com elas")
lines(y - 22, 4, 30, M + 12, W - M - 12)
end()

# 11-12 Revisão da semana (2 cópias)
for k in range(2):
    y = header("Revisão da semana", "Semana de ____ / ____ a ____ / ____")
    for t in ["O que funcionou?", "O que travou?", "Quantos dias do desafio eu completei?", "Uma coisa que vou mudar na próxima semana"]:
        box(M, y, W - 2 * M, 150, t); lines(y - 22, 4, 28, M + 12, W - M - 12); y -= 162
    end()

# 13 Fechamento
y = header("Sobre os jogos do kit", "De onde vêm os formatos dos jogos.")
for t, d in [("Choque de Cores", "Inspirado no teste de cores de Stroop, descrito em 1935 e usado até hoje em pesquisas sobre atenção."),
             ("Caça-Números", "Inspirado nas tabelas de Schulte, grades de números usadas para estudar busca visual."),
             ("Reflexo", "Inspirado nas tarefas Go/No-Go: responder ao estímulo certo e segurar a resposta ao errado."),
             ("Luzes em Eco", "Inspirado em tarefas de sequência (como o bloco de Corsi), que medem memória de curto prazo."),
             ("Blocos, Junta-Junta e Separa-Cores", "Quebra-cabeças para pausas leves entre blocos de foco. São só passatempo.")]:
    c.setFont("Helvetica-Bold", 12); c.setFillColor(INK); c.drawString(M, y, t); y -= 17
    y = para(M, y, d, 11, color=MUTE) - 12
y -= 8
box(M, y, W - 2 * M, 84)
para(M + 12, y - 22, "Os jogos do Kit Foco são entretenimento e prática. Eles não medem, não diagnosticam e não tratam nenhuma condição, "
     "e os resultados nos jogos não indicam nada sobre sua saúde.", 10, width=W - 2 * M - 24)
end()

c.save()
print(OUT, page[0], "páginas")
