# 🐳 Scraping de Escolas em Container Docker

Este diretório contém uma solução completa para scraping de escolas do Maranhão usando containers Docker.

## 📁 Estrutura dos Arquivos

```
scraping/
├── scrape-dual-database.py    # Script principal de scraping
├── Dockerfile                 # Imagem Docker para o scraper
├── docker-compose.yml         # Orquestração dos containers
├── init-db.sql               # Inicialização do banco local
├── requirements.txt          # Dependências Python
├── run-scraping-container.ps1 # Script PowerShell para Windows
├── run-scraping-container.sh  # Script Bash para Linux/Mac
└── README-CONTAINER.md       # Esta documentação
```

## 🚀 Como Executar

### Windows (PowerShell)

```powershell
.\run-scraping-container.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x run-scraping-container.sh
./run-scraping-container.sh
```

### Manual

```bash
# Construir e iniciar containers
docker-compose up --build -d

# Acompanhar logs
docker-compose logs -f scraper

# Parar containers
docker-compose down
```

## 🎯 O que o Sistema Faz

1. **Scraping Completo**: Coleta dados de todos os tipos de escolas:

   - 🏫 Particulares
   - 🏛️ Municipais
   - 🏢 Estaduais
   - 🎓 Federais

2. **Salvamento Duplo**: Dados são salvos em:

   - ☁️ **Supabase** (produção)
   - 💾 **PostgreSQL Local** (desenvolvimento)

3. **Containerização**: Roda em ambiente isolado e controlado

## 📊 Estrutura do Banco

### Tabela `escolas`

```sql
CREATE TABLE escolas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    rede TEXT NOT NULL CHECK (rede IN ('municipal', 'estadual', 'federal', 'particular')),
    publica BOOLEAN NOT NULL,
    uf TEXT NOT NULL,
    municipio TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT unique_escola_nome_municipio_uf UNIQUE (nome, municipio, uf)
);
```

## 🔧 Configuração

### Variáveis de Ambiente

- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_KEY`: Chave anônima do Supabase
- `LOCAL_DB_*`: Configurações do PostgreSQL local

### Portas

- **PostgreSQL Local**: `5433` (para evitar conflito com o banco principal)
- **Supabase**: Via HTTPS

## 📈 Monitoramento

### Logs em Tempo Real

```bash
docker-compose logs -f scraper
```

### Status dos Containers

```bash
docker-compose ps
```

### Acessar Banco Local

```bash
# Conectar ao PostgreSQL local
docker exec -it escolas-postgres-local psql -U postgres -d mermas_digitais_db
```

## 🛠️ Manutenção

### Parar o Sistema

```bash
docker-compose down
```

### Limpar Volumes (⚠️ Remove dados)

```bash
docker-compose down -v
```

### Reconstruir Imagem

```bash
docker-compose build --no-cache
```

## 📋 Resolução de Problemas

### Constraint de Unicidade

Se houver erro de constraint, execute no Supabase:

```sql
-- Remover constraint antiga
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS escolas_nome_key;

-- Adicionar nova constraint composta
ALTER TABLE escolas ADD CONSTRAINT unique_escola_nome_municipio_uf
    UNIQUE (nome, municipio, uf);
```

### Container não Inicia

```bash
# Verificar logs
docker-compose logs scraper

# Verificar se PostgreSQL está rodando
docker-compose ps
```

### Problemas de Rede

```bash
# Recriar rede
docker-compose down
docker network prune
docker-compose up -d
```

## 🎉 Resultado Esperado

Após a execução completa, você terá:

- ✅ **~2000+ escolas** no Supabase (produção)
- ✅ **~2000+ escolas** no PostgreSQL local (desenvolvimento)
- ✅ **Backups JSON** de cada tipo de escola
- ✅ **Logs detalhados** do processo

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `docker-compose logs -f scraper`
2. Confirme a conectividade com Supabase
3. Verifique se o PostgreSQL local está acessível
4. Execute o script SQL de correção de constraint se necessário
