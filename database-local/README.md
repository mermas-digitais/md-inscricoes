# 🐳 Banco de Dados Local (PostgreSQL)

Este diretório contém toda a configuração para o banco de dados PostgreSQL local usando Docker.

## 📁 Estrutura

```
database-local/
├── docker-compose.yml          # Configuração do container PostgreSQL
└── postgresql/
    ├── setup/                  # Scripts de inicialização
    │   ├── 00-init-database.sql    # Extensões e configurações
    │   ├── 02-supabase-structure.sql # Estrutura completa do banco
    │   ├── 99-verify-setup.sql     # Verificação do setup
    │   ├── migrate_data_adaptive.py # Migração de dados do Supabase
    │   ├── setup-completo.ps1      # Setup automático (Windows)
    │   ├── setup-completo.sh       # Setup automático (Linux/Mac)
    │   └── verificar-setup.sql     # Script de verificação
    ├── scripts/                # Scripts utilitários
    └── README-COMPLETO.md      # Documentação detalhada
```

## 🚀 Setup Rápido

### Windows

```powershell
cd database-local
.\postgresql\setup\setup-completo.ps1
```

### Linux/Mac

```bash
cd database-local
chmod +x postgresql/setup/setup-completo.sh
./postgresql/setup/setup-completo.sh
```

### Manual

```bash
cd database-local
docker-compose up -d
```

## 🏫 Estrutura de Escolas

A tabela `escolas` usa a nova estrutura:

```sql
CREATE TABLE escolas (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  rede TEXT NOT NULL,           -- 'municipal', 'estadual', 'federal', 'particular'
  publica BOOLEAN NOT NULL,     -- true para públicas, false para particulares
  uf TEXT NOT NULL,             -- 'MA', 'SP', etc.
  municipio TEXT NOT NULL,      -- Nome do município
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
POSTGRES_DB=mermas_digitais_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Conexão

- **Host**: localhost
- **Porta**: 5432
- **Database**: mermas_digitais_db
- **Usuário**: postgres
- **Senha**: postgres

## 📊 Tabelas Incluídas

1. **inscricoes** - Inscrições originais
2. **escolas** - Escolas com nova estrutura
3. **verification_codes** - Códigos de verificação
4. **cursos** - Cursos disponíveis
5. **turmas** - Turmas dos cursos
6. **matriculas** - Matrículas dos alunos
7. **frequencia** - Controle de frequência
8. **aulas** - Aulas das turmas
9. **modulos** - Módulos de ensino
10. **materiais_aula** - Materiais das aulas
11. **eventos** - Eventos MDX25
12. **modalidades** - Modalidades dos eventos
13. **orientadores** - Orientadores dos eventos
14. **inscricoes_eventos** - Inscrições nos eventos
15. **participantes_eventos** - Participantes dos eventos

## 🔄 Migração de Dados

Para migrar dados do Supabase:

```bash
cd postgresql/setup
python migrate_data_adaptive.py
```

## 🧪 Verificação

### Teste de Conexão

```bash
# Windows
.\test-connection.ps1

# Linux/Mac
chmod +x test-connection.sh
./test-connection.sh
```

### Verificação Completa

```bash
cd postgresql/setup
psql -h localhost -U postgres -d mermas_digitais_db -f verificar-setup.sql
```

## 📚 Documentação Completa

Consulte `postgresql/README-COMPLETO.md` para documentação detalhada.
