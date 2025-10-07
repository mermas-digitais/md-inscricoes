#!/bin/bash

# Script Bash para sincronização de bancos
DIRECTION=${1:-"bidirectional"}

echo "🔄 Iniciando sincronização de bancos..."
echo "Direção: $DIRECTION"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js encontrado: $NODE_VERSION"

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Executar a sincronização
echo "🚀 Executando sincronização..."
node scripts/sync-databases.js "$DIRECTION"

if [ $? -eq 0 ]; then
    echo "✅ Sincronização concluída com sucesso!"
else
    echo "❌ Erro na sincronização!"
    exit 1
fi
