# Sistema de Sincronização de Bancos de Dados

Este documento descreve o sistema completo de sincronização bidirecional entre o banco PostgreSQL local e o Supabase.

## Visão Geral

O sistema permite sincronizar dados entre:

- **Banco Local**: PostgreSQL rodando via Docker
- **Supabase**: Banco PostgreSQL na nuvem

### Funcionalidades

- ✅ Sincronização unidirecional (Local → Supabase ou Supabase → Local)
- ✅ Sincronização bidirecional inteligente
- ✅ Interface web para gerenciamento
- ✅ Sincronização automática via cron job
- ✅ Scripts de linha de comando
- ✅ Monitoramento de status em tempo real

## APIs Disponíveis

### 1. Status de Sincronização

```http
GET /api/sync/status
```

Retorna o status atual de sincronização de todas as tabelas.

### 2. Sincronização Unidirecional

```http
POST /api/sync/to-supabase
POST /api/sync/from-supabase
```

### 3. Sincronização Bidirecional

```http
POST /api/sync/bidirectional
```

### 4. Sincronização Completa

```http
POST /api/sync/full-database
Content-Type: application/json

{
  "direction": "to-supabase" | "from-supabase"
}
```

### 5. Cron Job Diário

```http
GET /api/cron/sync-daily
```

Executado automaticamente às 2h da manhã via Vercel Cron.

## Interface Web

Acesse `/admin/sync` para gerenciar a sincronização através de uma interface visual.

### Funcionalidades da Interface:

- 📊 Status geral dos bancos
- 📋 Status detalhado por tabela
- 🔄 Botões para sincronização manual
- 📈 Histórico de sincronizações
- 💡 Recomendações automáticas

## Scripts de Linha de Comando

### Verificar Status

```bash
npm run sync:status
```

### Sincronização Unidirecional

```bash
npm run sync:to-supabase      # Local → Supabase
npm run sync:from-supabase    # Supabase → Local
```

### Sincronização Bidirecional

```bash
npm run sync:bidirectional
npm run sync:full
```

### Script Direto

```bash
node scripts/sync-databases.js bidirectional
node scripts/sync-databases.js to-supabase
node scripts/sync-databases.js from-supabase
```

## Tabelas Sincronizadas

O sistema sincroniza todas as tabelas do banco:

1. `escolas`
2. `inscricoes`
3. `verification_codes`
4. `monitores`
5. `turmas`
6. `frequencia`
7. `turmas_alunas`
8. `cursos`
9. `aulas`
10. `materiais_aula`
11. `modulos`
12. `eventos`
13. `modalidades`
14. `orientadores`
15. `inscricoes_eventos`

## Configuração

### Variáveis de Ambiente Necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Banco Local (Prisma)
DATABASE_URL=postgresql://postgres:mermas123@localhost:5432/md_inscricoes

