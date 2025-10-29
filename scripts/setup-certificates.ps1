# Script PowerShell para executar o SQL no banco PostgreSQL
# Execute este script para aplicar as mudanças do sistema de certificados

param(
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [string]$Database = "mermas_digitais_db",
    [string]$Username = "postgres",
    [string]$Password = "mermas123"
)

Write-Host "🚀 Configurando sistema de certificados no banco PostgreSQL..." -ForegroundColor Green

# Caminho do arquivo SQL
$sqlFile = "scripts\setup-certificates-simple.sql"

# Verificar se o arquivo existe
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

# Comando psql
$psqlCommand = "psql -h $Host -p $Port -U $Username -d $Database -f `"$sqlFile`""

Write-Host "📋 Executando comando:" -ForegroundColor Yellow
Write-Host $psqlCommand -ForegroundColor Cyan

try {
    # Definir variável de ambiente para senha
    $env:PGPASSWORD = $Password
    
    # Executar o comando
    Invoke-Expression $psqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sistema de certificados configurado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
        Write-Host "1. Faça upload do template de certificado em public/assets/certificados/" -ForegroundColor White
        Write-Host "2. Atualize a configuração com o caminho correto do template" -ForegroundColor White
        Write-Host "3. Ajuste as posições dos campos conforme seu template" -ForegroundColor White
        Write-Host "4. Teste o envio de certificados" -ForegroundColor White
    } else {
        Write-Host "❌ Erro ao executar o script SQL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpar variável de ambiente
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🔧 Para verificar se funcionou, execute:" -ForegroundColor Cyan
Write-Host "psql -h $Host -p $Port -U $Username -d $Database -c `"SELECT * FROM certificados_config WHERE ativo = TRUE;`"" -ForegroundColor White
