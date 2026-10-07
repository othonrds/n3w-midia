# Disparador do Operario - Central N3w (versao PowerShell, nada para instalar)
# Le um "sinal" publico (GitHub n3w-midia). Quando o id muda: abre o Chrome na pasta das
# Caixas do Operario, abre o painel da extensao do Claude pelo atalho e cola o PROMPT FIXO
# do config.json. O sinal so diz "pode ir"; as instrucoes ficam nos Docs do Drive.
# Uso:  powershell -ExecutionPolicy Bypass -File n3w_operario.ps1            (loop)
#       powershell -ExecutionPolicy Bypass -File n3w_operario.ps1 -Agora     (teste)
#       powershell -ExecutionPolicy Bypass -File n3w_operario.ps1 -Calibrar  (posicao do mouse)
param([switch]$Agora, [switch]$Calibrar)

$ErrorActionPreference = "Stop"
$Pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
$CfgPath = Join-Path $Pasta "config.json"
$EstadoPath = Join-Path $Pasta "estado.json"
$LogPath = Join-Path $Pasta "operario.log"

Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class N3w {
  [StructLayout(LayoutKind.Sequential)] struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, UIntPtr e);
  public static double IdleSeconds() {
    LASTINPUTINFO l = new LASTINPUTINFO(); l.cbSize = (uint)Marshal.SizeOf(l);
    GetLastInputInfo(ref l); return ((uint)Environment.TickCount - l.dwTime) / 1000.0;
  }
  public static void Click(int x, int y) { SetCursorPos(x, y); mouse_event(2,0,0,0,UIntPtr.Zero); mouse_event(4,0,0,0,UIntPtr.Zero); }
}
"@

function Log($msg) {
  $linha = "{0}  {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Write-Host $linha
  Add-Content -Path $LogPath -Value $linha -Encoding UTF8
}

function Ler-Json($path) {
  if (Test-Path $path) { return Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json }
  return $null
}

