# Script para executar a correção da constraint de gênero no Supabase

Write-Host "🔧 Corrigindo constraint de gênero na tabela orientadores..." -ForegroundColor Yellow

# Carregar variáveis de ambiente
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$supabaseUrl = $env:SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas no .env" -ForegroundColor Red
    exit 1
}

# Ler o script SQL
$sqlScript = Get-Content "scripts/fix-genero-constraint.sql" -Raw

# Executar no Supabase
try {
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
    }

    $body = @{
        query = $sqlScript
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body

    Write-Host "✅ Constraint de gênero corrigida com sucesso!" -ForegroundColor Green
    Write-Host "📋 Resposta: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Erro ao executar script SQL:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Tentar método alternativo usando query direta
    Write-Host "🔄 Tentando método alternativo..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "apikey" = $supabaseKey
            "Authorization" = "Bearer $supabaseKey"
            "Content-Type" = "application/json"
        }

        # Executar cada comando SQL separadamente
        $commands = @(
            "ALTER TABLE orientadores DROP CONSTRAINT IF EXISTS orientadores_genero_check;",
            "ALTER TABLE orientadores ADD CONSTRAINT orientadores_genero_check CHECK (genero IN ('feminino', 'masculino', 'nao-binario', 'transgenero', 'outro', 'prefiro_nao_informar'));"
        )

        foreach ($command in $commands) {
            $body = @{
                query = $command
            } | ConvertTo-Json

            $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
            Write-Host "✅ Comando executado: $command" -ForegroundColor Green
        }

    } catch {
        Write-Host "❌ Erro no método alternativo:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host "💡 Execute o script SQL manualmente no Supabase Dashboard" -ForegroundColor Yellow
    }
}
