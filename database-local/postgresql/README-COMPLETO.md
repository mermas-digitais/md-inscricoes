# 🐳 Setup Completo - Banco PostgreSQL Mermãs Digitais

## 📋 Visão Geral

Este setup cria um banco PostgreSQL local que é um **espelho exato** do Supabase, incluindo:

- ✅ **12 tabelas** do sistema original (com todos os dados migrados)
- ✅ **5 tabelas** para a nova funcionalidade de eventos
- ✅ **413 registros** migrados do Supabase
- ✅ **Schema idêntico** com constraints, índices e triggers
- ✅ **Pronto para produção** com Docker

## 🚀 Fluxo Completo de Setup

### 1. Pré-requisitos

```bash
# Instalar dependências Python
pip install psycopg2-binary python-dotenv supabase

# Verificar se Docker está rodando
docker --version
docker-compose --version
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# Supabase (para migração)
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# PostgreSQL Local (opcional - já configurado no docker-compose)
POSTGRES_DB=mermas_digitais_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mermas123
```

### 3. Subir o Banco de Dados

```bash
# Subir o container PostgreSQL
docker-compose up -d

# Aguardar inicialização (30-60 segundos)
# Verificar logs se necessário
docker-compose logs postgres
```

### 4. Migrar Dados do Supabase

```bash
# Executar migração adaptativa
python database/postgresql/setup/migrate_data_adaptive.py
```

**Resultado esperado:**

```
✅ Tabelas migradas com sucesso: 10/10
📝 Total de registros migrados: 413
🎉 Todas as tabelas foram migradas com sucesso!
```

### 5. Verificar Setup Completo

```bash
# Conectar ao banco
docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db

# Verificar todas as tabelas (deve mostrar 17 tabelas)
\dt

# Verificar dados migrados
SELECT 'inscricoes' as tabela, COUNT(*) as registros FROM inscricoes
UNION ALL SELECT 'monitores', COUNT(*) FROM monitores
UNION ALL SELECT 'escolas', COUNT(*) FROM escolas
UNION ALL SELECT 'verification_codes', COUNT(*) FROM verification_codes;
```

## 📊 Estrutura Final do Banco

### Sistema Original (12 tabelas)

| Tabela               | Registros | Descrição                        |
| -------------------- | --------- | -------------------------------- |
| `inscricoes`         | 127       | Inscrições das Mermãs Digitais   |
| `monitores`          | 7         | Monitores e administradores      |
| `escolas`            | 175       | Escolas de Imperatriz-MA         |
| `verification_codes` | 74        | Códigos de verificação por email |
| `cursos`             | 2         | Cursos oferecidos                |
| `turmas`             | 2         | Turmas dos cursos                |
| `turmas_monitores`   | 6         | Relacionamento turmas-monitores  |
| `turmas_alunas`      | 13        | Relacionamento turmas-alunas     |
| `aulas`              | 6         | Aulas ministradas                |
| `frequencia`         | 1         | Controle de frequência           |
| `modulos`            | 0         | Módulos dos cursos               |
| `materiais_aula`     | 0         | Materiais das aulas              |

### Sistema de Eventos (5 tabelas)

| Tabela                  | Descrição                                   |
| ----------------------- | ------------------------------------------- |
| `eventos`               | Eventos das Mermãs Digitais                 |
| `orientadores`          | Orientadores que fazem inscrições em grupo  |
| `modalidades`           | Modalidades de cada evento                  |
| `inscricoes_eventos`    | Inscrições em grupo por orientadores        |
| `participantes_eventos` | Participantes individuais de cada inscrição |

## 🔧 Informações de Conexão

| **Parâmetro** | **Valor**                                                         |
| ------------- | ----------------------------------------------------------------- |
| **Host**      | localhost                                                         |
| **Porta**     | 5432                                                              |
| **Banco**     | mermas_digitais_db                                                |
| **Usuário**   | postgres                                                          |
| **Senha**     | mermas123                                                         |
| **URL**       | postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db |

