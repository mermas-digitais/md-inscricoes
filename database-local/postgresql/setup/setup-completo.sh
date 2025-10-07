#!/bin/bash

# ===============================================
# SCRIPT DE SETUP COMPLETO - MERMÃS DIGITAIS
# ===============================================
# Este script automatiza todo o processo de setup
# do banco PostgreSQL com migração do Supabase

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variáveis
SKIP_MIGRATION=false
FORCE_RECREATE=false

# Função para log colorido
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        "SUCCESS")
            echo -e "[$timestamp] [${GREEN}SUCCESS${NC}] $message"
            ;;
        "ERROR")
            echo -e "[$timestamp] [${RED}ERROR${NC}] $message"
            ;;
        "WARNING")
            echo -e "[$timestamp] [${YELLOW}WARNING${NC}] $message"
            ;;
        "INFO")
            echo -e "[$timestamp] [${CYAN}INFO${NC}] $message"
            ;;
        *)
            echo -e "[$timestamp] [INFO] $message"
            ;;
    esac
}

# Função para mostrar ajuda
show_help() {
    echo -e "${CYAN}===============================================${NC}"
    echo -e "${CYAN}SCRIPT DE SETUP COMPLETO - MERMÃS DIGITAIS${NC}"
    echo -e "${CYAN}===============================================${NC}"
    echo ""
    echo -e "${YELLOW}Uso: ./setup-completo.sh [opções]${NC}"
    echo ""
    echo -e "${YELLOW}Opções:${NC}"
    echo -e "  --skip-migration    Pula a migração de dados do Supabase"
    echo -e "  --force-recreate    Força recriação completa do banco"
    echo -e "  --help              Mostra esta ajuda"
    echo ""
    echo -e "${YELLOW}Exemplos:${NC}"
    echo -e "  ./setup-completo.sh                    # Setup completo"
    echo -e "  ./setup-completo.sh --force-recreate   # Recriar tudo"
    echo -e "  ./setup-completo.sh --skip-migration   # Só estrutura"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para aguardar container
wait_for_container() {
    local container_name=$1
    local timeout=${2:-60}
    
    log "INFO" "Aguardando container $container_name ficar pronto..."
    
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if docker inspect "$container_name" --format='{{.State.Health.Status}}' >/dev/null 2>&1; then
            local status=$(docker inspect "$container_name" --format='{{.State.Health.Status}}' 2>/dev/null)
            if [ "$status" = "healthy" ]; then
                log "SUCCESS" "Container $container_name está pronto!"
                return 0
            fi
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    
    echo ""
    log "WARNING" "Timeout aguardando container $container_name"
    return 1
}

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        --force-recreate)
            FORCE_RECREATE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Opção desconhecida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# ===============================================
# INÍCIO DO SCRIPT
# ===============================================

echo -e "${CYAN}===============================================${NC}"
echo -e "${CYAN}🚀 SETUP COMPLETO - MERMÃS DIGITAIS${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""

# 1. Verificar pré-requisitos
log "INFO" "Verificando pré-requisitos..."

if ! command_exists docker; then
    log "ERROR" "Docker não encontrado! Instale o Docker."
    exit 1
fi

if ! command_exists docker-compose; then
    log "ERROR" "Docker Compose não encontrado!"
    exit 1
fi

if ! command_exists python3; then
    log "ERROR" "Python 3 não encontrado! Instale o Python 3.8+."
    exit 1
fi

log "SUCCESS" "Pré-requisitos OK!"

# 2. Verificar arquivo .env
log "INFO" "Verificando arquivo .env..."

if [ ! -f ".env" ]; then
    log "ERROR" "Arquivo .env não encontrado!"
    log "WARNING" "Crie um arquivo .env com as variáveis do Supabase:"
    log "WARNING" "NEXT_PUBLIC_SUPABASE_URL=sua_url"
    log "WARNING" "SUPABASE_SERVICE_ROLE_KEY=sua_key"
    exit 1
