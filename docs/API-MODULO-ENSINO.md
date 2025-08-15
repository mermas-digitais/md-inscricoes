# API do Módulo de Ensino - Documentação Completa

Esta documentação descreve todos os endpoints da API para o Módulo de Ensino, que permite gerenciar cursos, turmas, aulas e frequência.

## Autenticação

Todos os endpoints requerem autenticação via Bearer Token no header, utilizando o **email do monitor** cadastrado no banco de dados:

```
Authorization: Bearer email@exemplo.com
```

**Sistema de Autenticação:**

- O sistema busca o monitor no banco de dados através do email fornecido
- Verifica o campo `role` na tabela `monitores` para determinar as permissões
- **Roles disponíveis:**
  - `MONITOR`: Acesso limitado (pode visualizar e gerenciar dados, mas não excluir)
  - `ADM`: Acesso total (todas as operações, incluindo exclusões)

**Exemplo de uso:**

```bash
curl -X GET http://localhost:3000/api/cursos \
  -H "Authorization: Bearer joao.monitor@mermasdigitais.com"
```

**Estrutura da tabela monitores:**

```sql
CREATE TABLE monitores (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  curso_responsavel VARCHAR(100),
  role VARCHAR(20) DEFAULT 'MONITOR' CHECK (role IN ('MONITOR', 'ADM')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📚 CURSOS

### POST /api/cursos

Criar um novo curso.

**Autenticação:** ADM ou MONITOR

**Body:**

```json
{
  "nome_curso": "Desenvolvimento Web Full Stack",
  "descricao": "Curso completo de desenvolvimento web",
  "carga_horaria": 120,
  "status": "ativo"
}
```

**Campos:**

- `nome_curso` (obrigatório): Nome do curso
- `descricao` (opcional): Descrição do curso
- `carga_horaria` (opcional): Carga horária em horas
- `status` (opcional): "ativo" ou "inativo" (padrão: "ativo")

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome_curso": "Desenvolvimento Web Full Stack",
    "descricao": "Curso completo de desenvolvimento web",
    "carga_horaria": 120,
    "status": "ativo",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Curso criado com sucesso"
}
```

### GET /api/cursos/listar

Listar cursos com filtros e paginação.

**Autenticação:** ADM ou MONITOR

**Query Parameters:**

- `status` (opcional): "ativo" ou "inativo"
- `nome` (opcional): Busca por nome (case-insensitive)
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Registros por página (padrão: 10)

