# Testes da API do Módulo de Ensino

Este arquivo contém exemplos de requisições para testar a API do Módulo de Ensino.

## Configuração

Configure a tabela de monitores no Supabase:

```sql
-- Adicionar role à tabela monitores (se ainda não existe)
ALTER TABLE monitores
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'MONITOR'
CHECK (role IN ('MONITOR', 'ADM'));

-- Criar pelo menos um administrador
INSERT INTO monitores (nome, email, curso_responsavel, role) VALUES
('Admin Principal', 'admin@mermasdigitais.com', 'Administração', 'ADM')
ON CONFLICT (email) DO UPDATE SET role = 'ADM';
```

**Autenticação:**

- Use o email do monitor como Bearer token
- O sistema busca automaticamente as permissões no banco de dados
- Exemplo: `Authorization: Bearer admin@mermasdigitais.com`

**Variáveis de ambiente necessárias:**

- `NEXT_PUBLIC_SUPABASE_URL`: URL do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

## Endpoints Base

- Desenvolvimento: `http://localhost:3000`
- Produção: `https://seu-dominio.com`

## 1. Gerenciamento de Cursos

### Criar Curso

```bash
curl -X POST http://localhost:3000/api/cursos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ADMIN_TOKEN" \
  -d '{
    "nome_curso": "Desenvolvimento Web Full Stack",
    "descricao": "Curso completo de desenvolvimento web com React e Node.js",
    "carga_horaria": 120,
    "status": "ativo"
  }'
```

### Listar Cursos

```bash
curl -X GET "http://localhost:3000/api/cursos/listar?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Buscar Curso por ID

```bash
curl -X GET http://localhost:3000/api/cursos/SEU_CURSO_ID \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 2. Gerenciamento de Turmas

### Criar Turma

```bash
curl -X POST http://localhost:3000/api/turmas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "curso_id": "SEU_CURSO_ID",
    "nome_turma": "Turma A - 2024.1",
    "data_inicio": "2024-03-01",
    "data_fim": "2024-06-30",
    "horario": "19:00 às 22:00",
    "local": "Laboratório 1",
    "status": "ativa"
  }'
```

### Vincular Alunas à Turma

```bash
curl -X POST http://localhost:3000/api/turmas/alunas/vincular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "turma_id": "SEU_TURMA_ID",
    "aluna_ids": ["ALUNA_ID_1", "ALUNA_ID_2", "ALUNA_ID_3"]
  }'
```

## 3. Gerenciamento de Aulas

### Criar Aula (com Frequência Automática)

```bash
curl -X POST http://localhost:3000/api/aulas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "turma_id": "SEU_TURMA_ID",
    "data_aula": "2024-03-01",
    "conteudo_ministrado": "Introdução ao HTML e CSS básico"
  }'
```

### Listar Aulas por Turma

```bash
curl -X GET "http://localhost:3000/api/aulas/listar?turma_id=SEU_TURMA_ID&page=1" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 4. Gerenciamento de Frequência

### Atualizar Frequência em Lote

```bash
curl -X PUT http://localhost:3000/api/frequencia/atualizar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "atualizacoes": [
      {
        "frequencia_id": "FREQUENCIA_ID_1",
        "presente": true,
        "observacoes": "Participou ativamente da aula"
      },
      {
        "frequencia_id": "FREQUENCIA_ID_2",
        "presente": false,
        "observacoes": "Faltou por motivo justificado"
      },
      {
        "frequencia_id": "FREQUENCIA_ID_3",
        "presente": true,
        "observacoes": null
      }
    ]
  }'
```

### Gerar Relatório de Frequência

```bash
curl -X GET "http://localhost:3000/api/frequencia/relatorio?turma_id=SEU_TURMA_ID&data_inicio=2024-03-01&data_fim=2024-06-30" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 5. Fluxo Completo de Teste

### Script de Teste Básico (bash)

