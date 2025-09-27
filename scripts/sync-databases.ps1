# Script PowerShell para sincronização de bancos
param(
    [string]$Direction = "bidirectional"
)

Write-Host "🔄 Iniciando sincronização de bancos..." -ForegroundColor Green
Write-Host "Direção: $Direction" -ForegroundColor Cyan

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Executar a sincronização
Write-Host "🚀 Executando sincronização..." -ForegroundColor Yellow
node scripts/sync-databases.js $Direction

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sincronização concluída com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro na sincronização!" -ForegroundColor Red
    exit 1
}