**Resposta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome_curso": "Desenvolvimento Web Full Stack",
      "descricao": "Curso completo de desenvolvimento web",
      "carga_horaria": 120,
      "status": "ativo",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 1,
    "records_per_page": 10
  }
}
```

### GET /api/cursos/[id]

Buscar curso por ID.

**Autenticação:** ADM ou MONITOR

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome_curso": "Desenvolvimento Web Full Stack",
    "descricao": "Curso completo de desenvolvimento web",
    "carga_horaria": 120,
    "status": "ativo",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/cursos/[id]

Atualizar curso existente.

**Autenticação:** ADM ou MONITOR

**Body:** (todos os campos são opcionais)

```json
{
  "nome_curso": "Desenvolvimento Web Full Stack - Atualizado",
  "descricao": "Nova descrição",
  "carga_horaria": 150,
  "status": "inativo"
}
```

### DELETE /api/cursos/[id]

Excluir curso.

**Autenticação:** Apenas ADM

**Resposta:**

```json
{
  "success": true,
  "message": "Curso excluído com sucesso"
}
```

## 🎓 TURMAS

### POST /api/turmas

Criar uma nova turma.

**Autenticação:** ADM ou MONITOR

**Body:**

```json
{
  "curso_id": "uuid-do-curso",
  "nome_turma": "Turma A - 2024.1",
  "data_inicio": "2024-03-01",
  "data_fim": "2024-06-30",
  "horario": "19:00 às 22:00",
  "local": "Laboratório 1",
  "status": "ativa"
}
```

**Campos:**

- `curso_id` (obrigatório): UUID do curso
- `nome_turma` (obrigatório): Nome da turma
- `data_inicio` (opcional): Data de início (YYYY-MM-DD)
- `data_fim` (opcional): Data de fim (YYYY-MM-DD)
- `horario` (opcional): Horário das aulas
- `local` (opcional): Local das aulas
- `status` (opcional): "ativa", "encerrada" ou "cancelada" (padrão: "ativa")

### GET /api/turmas/listar

Listar turmas com filtros e paginação.

**Query Parameters:**

- `curso_id` (opcional): Filtrar por curso
- `status` (opcional): Filtrar por status
- `nome` (opcional): Busca por nome
- `page`, `limit`: Paginação

### GET /api/turmas/[id]

Buscar turma por ID (inclui dados do curso).

### PUT /api/turmas/[id]

Atualizar turma existente.

### DELETE /api/turmas/[id]

Excluir turma (apenas ADM).

## 👥 GERENCIAMENTO DE ALUNAS

### POST /api/turmas/alunas/vincular

Vincular alunas a uma turma.

**Body:**

```json
{
  "turma_id": "uuid-da-turma",
  "aluna_ids": ["uuid-aluna-1", "uuid-aluna-2"]
}
```

### POST /api/turmas/alunas/desvincular

Desvincular alunas de uma turma.

**Body:**

```json
{
  "turma_id": "uuid-da-turma",
  "aluna_ids": ["uuid-aluna-1"]
}
```

### GET /api/turmas/alunas/listar

Listar alunas de turmas.

**Query Parameters:**

- `turma_id` (opcional): Filtrar por turma específica

## 👨‍🏫 GERENCIAMENTO DE MONITORES

### POST /api/turmas/monitores/vincular

Vincular monitores a uma turma.

### POST /api/turmas/monitores/desvincular

Desvincular monitores de uma turma.

### GET /api/turmas/monitores/listar

Listar monitores de turmas.

## 📖 AULAS

### POST /api/aulas

Criar uma nova aula.

**Autenticação:** ADM ou MONITOR

**Body:**

```json
{
  "turma_id": "uuid-da-turma",
  "data_aula": "2024-03-01",
  "conteudo_ministrado": "Introdução ao HTML e CSS"
}
```

**Campos:**

- `turma_id` (obrigatório): UUID da turma
- `data_aula` (obrigatório): Data da aula (YYYY-MM-DD)
- `conteudo_ministrado` (opcional): Conteúdo da aula

**Funcionalidade Especial:**
Ao criar uma aula, o sistema automaticamente:

1. Cria registros de frequência para todas as alunas da turma
2. Define `presente = false` como padrão para todas

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-da-aula",
    "turma_id": "uuid-da-turma",
    "data_aula": "2024-03-01",
    "conteudo_ministrado": "Introdução ao HTML e CSS",
    "created_at": "2024-01-01T00:00:00Z",
    "turma": {
      "id": "uuid-da-turma",
      "nome_turma": "Turma A - 2024.1"
    },
    "alunas_registradas": 15
  },
  "message": "Aula criada com sucesso. Registros de frequência criados para 15 alunas."
}
```

### GET /api/aulas/listar

Listar aulas com filtros e paginação.

**Query Parameters:**

- `turma_id` (opcional): Filtrar por turma
- `data_inicio` (opcional): Data inicial (YYYY-MM-DD)
- `data_fim` (opcional): Data final (YYYY-MM-DD)
- `page`, `limit`: Paginação

### GET /api/aulas/[id]

Buscar aula por ID (inclui dados da turma e frequência).

**Resposta inclui:**

- Dados da aula
- Dados da turma e curso
- Lista de frequência de todas as alunas

### PUT /api/aulas/[id]

Atualizar aula existente.

### DELETE /api/aulas/[id]

Excluir aula (apenas ADM).

**Nota:** Ao excluir uma aula, todos os registros de frequência são automaticamente removidos.

## ✅ FREQUÊNCIA

### GET /api/frequencia

Listar registros de frequência.

**Query Parameters:**

- `aula_id` (opcional): Filtrar por aula
- `aluna_id` (opcional): Filtrar por aluna
- `turma_id` (opcional): Filtrar por turma
- `presente` (opcional): "true" ou "false"
- `page`, `limit`: Paginação

### PUT /api/frequencia/atualizar