fi

log "SUCCESS" "Arquivo .env encontrado!"

# 3. Instalar dependências Python
log "INFO" "Instalando dependências Python..."

if pip3 install psycopg2-binary python-dotenv supabase --quiet; then
    log "SUCCESS" "Dependências Python instaladas!"
else
    log "ERROR" "Erro ao instalar dependências Python"
    exit 1
fi

# 4. Parar containers existentes
log "INFO" "Parando containers existentes..."

if [ "$FORCE_RECREATE" = true ]; then
    docker-compose down -v
    log "WARNING" "Volumes removidos (recriação forçada)"
else
    docker-compose down
fi

# 5. Subir banco de dados
log "INFO" "Subindo banco de dados PostgreSQL..."

if docker-compose up -d; then
    log "SUCCESS" "Container PostgreSQL iniciado!"
else
    log "ERROR" "Erro ao iniciar container"
    exit 1
fi

# 6. Aguardar banco ficar pronto
if ! wait_for_container "mermas_digitais_db" 120; then
    log "WARNING" "Banco não ficou pronto a tempo. Verificando logs..."
    docker-compose logs postgres
    exit 1
fi

# 7. Verificar estrutura inicial
log "INFO" "Verificando estrutura inicial do banco..."

table_count=$(docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [[ $table_count =~ ^[0-9]+$ ]]; then
    log "SUCCESS" "Tabelas criadas: $table_count"
    
    if [ "$table_count" -lt 12 ]; then
        log "WARNING" "Poucas tabelas criadas. Verificando logs..."
        docker-compose logs postgres
    fi
else
    log "WARNING" "Erro ao verificar tabelas"
fi

# 8. Migrar dados do Supabase (se não pulado)
if [ "$SKIP_MIGRATION" = false ]; then
    log "INFO" "Iniciando migração de dados do Supabase..."
    
    if python3 database/postgresql/setup/migrate_data_adaptive.py; then
        log "SUCCESS" "Migração concluída com sucesso!"
    else
        log "ERROR" "Erro na migração. Verifique as variáveis do Supabase no .env"
        exit 1
    fi
else
    log "WARNING" "Migração pulada (apenas estrutura criada)"
fi

# 9. Verificação final
log "INFO" "Executando verificação final..."

final_table_count=$(docker exec mermas_digitais_db psql -U postgres -d mermas_digitais_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [[ $final_table_count =~ ^[0-9]+$ ]]; then
    log "SUCCESS" "Total de tabelas no banco: $final_table_count"
    
    if [ "$final_table_count" -ge 17 ]; then
        log "SUCCESS" "✅ Setup completo! Todas as tabelas criadas."
    elif [ "$final_table_count" -ge 12 ]; then
        log "SUCCESS" "✅ Setup básico OK! Tabelas do sistema original criadas."
    else
        log "WARNING" "⚠️  Setup incompleto. Verifique os logs."
    fi
fi

# 10. Informações de conexão
echo ""
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}🎉 SETUP CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""
echo -e "${YELLOW}📊 Informações de Conexão:${NC}"
echo -e "   Host: localhost"
echo -e "   Porta: 5432"
echo -e "   Banco: mermas_digitais_db"
echo -e "   Usuário: postgres"
echo -e "   Senha: mermas123"
echo ""
echo -e "${YELLOW}🔗 URL de Conexão:${NC}"
echo -e "   postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db"
echo ""
echo -e "${YELLOW}🔧 Comandos Úteis:${NC}"
echo -e "   Conectar: docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db"
echo -e "   Parar: docker-compose down"
echo -e "   Logs: docker-compose logs postgres"
echo ""
echo -e "${YELLOW}📚 Documentação: database/postgresql/README-COMPLETO.md${NC}"
echo ""
echo -e "${GREEN}🚀 O banco está pronto para uso!${NC}"
