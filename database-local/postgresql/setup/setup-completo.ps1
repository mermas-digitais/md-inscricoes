# ===============================================
# SCRIPT DE SETUP COMPLETO - MERMÃS DIGITAIS
# ===============================================
# Este script automatiza todo o processo de setup
# do banco PostgreSQL com migração do Supabase

param(
    [switch]$SkipMigration = $false,
    [switch]$ForceRecreate = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "SCRIPT DE SETUP COMPLETO - MERMÃS DIGITAIS" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\setup-completo.ps1 [opções]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "  -SkipMigration    Pula a migração de dados do Supabase" -ForegroundColor White
    Write-Host "  -ForceRecreate    Força recriação completa do banco" -ForegroundColor White
    Write-Host "  -Help             Mostra esta ajuda" -ForegroundColor White
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Yellow
    Write-Host "  .\setup-completo.ps1                    # Setup completo" -ForegroundColor White
    Write-Host "  .\setup-completo.ps1 -ForceRecreate     # Recriar tudo" -ForegroundColor White
    Write-Host "  .\setup-completo.ps1 -SkipMigration     # Só estrutura" -ForegroundColor White
    exit 0
}

# Função para log colorido
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

# Função para verificar se comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Função para aguardar container
function Wait-ForContainer {
    param([string]$ContainerName, [int]$TimeoutSeconds = 60)
    
    Write-Log "Aguardando container $ContainerName ficar pronto..." "INFO"
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $status = docker inspect $ContainerName --format='{{.State.Health.Status}}' 2>$null
        if ($status -eq "healthy") {
            Write-Log "Container $ContainerName está pronto!" "SUCCESS"
            return $true
        }
        
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Log "Timeout aguardando container $ContainerName" "WARNING"
    return $false
}

# ===============================================
# INÍCIO DO SCRIPT
# ===============================================

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🚀 SETUP COMPLETO - MERMÃS DIGITAIS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar pré-requisitos
Write-Log "Verificando pré-requisitos..." "INFO"

if (-not (Test-Command "docker")) {
    Write-Log "Docker não encontrado! Instale o Docker Desktop." "ERROR"
    exit 1
}

if (-not (Test-Command "docker-compose")) {
    Write-Log "Docker Compose não encontrado!" "ERROR"
    exit 1
}

if (-not (Test-Command "python")) {
    Write-Log "Python não encontrado! Instale o Python 3.8+." "ERROR"
    exit 1
}

Write-Log "Pré-requisitos OK!" "SUCCESS"

# 2. Verificar arquivo .env
Write-Log "Verificando arquivo .env..." "INFO"

if (-not (Test-Path ".env")) {
    Write-Log "Arquivo .env não encontrado!" "ERROR"
    Write-Log "Crie um arquivo .env com as variáveis do Supabase:" "WARNING"
    Write-Log "NEXT_PUBLIC_SUPABASE_URL=sua_url" "WARNING"
    Write-Log "SUPABASE_SERVICE_ROLE_KEY=sua_key" "WARNING"
    exit 1
}

Write-Log "Arquivo .env encontrado!" "SUCCESS"

# 3. Instalar dependências Python
Write-Log "Instalando dependências Python..." "INFO"

try {
    pip install psycopg2-binary python-dotenv supabase --quiet
    Write-Log "Dependências Python instaladas!" "SUCCESS"
} catch {
    Write-Log "Erro ao instalar dependências Python: $($_.Exception.Message)" "ERROR"
    exit 1
}

# 4. Parar containers existentes
Write-Log "Parando containers existentes..." "INFO"

if ($ForceRecreate) {
    docker-compose down -v
    Write-Log "Volumes removidos (recriação forçada)" "WARNING"
} else {
    docker-compose down
}

# 5. Subir banco de dados
Write-Log "Subindo banco de dados PostgreSQL..." "INFO"

try {
    docker-compose up -d
    Write-Log "Container PostgreSQL iniciado!" "SUCCESS"
} catch {
    Write-Log "Erro ao iniciar container: $($_.Exception.Message)" "ERROR"
    exit 1
}

# 6. Aguardar banco ficar pronto
if (-not (Wait-ForContainer "mermas_digitais_db" 120)) {
    Write-Log "Banco não ficou pronto a tempo. Verificando logs..." "WARNING"
    docker-compose logs postgres
    exit 1
}

# 7. Verificar estrutura inicial
Write-Log "Verificando estrutura inicial do banco..." "INFO"

$tableCount = docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null

if ($tableCount -match '\d+') {
    $count = [int]$matches[0]
    Write-Log "Tabelas criadas: $count" "SUCCESS"
    
    if ($count -lt 12) {
        Write-Log "Poucas tabelas criadas. Verificando logs..." "WARNING"
        docker-compose logs postgres
    }
} else {
    Write-Log "Erro ao verificar tabelas" "WARNING"
}

# 8. Migrar dados do Supabase (se não pulado)
if (-not $SkipMigration) {
    Write-Log "Iniciando migração de dados do Supabase..." "INFO"
    
    try {
        $migrationResult = python database/postgresql/setup/migrate_data_adaptive.py 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Migração concluída com sucesso!" "SUCCESS"
            
            # Extrair estatísticas da migração
            if ($migrationResult -match "Total de registros migrados: (\d+)") {
                $records = $matches[1]
                Write-Log "Registros migrados: $records" "SUCCESS"
            }
            
            if ($migrationResult -match "Tabelas migradas com sucesso: (\d+)/(\d+)") {
                $success = $matches[1]
                $total = $matches[2]
                Write-Log "Tabelas migradas: $success/$total" "SUCCESS"
            }
        } else {
            Write-Log "Erro na migração. Verifique as variáveis do Supabase no .env" "ERROR"
            Write-Host $migrationResult -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Log "Erro ao executar migração: $($_.Exception.Message)" "ERROR"
        exit 1
    }
} else {
    Write-Log "Migração pulada (apenas estrutura criada)" "WARNING"
}

# 9. Verificação final
Write-Log "Executando verificação final..." "INFO"

$finalTableCount = docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null

if ($finalTableCount -match '\d+') {
    $count = [int]$matches[0]
    Write-Log "Total de tabelas no banco: $count" "SUCCESS"
    
    if ($count -ge 17) {
        Write-Log "✅ Setup completo! Todas as tabelas criadas." "SUCCESS"
    } elseif ($count -ge 12) {
        Write-Log "✅ Setup básico OK! Tabelas do sistema original criadas." "SUCCESS"
    } else {
        Write-Log "⚠️  Setup incompleto. Verifique os logs." "WARNING"
    }
}

# 10. Informações de conexão
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "🎉 SETUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Informações de Conexão:" -ForegroundColor Yellow
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Porta: 5432" -ForegroundColor White
Write-Host "   Banco: mermas_digitais_db" -ForegroundColor White
Write-Host "   Usuário: postgres" -ForegroundColor White
Write-Host "   Senha: mermas123" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URL de Conexão:" -ForegroundColor Yellow
Write-Host "   postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Comandos Úteis:" -ForegroundColor Yellow
Write-Host "   Conectar: docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db" -ForegroundColor White
Write-Host "   Parar: docker-compose down" -ForegroundColor White
Write-Host "   Logs: docker-compose logs postgres" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação: database/postgresql/README-COMPLETO.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 O banco está pronto para uso!" -ForegroundColor Green
