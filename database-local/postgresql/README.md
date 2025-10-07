# 🗄️ Banco de Dados PostgreSQL - Mermãs Digitais

## 📋 Visão Geral

Este diretório contém todo o setup e configuração do banco PostgreSQL local que espelha o Supabase, incluindo:

- ✅ **Schema completo** (17 tabelas)
- ✅ **Migração automática** de dados do Supabase
- ✅ **Setup Docker** automatizado
- ✅ **Scripts de automação** para Windows e Linux/Mac
- ✅ **Documentação completa** para replicação

## 🚀 Início Rápido

### Opção 1: Setup Automatizado (Recomendado)

**Windows (PowerShell):**

```powershell
.\database\postgresql\setup\setup-completo.ps1
```

**Linux/Mac (Bash):**

```bash
./database/postgresql/setup/setup-completo.sh
```

### Opção 2: Setup Manual

1. **Subir o banco:**

   ```bash
   docker-compose up -d
   ```

2. **Migrar dados:**

   ```bash
   python database/postgresql/setup/migrate_data_adaptive.py
   ```

3. **Verificar:**
   ```bash
   docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db -c "\dt"
   ```

## 📊 Resultado Final

Após o setup completo, você terá:

| **Componente**           | **Status**                      |
| ------------------------ | ------------------------------- |
| **Container PostgreSQL** | ✅ Rodando em `localhost:5432`  |
| **Banco de Dados**       | ✅ `mermas_digitais_db`         |
| **Tabelas do Sistema**   | ✅ 12 tabelas (413 registros)   |
| **Tabelas de Eventos**   | ✅ 5 tabelas (prontas para uso) |
| **Schema Completo**      | ✅ Idêntico ao Supabase         |
| **Índices e Triggers**   | ✅ Todos configurados           |

## 📁 Estrutura de Arquivos

```
database/postgresql/
├── setup/
│   ├── 00-init-database.sql           # Inicialização
│   ├── 02-supabase-structure.sql      # Schema completo (17 tabelas)
│   ├── 99-verify-setup.sql           # Verificação final
│   ├── migrate_data_adaptive.py      # Migração de dados (RECOMENDADO)
│   ├── setup-completo.ps1            # Script automatizado Windows
│   ├── setup-completo.sh             # Script automatizado Linux/Mac
│   └── verificar-setup.sql           # Script de verificação completa
├── README.md                         # Este arquivo
└── README-COMPLETO.md                # Documentação detalhada
```

## 🔧 Informações de Conexão

| **Parâmetro** | **Valor**          |
| ------------- | ------------------ |
| **Host**      | localhost          |
| **Porta**     | 5432               |
| **Banco**     | mermas_digitais_db |
| **Usuário**   | postgres           |
| **Senha**     | mermas123          |

**URL de Conexão:**

```
postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db
```

## 📚 Documentação

- **[README-COMPLETO.md](README-COMPLETO.md)** - Documentação detalhada com fluxo completo
- **[setup-completo.ps1](setup/setup-completo.ps1)** - Script automatizado Windows
- **[setup-completo.sh](setup/setup-completo.sh)** - Script automatizado Linux/Mac
- **[verificar-setup.sql](setup/verificar-setup.sql)** - Script de verificação completa

## 🚨 Solução de Problemas

### Container não inicia

```bash
docker-compose logs postgres
docker-compose down -v && docker-compose up -d
```

### Erro na migração

```bash
# Verificar variáveis do Supabase no .env
python database/postgresql/setup/migrate_data_adaptive.py
```

### Schema não aplicado

```bash
# Verificar tabelas
docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db -c "\dt"
```

## 🎯 Próximos Passos

Após o setup completo:

1. **Conectar com DBeaver** usando as credenciais acima
2. **Desenvolver APIs** para gerenciar eventos
3. **Criar interface frontend** para inscrições em eventos
4. **Testar funcionalidade** completa

## 📞 Suporte

Para problemas ou dúvidas:

1. Consulte a **[documentação completa](README-COMPLETO.md)**
2. Verifique os logs: `docker-compose logs postgres`
3. Execute o script de setup automatizado
4. Confirme se todas as dependências estão instaladas

---

**Última atualização:** 25/09/2025  
**Versão:** 1.0 - Setup Completo Funcional  
**Status:** ✅ Testado e Funcionando
