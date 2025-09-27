# Script para testar conexão com o banco local
# Execute este script no PowerShell

Write-Host "🧪 Testando conexão com o banco local..." -ForegroundColor Green

# Verificar se Docker está rodando
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker está rodando" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker não está rodando. Inicie o Docker primeiro." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker não encontrado. Instale o Docker primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o container está rodando
$containerStatus = docker ps --filter "name=mermas_digitais_db" --format "{{.Status}}"
if ($containerStatus -like "*Up*") {
    Write-Host "✅ Container PostgreSQL está rodando" -ForegroundColor Green
} else {
    Write-Host "❌ Container PostgreSQL não está rodando. Execute: docker-compose up -d" -ForegroundColor Red
    exit 1
}

# Testar conexão com psql
try {
    $testQuery = "SELECT version();"
    $result = docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -c $testQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexão com PostgreSQL funcionando" -ForegroundColor Green
        Write-Host "📊 Versão do PostgreSQL:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "❌ Erro na conexão com PostgreSQL" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao testar conexão: $_" -ForegroundColor Red
    exit 1
}

# Verificar tabelas
try {
    $tableQuery = "SELECT COUNT(*) as total_tabelas FROM information_schema.tables WHERE table_schema = 'public';"
    $tableResult = docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -t -c $tableQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $tableCount = $tableResult.Trim()
        Write-Host "✅ Banco de dados configurado com $tableCount tabelas" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao verificar tabelas" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar tabelas: $_" -ForegroundColor Red
}

# Verificar estrutura da tabela escolas
try {
    $escolasQuery = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'escolas' ORDER BY ordinal_position;"
    $escolasResult = docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -c $escolasQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Estrutura da tabela 'escolas' verificada" -ForegroundColor Green
        Write-Host "📋 Colunas da tabela escolas:" -ForegroundColor Cyan
        Write-Host $escolasResult -ForegroundColor White
    } else {
        Write-Host "❌ Erro ao verificar estrutura da tabela escolas" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar estrutura da tabela escolas: $_" -ForegroundColor Red
}

Write-Host "🏁 Teste de conexão concluído!" -ForegroundColor Green
