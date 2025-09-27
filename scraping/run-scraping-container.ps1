# Script PowerShell para executar o scraping em container
Write-Host "🐳 Iniciando scraping de escolas em container Docker..." -ForegroundColor Green

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

# Construir e iniciar containers
Write-Host "🔨 Construindo e iniciando containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Mostrar logs do scraper
Write-Host "📋 Acompanhando logs do scraping..." -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar o acompanhamento (containers continuarão rodando)" -ForegroundColor Gray
docker-compose logs -f scraper