function Achar-Chrome($cfg) {
  $c = @($cfg.chrome_path,
         "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
         "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
         "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
  foreach ($p in $c) { if ($p -and (Test-Path $p)) { return $p } }
  throw "Chrome nao encontrado; preencha chrome_path no config.json"
}

function Disparar($cfg, $motivo) {
  Log "Disparando: $motivo"
  $chrome = Achar-Chrome $cfg
  if (-not $cfg.clicar_icone -and -not $cfg.atalho_extensao) {
    throw "Nao sei abrir a extensao: rode calibrar.bat (ou preencha atalho_extensao)."
  }
  if (-not $cfg.clicar_campo) { throw "Falta a posicao da caixa de texto: rode calibrar.bat." }
  $argList = @("--new-window", "--start-maximized", $cfg.abrir_url)
  if ($cfg.perfil_chrome) { $argList = @("--profile-directory=$($cfg.perfil_chrome)") + $argList }
  Start-Process -FilePath $chrome -ArgumentList $argList
  Start-Sleep -Seconds $cfg.espera_chrome_s
  # 1) abrir o painel da extensao: clique no icone do Claude (preferido) ou atalho
  if ($cfg.clicar_icone) { [N3w]::Click([int]$cfg.clicar_icone[0], [int]$cfg.clicar_icone[1]) }
  else { [System.Windows.Forms.SendKeys]::SendWait($cfg.atalho_extensao) }
  Start-Sleep -Seconds $cfg.espera_extensao_s
  # 2) clicar na caixa de texto da extensao (nunca colar sem esse clique: evita cair na barra de endereco)
  [N3w]::Click([int]$cfg.clicar_campo[0], [int]$cfg.clicar_campo[1])
  Start-Sleep -Milliseconds 700
  Set-Clipboard -Value $cfg.prompt
  [System.Windows.Forms.SendKeys]::SendWait("^v")
  Start-Sleep -Milliseconds 800
  [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
  Log "Prompt enviado para a extensao."
}

function Pode-Disparar($cfg, $estado) {
  if (Test-Path (Join-Path $Pasta "PAUSAR")) { return "pausado (arquivo PAUSAR)" }
  $h = (Get-Date).Hour
  if ($h -lt $cfg.horario[0] -or $h -ge $cfg.horario[1]) { return "fora do horario" }
  $ocioso = [N3w]::IdleSeconds()
  if ($ocioso -lt ($cfg.ocioso_min * 60)) { return "computador em uso (parado ha $([int]$ocioso) s)" }
  if ($estado -and $estado.ultimo_disparo) {
    $passou = ((Get-Date) - [datetime]$estado.ultimo_disparo).TotalMinutes
    if ($passou -lt $cfg.intervalo_minimo_min) { return "disparou ha pouco tempo" }
  }
  return ""
}

function Ciclo($cfg) {
  $estado = Ler-Json $EstadoPath
  try {
    $sinal = Invoke-RestMethod -Uri ("{0}?t={1}" -f $cfg.sinal_url, [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) -Headers @{"Cache-Control"="no-cache"} -TimeoutSec 20
  } catch { Log "Nao consegui ler o sinal: $($_.Exception.Message)"; return }
  $sid = [string]$sinal.id
  if (-not $sid -or ($estado -and $estado.ultimo_id -eq $sid)) { return }
  $bloqueio = Pode-Disparar $cfg $estado
  if ($bloqueio) { Log "Sinal novo $sid, aguardando: $bloqueio"; return }
  try {
    Disparar $cfg $(if ($sinal.motivo) { $sinal.motivo } else { $sid })
    @{ ultimo_id = $sid; ultimo_disparo = (Get-Date).ToString("o") } | ConvertTo-Json | Set-Content -Path $EstadoPath -Encoding UTF8
  } catch { Log "Erro ao disparar: $($_.Exception.Message)" }
}

$cfg = Ler-Json $CfgPath
if (-not $cfg) { Write-Host "config.json nao encontrado ou invalido."; exit 1 }

if ($Calibrar) {
  Write-Host ""
  Write-Host "CALIBRAGEM (2 passos). Deixe o Chrome MAXIMIZADO, com a extensao do Claude FECHADA."
  Write-Host ""
  Write-Host "Passo 1: coloque o mouse em cima do ICONE do Claude (asterisco laranja) na barra do Chrome."
  Write-Host "         Nao clique. Voce tem 8 segundos..."
  Start-Sleep -Seconds 8
  $i = [System.Windows.Forms.Cursor]::Position
  Write-Host "         Icone gravado: [$($i.X), $($i.Y)]"
  Write-Host ""
  Write-Host "Passo 2: agora CLIQUE no icone para abrir o painel do Claude e coloque o mouse em cima"
  Write-Host "         da caixa 'Write a message...' (onde se digita). Voce tem 12 segundos..."
  Start-Sleep -Seconds 12
  $c = [System.Windows.Forms.Cursor]::Position
  Write-Host "         Caixa de texto gravada: [$($c.X), $($c.Y)]"
  $cfg | Add-Member -NotePropertyName clicar_icone -NotePropertyValue @($i.X, $i.Y) -Force
  $cfg | Add-Member -NotePropertyName clicar_campo -NotePropertyValue @($c.X, $c.Y) -Force
  $cfg | ConvertTo-Json -Depth 5 | Set-Content -Path $CfgPath -Encoding UTF8
  Write-Host ""
  Write-Host "Pronto! Posicoes salvas no config.json. Feche o painel do Claude e rode testar.bat."
  Read-Host "Enter para sair"
  exit 0
}
if ($Agora) { Disparar $cfg "teste manual"; exit 0 }

Log "Disparador do Operario iniciado."
while ($true) {
  Ciclo $cfg
  Start-Sleep -Seconds ($cfg.intervalo_leitura_min * 60)
}