```bash
#!/bin/bash

# Configurações
BASE_URL="http://localhost:3000"
ADMIN_TOKEN="SEU_ADMIN_TOKEN"
MONITOR_TOKEN="SEU_MONITOR_TOKEN"

echo "=== Teste da API do Módulo de Ensino ==="

# 1. Criar Curso
echo "1. Criando curso..."
CURSO_RESPONSE=$(curl -s -X POST $BASE_URL/api/cursos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "nome_curso": "Teste API - Desenvolvimento Web",
    "descricao": "Curso de teste para validação da API",
    "carga_horaria": 80,
    "status": "ativo"
  }')

CURSO_ID=$(echo $CURSO_RESPONSE | jq -r '.data.id')
echo "Curso criado: $CURSO_ID"

# 2. Criar Turma
echo "2. Criando turma..."
TURMA_RESPONSE=$(curl -s -X POST $BASE_URL/api/turmas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"curso_id\": \"$CURSO_ID\",
    \"nome_turma\": \"Turma Teste - 2024.1\",
    \"data_inicio\": \"$(date +%Y-%m-%d)\",
    \"horario\": \"19:00 às 22:00\",
    \"status\": \"ativa\"
  }")

TURMA_ID=$(echo $TURMA_RESPONSE | jq -r '.data.id')
echo "Turma criada: $TURMA_ID"

# 3. Criar Aula
echo "3. Criando aula..."
AULA_RESPONSE=$(curl -s -X POST $BASE_URL/api/aulas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MONITOR_TOKEN" \
  -d "{
    \"turma_id\": \"$TURMA_ID\",
    \"data_aula\": \"$(date +%Y-%m-%d)\",
    \"conteudo_ministrado\": \"Aula de teste da API\"
  }")

AULA_ID=$(echo $AULA_RESPONSE | jq -r '.data.id')
echo "Aula criada: $AULA_ID"

# 4. Listar Cursos
echo "4. Listando cursos..."
curl -s -X GET "$BASE_URL/api/cursos/listar?page=1&limit=5" \
  -H "Authorization: Bearer $MONITOR_TOKEN" | jq '.data[0].nome_curso'

# 5. Gerar Relatório (mesmo que vazio)
echo "5. Gerando relatório de frequência..."
curl -s -X GET "$BASE_URL/api/frequencia/relatorio?turma_id=$TURMA_ID" \
  -H "Authorization: Bearer $MONITOR_TOKEN" | jq '.data.resumo'

echo "=== Teste concluído ==="
```

## 6. Códigos de Erro Comuns

### 400 - Bad Request

```json
{
  "error": "Nome do curso é obrigatório"
}
```

### 401 - Unauthorized

```json
{
  "error": "Token de autorização não fornecido"
}
```

### 403 - Forbidden

```json
{
  "error": "Acesso negado. Apenas administradores podem excluir cursos."
}
```

### 404 - Not Found

```json
{
  "error": "Curso não encontrado"
}
```

### 409 - Conflict

```json
{
  "error": "Já existe uma aula registrada nesta data para esta turma"
}
```

## 7. Validações Importantes

1. **UUIDs**: Sempre validar formato UUID v4
2. **Datas**: Formato YYYY-MM-DD obrigatório
3. **Tokens**: Verificar tipo de acesso (ADM vs MONITOR)
4. **Relações**: Verificar existência de registros relacionados
5. **Duplicatas**: Evitar conflitos em registros únicos

## 8. Monitoramento

Para monitorar a API em produção:

```bash
# Verificar saúde geral
curl -X GET http://localhost:3000/api/cursos/listar?limit=1 \
  -H "Authorization: Bearer $TOKEN" \
  -w "%{http_code}\n" -o /dev/null -s

# Verificar tempo de resposta
time curl -X GET http://localhost:3000/api/cursos/listar \
  -H "Authorization: Bearer $TOKEN" -o /dev/null -s
```

## 9. Limpeza de Dados de Teste

```bash
# Excluir dados de teste (cuidado em produção!)
curl -X DELETE http://localhost:3000/api/cursos/$CURSO_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Nota**: Em produção, sempre usar tokens reais e validar todas as operações antes de executar.
