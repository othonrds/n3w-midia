# Configurar tudo - Disparador do Operario (Central N3w)
$ErrorActionPreference = "Continue"
$Pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script = Join-Path $Pasta "n3w_operario.ps1"
$PS = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"

Write-Host ""
Write-Host "=== 1/4  Limpando versoes antigas ===" -ForegroundColor Cyan
cmd /c 'schtasks /delete /f /tn "N3w Operario" >nul 2>nul'
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*n3w_operario*" -and $_.ProcessId -ne $PID } | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  Write-Host "  parado: processo $($_.ProcessId)"
}
Remove-Item (Join-Path $Pasta "estado.json") -ErrorAction SilentlyContinue
Write-Host "  ok"

Write-Host ""
Write-Host "=== 2/4  Calibragem ===" -ForegroundColor Cyan
Write-Host "Deixe o Chrome ABERTO e MAXIMIZADO, com o painel do Claude FECHADO."
Read-Host "Quando estiver pronto, aperte Enter"
& $PS -NoProfile -ExecutionPolicy Bypass -File $Script -Calibrar

Write-Host ""
Write-Host "=== 3/4  Teste ===" -ForegroundColor Cyan
Write-Host "FECHE o painel do Claude no Chrome."
Read-Host "Aperte Enter e solte o mouse e o teclado"
& $PS -NoProfile -ExecutionPolicy Bypass -File $Script -Agora
Write-Host ""
$r = Read-Host "Funcionou? O prompt entrou na caixa do Claude e foi enviado? (S/N)"
if ($r -notmatch '^[sS]') {
  Write-Host "Ok, nada foi instalado. Tire um print desta janela e mande para o Claude gestor." -ForegroundColor Yellow
  Read-Host "Enter para sair"; exit 1
}

Write-Host ""
Write-Host "=== 4/4  Instalando ===" -ForegroundColor Cyan
$acao = "`"$PS`" -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Script`""
cmd /c "schtasks /create /f /tn `"N3w Operario`" /sc onlogon /rl limited /tr `"$($acao -replace '"','\"')`"" | Out-Null
Start-Process -FilePath $PS -ArgumentList @("-NoProfile","-WindowStyle","Hidden","-ExecutionPolicy","Bypass","-File","`"$Script`"") -WindowStyle Hidden
Write-Host "Pronto! O Disparador esta rodando e vai ligar sozinho sempre que o Windows iniciar." -ForegroundColor Green
Write-Host "Pode apagar as outras pastas antigas em C:\N3w (deixe so esta)."
Read-Host "Enter para sair"
