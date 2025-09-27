#!/bin/bash
# Script Bash para executar o scraping em container

echo "🐳 Iniciando scraping de escolas em container Docker..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker-compose up --build -d

# Mostrar logs do scraper
echo "📋 Acompanhando logs do scraping..."
echo "Pressione Ctrl+C para parar o acompanhamento (containers continuarão rodando)"
docker-compose logs -f scraper