# Cron Job (Vercel)
CRON_SECRET=your_secret_key
```

### Configuração do Vercel Cron

O arquivo `vercel.json` configura a execução automática:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-daily",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Algoritmo de Sincronização Bidirecional

### 1. Análise de Dados

- Busca dados de ambos os bancos
- Cria mapas para comparação rápida por ID

### 2. Sincronização Supabase → Local

- Para cada registro no Supabase:
  - Se não existe no local: **inserir**
  - Se existe mas é diferente: **atualizar**
  - Se é igual: **ignorar**

### 3. Sincronização Local → Supabase

- Para cada registro no local:
  - Se não existe no Supabase: **inserir**
  - Se existe mas é diferente: **atualizar**
  - Se é igual: **ignorar**

### 4. Detecção de Mudanças

Ignora campos automáticos:

- `created_at`
- `updated_at`
- `id`

## Status de Sincronização

### Estados Possíveis:

- 🟢 **synced**: Tabelas idênticas
- 🔵 **local_ahead**: Mais registros no banco local
- 🟠 **supabase_ahead**: Mais registros no Supabase
- 🔴 **error**: Erro na verificação

### Recomendações Automáticas:

- Se `local_ahead`: Sugere sincronizar para Supabase
- Se `supabase_ahead`: Sugere sincronizar para Local
- Se `error`: Sugere corrigir problemas primeiro

## Monitoramento e Logs

### Logs Automáticos

- Console logs detalhados
- Logs salvos no Supabase (tabela `sync_logs`)
- Timestamps de todas as operações

### Métricas Disponíveis:

- Total de registros sincronizados
- Número de erros
- Tabelas processadas com sucesso
- Tempo de execução

## Tratamento de Erros

### Tipos de Erro:

1. **Erro de Conexão**: Banco indisponível
2. **Erro de Schema**: Diferenças na estrutura
3. **Erro de Dados**: Dados inválidos
4. **Erro de Permissão**: Acesso negado

### Estratégias:

- Continua processamento mesmo com erros
- Log detalhado de cada erro
- Retry automático para erros temporários
- Rollback em caso de falha crítica

## Segurança

### Autenticação do Cron Job:

```typescript
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Validação de Dados:

- Sanitização de inputs
- Validação de tipos
- Verificação de integridade

## Performance

### Otimizações:

- Comparação por ID (O(1))
- Processamento em lotes
- Índices otimizados
- Conexões reutilizadas

### Limites:

- Timeout de 30 segundos por tabela
- Máximo 1000 registros por lote
- Rate limiting automático

## Troubleshooting

### Problemas Comuns:

#### 1. Erro de Conexão

```bash
# Verificar se o banco local está rodando
docker ps
docker logs md-inscricoes-postgres-1
```

#### 2. Erro de Schema

```bash
# Verificar diferenças no schema
npm run db:status
```

#### 3. Erro de Permissão

```bash
# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_SUPABASE_URL
echo $CRON_SECRET
```

### Comandos de Diagnóstico:

```bash
# Status geral
npm run sync:status

# Testar conexão
npm run db:test

# Ver logs
docker logs md-inscricoes-postgres-1 -f
```

## Manutenção

### Backup Antes da Sincronização:

```bash
npm run db:backup
```

### Limpeza de Logs:

```sql
DELETE FROM sync_logs WHERE timestamp < NOW() - INTERVAL '30 days';
```

### Monitoramento Contínuo:

- Verificar logs diariamente
- Monitorar métricas de performance
- Acompanhar status de sincronização

## Exemplos de Uso

### Sincronização Manual Completa:

```bash
# 1. Verificar status
npm run sync:status

# 2. Fazer backup
npm run db:backup

# 3. Sincronizar bidirecionalmente
npm run sync:bidirectional

# 4. Verificar resultado
npm run sync:status
```

### Sincronização via API:

```javascript
// Verificar status
const status = await fetch("/api/sync/status").then((r) => r.json());

// Sincronizar bidirecionalmente
const result = await fetch("/api/sync/bidirectional", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}).then((r) => r.json());
```

### Sincronização Programática:

```javascript
const { PrismaClient } = require("./lib/generated/prisma");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();
const supabase = createClient(url, key);

// Sua lógica de sincronização personalizada
```

## Roadmap

### Próximas Funcionalidades:

- [ ] Sincronização seletiva por tabela
- [ ] Interface de agendamento personalizado
- [ ] Notificações por email/Slack
- [ ] Dashboard de métricas avançadas
- [ ] Sincronização em tempo real
- [ ] Backup automático antes da sincronização
- [ ] Rollback de sincronizações
- [ ] Sincronização por filtros/condições

### Melhorias de Performance:

- [ ] Sincronização paralela por tabela
- [ ] Compressão de dados
- [ ] Cache inteligente
- [ ] Otimização de queries

---

**Nota**: Este sistema foi projetado para ser robusto e confiável, mas sempre faça backup antes de operações críticas de sincronização.
