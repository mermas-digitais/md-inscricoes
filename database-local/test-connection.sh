#!/bin/bash

# Script para testar conexão com o banco local
# Execute este script no terminal

echo "🧪 Testando conexão com o banco local..."

# Verificar se Docker está rodando
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

echo "✅ Docker está rodando"

# Verificar se o container está rodando
if ! docker ps --filter "name=mermas_digitais_db" --format "{{.Status}}" | grep -q "Up"; then
    echo "❌ Container PostgreSQL não está rodando. Execute: docker-compose up -d"
    exit 1
fi

echo "✅ Container PostgreSQL está rodando"

# Testar conexão com psql
if docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -c "SELECT version();" >/dev/null 2>&1; then
    echo "✅ Conexão com PostgreSQL funcionando"
    echo "📊 Versão do PostgreSQL:"
    docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -c "SELECT version();"
else
    echo "❌ Erro na conexão com PostgreSQL"
    exit 1
fi

# Verificar tabelas
table_count=$(docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
if [ $? -eq 0 ]; then
    echo "✅ Banco de dados configurado com $table_count tabelas"
else
    echo "❌ Erro ao verificar tabelas"
fi

# Verificar estrutura da tabela escolas
if docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'escolas' ORDER BY ordinal_position;" >/dev/null 2>&1; then
    echo "✅ Estrutura da tabela 'escolas' verificada"
    echo "📋 Colunas da tabela escolas:"
    docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'escolas' ORDER BY ordinal_position;"
else
    echo "❌ Erro ao verificar estrutura da tabela escolas"
fi

echo "🏁 Teste de conexão concluído!"