Atualizar frequência em lote.

**Body:**

```json
{
  "atualizacoes": [
    {
      "frequencia_id": "uuid-frequencia-1",
      "presente": true,
      "observacoes": "Participou ativamente"
    },
    {
      "frequencia_id": "uuid-frequencia-2",
      "presente": false,
      "observacoes": "Faltou justificadamente"
    }
  ]
}
```

**Campos por atualização:**

- `frequencia_id` (obrigatório): UUID do registro de frequência
- `presente` (obrigatório): true ou false
- `observacoes` (opcional): Observações sobre a presença

**Resposta:**

```json
{
  "success": true,
  "atualizados": 2,
  "total_solicitados": 2,
  "data": [
    {
      "id": "uuid-frequencia-1",
      "aula_id": "uuid-aula",
      "aluna_id": "uuid-aluna",
      "presente": true,
      "observacoes": "Participou ativamente",
      "aulas": { ... },
      "inscricoes": { ... }
    }
  ],
  "message": "Todos os 2 registros foram atualizados com sucesso"
}
```

### GET /api/frequencia/relatorio

Gerar relatório de frequência por turma.

**Query Parameters:**

- `turma_id` (obrigatório): UUID da turma
- `data_inicio` (opcional): Data inicial do período (YYYY-MM-DD)
- `data_fim` (opcional): Data final do período (YYYY-MM-DD)

**Resposta:**

```json
{
  "success": true,
  "data": {
    "turma": {
      "id": "uuid-turma",
      "nome_turma": "Turma A - 2024.1",
      "cursos": {
        "nome_curso": "Desenvolvimento Web"
      }
    },
    "periodo": {
      "data_inicio": "2024-03-01",
      "data_fim": "2024-06-30"
    },
    "aulas": [
      {
        "id": "uuid-aula",
        "data_aula": "2024-03-01",
        "conteudo_ministrado": "HTML Básico",
        "total_presencas": 12,
        "total_registros": 15,
        "percentual_presenca_aula": 80
      }
    ],
    "total_aulas": 1,
    "alunas": [
      {
        "aluna": {
          "id": "uuid-aluna",
          "nome_completo": "Maria Silva",
          "email": "maria@email.com"
        },
        "total_aulas": 1,
        "presencas": 1,
        "faltas": 0,
        "percentual_presenca": 100,
        "frequencia_por_data": {
          "2024-03-01": {
            "aula_id": "uuid-aula",
            "presente": true,
            "observacoes": null
          }
        }
      }
    ],
    "resumo": {
      "total_alunas": 15,
      "media_presenca_geral": 85,
      "total_aulas_periodo": 1
    }
  }
}
```

## 🔒 Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos
- `401`: Token não fornecido
- `403`: Acesso negado (permissão insuficiente)
- `404`: Recurso não encontrado
- `409`: Conflito (ex: aula já existe na data)
- `500`: Erro interno do servidor

## 📝 Observações Importantes

1. **UUIDs**: Todos os IDs são UUIDs v4
2. **Datas**: Sempre no formato YYYY-MM-DD
3. **Cascata**: Ao excluir curso/turma/aula, registros relacionados são removidos automaticamente
4. **Frequência Automática**: Ao criar uma aula, registros de frequência são criados para todas as alunas da turma
5. **Validações**: Todas as entradas são validadas (UUIDs, datas, campos obrigatórios)
6. **Paginação**: Padrão de 10 registros por página, máximo 100
7. **Filtros**: Suporte a múltiplos filtros em endpoints de listagem
8. **Transações**: Operações críticas são executadas em transações para garantir consistência

## 🚀 Fluxo de Uso Recomendado

1. **Criar Curso** → `POST /api/cursos`
2. **Criar Turma** → `POST /api/turmas`
3. **Vincular Alunas** → `POST /api/turmas/alunas/vincular`
4. **Vincular Monitores** → `POST /api/turmas/monitores/vincular`
5. **Criar Aulas** → `POST /api/aulas` (frequência criada automaticamente)
6. **Registrar Presença** → `PUT /api/frequencia/atualizar`
7. **Gerar Relatórios** → `GET /api/frequencia/relatorio`
