# Script para Adicionar Tabelas de Eventos no Supabase

## 📋 Resumo

Este documento contém os scripts SQL necessários para adicionar as tabelas de eventos no Supabase, que existem no banco local mas não no Supabase.

## 🎯 Problema Identificado

O banco local tem **5 tabelas adicionais** para o sistema de eventos que não existem no Supabase:

1. `eventos`
2. `orientadores`
3. `modalidades`
4. `inscricoes_eventos`
5. `participantes_eventos`

## 📁 Scripts Disponíveis

### 1. Script Completo (Recomendado)

**Arquivo:** `scripts/add-eventos-to-supabase.sql`

- ✅ Cria todas as 5 tabelas de eventos
- ✅ Adiciona índices otimizados
- ✅ Configura triggers para `updated_at`
- ✅ Inclui funções para gerenciar vagas
- ✅ Verificação automática de criação
- ✅ Comentários detalhados

### 2. Script Simples

**Arquivo:** `scripts/supabase-eventos-simples.sql`

- ✅ Cria todas as 5 tabelas de eventos
- ✅ Índices básicos
- ✅ Triggers para `updated_at`
- ✅ Verificação final simples
- ⚡ Mais rápido de executar

## 🚀 Como Executar

### Opção 1: Via Interface do Supabase

1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Cole o conteúdo do script escolhido
4. Execute o script

### Opção 2: Via psql (linha de comando)

```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f scripts/supabase-eventos-simples.sql
```

## 📊 Estrutura das Tabelas

### 1. `eventos`

```sql
- id (UUID, PK)
- nome (VARCHAR)
- descricao (TEXT)
- data_inicio (TIMESTAMP)
- data_fim (TIMESTAMP)
- ativo (BOOLEAN)
- created_at, updated_at
```

### 2. `orientadores`

```sql
- id (UUID, PK)
- nome (VARCHAR)
- cpf (VARCHAR, UNIQUE)
- telefone (VARCHAR)
- email (VARCHAR, UNIQUE)
- escola (VARCHAR)
- genero (VARCHAR, CHECK)
- ativo (BOOLEAN)
- created_at, updated_at
```

### 3. `modalidades`

```sql
- id (UUID, PK)
- evento_id (UUID, FK → eventos)
- nome (VARCHAR)
- descricao (TEXT)
- limite_vagas (INTEGER)
- vagas_ocupadas (INTEGER)
- ativo (BOOLEAN)
- created_at, updated_at
```

### 4. `inscricoes_eventos`

```sql
- id (UUID, PK)
- evento_id (UUID, FK → eventos)
- orientador_id (UUID, FK → orientadores)
- modalidade_id (UUID, FK → modalidades)
- status (VARCHAR, CHECK)
- observacoes (TEXT)
- created_at, updated_at
```

### 5. `participantes_eventos`

```sql
- id (UUID, PK)
- inscricao_id (UUID, FK → inscricoes_eventos)
- nome (VARCHAR)
- cpf (VARCHAR)
- data_nascimento (DATE)
- email (VARCHAR)
- genero (VARCHAR, CHECK)
- created_at, updated_at
```

## 🔧 Funcionalidades Incluídas

### Triggers Automáticos

- **updated_at**: Atualiza automaticamente o campo `updated_at` em todas as tabelas

### Funções (Script Completo)

- **update_vagas_ocupadas_modalidade()**: Gerencia vagas ocupadas automaticamente
- **verificar_vagas_disponiveis()**: Verifica se há vagas disponíveis

### Índices Otimizados

- Índices em campos de busca frequente
- Índices em chaves estrangeiras
- Índices em campos únicos

## ✅ Verificação Pós-Execução

Após executar o script, você pode verificar se tudo foi criado corretamente:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('eventos', 'orientadores', 'modalidades', 'inscricoes_eventos', 'participantes_eventos')
ORDER BY table_name;
```

## 🔄 Sincronização

Após executar o script no Supabase:

1. **Status atual**: As tabelas de eventos aparecerão como `local_only`
2. **Após execução**: As tabelas aparecerão como `synced` (0 registros em ambos)
3. **Sincronização**: O sistema de sincronização funcionará normalmente

## 📈 Próximos Passos

1. ✅ Execute o script no Supabase
2. ✅ Verifique se as tabelas foram criadas
3. ✅ Teste a sincronização: `npm run sync:status`
4. ✅ Configure dados iniciais se necessário
5. ✅ Teste o sistema de eventos

## ⚠️ Observações Importantes

- **Backup**: Sempre faça backup antes de executar scripts em produção
- **Permissões**: Certifique-se de ter permissões de DDL no Supabase
- **Extensões**: O script habilita automaticamente a extensão `uuid-ossp`
- **Conflitos**: Use `IF NOT EXISTS` para evitar erros se as tabelas já existirem

## 🎉 Resultado Esperado

Após a execução bem-sucedida:

```
✅ eventos: CRIADA
✅ orientadores: CRIADA
✅ modalidades: CRIADA
✅ inscricoes_eventos: CRIADA
✅ participantes_eventos: CRIADA
🎉 TODAS AS TABELAS DE EVENTOS FORAM CRIADAS COM SUCESSO!
```

---

**Script recomendado:** `scripts/supabase-eventos-simples.sql` para execução rápida e confiável.