## 📁 Estrutura de Arquivos

```
database/postgresql/
├── setup/
│   ├── 00-init-database.sql           # Inicialização e extensões
│   ├── 02-supabase-structure.sql      # Schema completo (17 tabelas)
│   ├── 99-verify-setup.sql           # Verificação final
│   ├── migrate_data_adaptive.py      # Script de migração (RECOMENDADO)
│   ├── setup-completo.ps1            # Script automatizado Windows
│   ├── setup-completo.sh             # Script automatizado Linux/Mac
│   └── verificar-setup.sql           # Script de verificação completa
├── README.md                         # Documentação principal
└── README-COMPLETO.md                # Este arquivo
```

## 🎯 Scripts Executados Automaticamente

O Docker executa automaticamente na ordem:

1. **00-init-database.sql** - Extensões e configurações iniciais
2. **02-supabase-structure.sql** - Schema completo (17 tabelas)
3. **99-verify-setup.sql** - Verificação final

## 🔄 Comandos de Gerenciamento

### Gerenciar Container

```bash
# Parar o container
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker-compose down -v

# Reiniciar
docker-compose restart

# Ver logs
docker-compose logs postgres
```

### Backup e Restore

```bash
# Backup completo
docker exec mermas_digitais_db pg_dump -U postgres mermas_digitais_db > backup.sql

# Restore
docker exec -i mermas_digitais_db psql -U postgres mermas_digitais_db < backup.sql
```

### Conectar ao Banco

```bash
# Via Docker (recomendado)
docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db

# Via psql local (se instalado)
psql -h localhost -p 5432 -U postgres -d mermas_digitais_db
```

## 🚨 Solução de Problemas

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs postgres

# Verificar se a porta 5432 está livre
netstat -an | findstr 5432

# Limpar e recriar
docker-compose down -v
docker-compose up -d
```

### Erro na migração

```bash
# Verificar conexão com Supabase
python -c "from supabase import create_client; print('Supabase OK')"

# Verificar se o banco está rodando
docker exec mermas_digitais_db pg_isready -U postgres

# Re-executar migração
python database/postgresql/setup/migrate_data_adaptive.py
```

### Schema não aplicado

```bash
# Verificar se as tabelas foram criadas
docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db -c "\dt"

# Se necessário, aplicar schema manualmente
Get-Content database/postgresql/setup/02-supabase-structure.sql | docker exec -i mermas_digitais_db psql -U postgres -d mermas_digitais_db
```

## 🔐 Configuração para Produção

Para usar em produção, altere no `docker-compose.yml`:

```yaml
environment:
  POSTGRES_DB: seu_banco_producao
  POSTGRES_USER: seu_usuario_seguro
  POSTGRES_PASSWORD: sua_senha_muito_forte
```

## ✅ Checklist de Verificação

Após o setup completo, verifique:

- [ ] Container PostgreSQL rodando (`docker-compose ps`)
- [ ] 17 tabelas criadas (`\dt` no psql)
- [ ] 413 registros migrados
- [ ] Conexão funcionando no DBeaver
- [ ] APIs do sistema funcionando
- [ ] Sistema de eventos pronto para desenvolvimento

## 🎉 Pronto!

Após seguir este fluxo, você terá:

- ✅ **Banco PostgreSQL** rodando em `localhost:5432`
- ✅ **Schema idêntico** ao Supabase
- ✅ **Todos os dados** migrados (413 registros)
- ✅ **Sistema original** funcionando
- ✅ **Sistema de eventos** pronto para desenvolvimento
- ✅ **Documentação completa** para replicação

**O banco está 100% funcional e pronto para uso!** 🚀

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs postgres`
2. Consulte a seção "Solução de Problemas"
3. Verifique se todas as dependências estão instaladas
4. Confirme se as variáveis de ambiente estão corretas

**Última atualização:** 25/09/2025
**Versão:** 1.0 - Setup Completo Funcional
