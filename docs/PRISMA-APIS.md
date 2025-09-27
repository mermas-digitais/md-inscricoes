# 🚀 APIs com Prisma - Mermãs Digitais

## 📋 Visão Geral

Este documento descreve as APIs criadas usando Prisma ORM para gerenciar o banco PostgreSQL local. Todas as APIs seguem o padrão REST e incluem validação de dados.

## 🔧 Configuração

### Banco de Dados

- **Host:** localhost:5432
- **Banco:** mermas_digitais_db
- **ORM:** Prisma Client
- **Schema:** 17 tabelas (12 originais + 5 para eventos)

### Scripts Disponíveis

```bash
# Gerenciar banco
yarn db:generate    # Gerar cliente Prisma
yarn db:push        # Aplicar mudanças no schema
yarn db:pull        # Sincronizar schema com banco
yarn db:studio      # Abrir Prisma Studio

# Utilitários
yarn db:status      # Ver estatísticas do banco
yarn db:seed        # Criar dados de exemplo
yarn db:clear       # Limpar dados de teste
yarn db:backup      # Criar backup dos dados
yarn db:test        # Testar conexão
```

## 📚 APIs Disponíveis

### 1. Escolas (Prisma)

**Endpoint:** `/api/escolas-prisma`

#### GET - Listar Escolas

```bash
GET /api/escolas-prisma?search=termo&tipo=Municipal&limit=50
```

**Parâmetros:**

- `search` (string): Termo de busca no nome
- `tipo` (string): Filtro por tipo (Municipal, Estadual, Federal, Particular)
- `limit` (number): Limite de resultados (padrão: 50)

**Resposta:**

```json
{
  "escolas": [
    {
      "id": 1,
      "nome": "Escola Municipal de Teste",
      "tipo": "Municipal",
      "cidade": "Imperatriz",
      "estado": "MA"
    }
  ]
}
```

#### POST - Criar Escola

```bash
POST /api/escolas-prisma
Content-Type: application/json

{
  "nome": "Nova Escola",
  "tipo": "Municipal",
  "cidade": "Imperatriz",
  "estado": "MA"
}
```

### 2. Eventos

**Endpoint:** `/api/eventos`

#### GET - Listar Eventos

```bash
GET /api/eventos?ativo=true&limit=50
```

**Parâmetros:**

- `ativo` (boolean): Filtrar por eventos ativos
- `limit` (number): Limite de resultados

**Resposta:**

```json
{
  "eventos": [
    {
      "id": "uuid",
      "nome": "MDX25",
      "descricao": "Evento das Mermãs Digitais",
      "dataInicio": "2025-01-01T09:00:00Z",
      "dataFim": "2025-01-01T17:00:00Z",
      "ativo": true,
      "modalidades": [
        {
          "id": "uuid",
          "nome": "Robótica",
          "limiteVagas": 50,
          "vagasOcupadas": 10
        }
      ],
      "_count": {
        "inscricoesEventos": 5
      }
    }
  ]
}
```

#### POST - Criar Evento

```bash
POST /api/eventos
Content-Type: application/json

{
  "nome": "MDX25",
  "descricao": "Evento das Mermãs Digitais",
  "dataInicio": "2025-01-01T09:00:00Z",
  "dataFim": "2025-01-01T17:00:00Z",
  "ativo": true,
  "modalidades": [
    {
      "nome": "Robótica",
      "descricao": "Curso de robótica",
      "limiteVagas": 50
    }
  ]
}
```

### 3. Orientadores

**Endpoint:** `/api/orientadores`

#### GET - Listar Orientadores

```bash
GET /api/orientadores?ativo=true&escola=termo&limit=50
```

**Parâmetros:**

- `ativo` (boolean): Filtrar por orientadores ativos
- `escola` (string): Buscar por escola
- `limit` (number): Limite de resultados

**Resposta:**

```json
{
  "orientadores": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "cpf": "12345678901",
      "telefone": "999999999",
      "email": "joao@escola.com",
      "escola": "Escola Municipal",
      "genero": "Masculino",
      "ativo": true,
      "_count": {
        "inscricoesEventos": 3
      }
    }
  ]
}
```

#### POST - Criar Orientador

```bash
POST /api/orientadores
Content-Type: application/json

{
  "nome": "João Silva",
  "cpf": "12345678901",
  "telefone": "999999999",
  "email": "joao@escola.com",
  "escola": "Escola Municipal",
  "genero": "Masculino"
}
```

### 4. Inscrições em Eventos

**Endpoint:** `/api/inscricoes-eventos`

#### GET - Listar Inscrições

```bash
GET /api/inscricoes-eventos?eventoId=uuid&orientadorId=uuid&status=PENDENTE&limit=50
```

**Parâmetros:**

- `eventoId` (string): Filtrar por evento
- `orientadorId` (string): Filtrar por orientador
- `status` (string): Filtrar por status (PENDENTE, APROVADA, REJEITADA, CANCELADA)
- `limit` (number): Limite de resultados

**Resposta:**

```json
{
  "inscricoes": [
    {
      "id": "uuid",
      "status": "PENDENTE",
      "observacoes": "Observações",
      "createdAt": "2025-01-01T10:00:00Z",
      "evento": {
        "id": "uuid",
        "nome": "MDX25",
        "dataInicio": "2025-01-01T09:00:00Z",
        "dataFim": "2025-01-01T17:00:00Z"
      },
      "orientador": {
        "id": "uuid",
        "nome": "João Silva",
        "email": "joao@escola.com",
        "escola": "Escola Municipal"
      },
      "modalidade": {
        "id": "uuid",
        "nome": "Robótica",
        "limiteVagas": 50,
        "vagasOcupadas": 10
      },
      "participantesEventos": [
        {
          "id": "uuid",
          "nome": "Maria Silva",
          "cpf": "98765432100",
          "dataNascimento": "2010-01-01",
          "email": "maria@email.com",
          "genero": "Feminino"
        }
      ]
    }
  ]
}
```

#### POST - Criar Inscrição

```bash
POST /api/inscricoes-eventos
Content-Type: application/json

{
  "eventoId": "uuid",
  "orientadorId": "uuid",
  "modalidadeId": "uuid",
  "observacoes": "Observações opcionais",
  "participantes": [
    {
      "nome": "Maria Silva",
      "cpf": "98765432100",
      "dataNascimento": "2010-01-01",
      "email": "maria@email.com",
      "genero": "Feminino"
    }
  ]
}
```

## 🔍 Exemplos de Uso

### Frontend (React/Next.js)

```typescript
// Buscar eventos ativos
const fetchEventos = async () => {
  const response = await fetch("/api/eventos?ativo=true");
  const data = await response.json();
  return data.eventos;
};

// Criar nova inscrição
const criarInscricao = async (dados: any) => {
  const response = await fetch("/api/inscricoes-eventos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });
  return response.json();
};
```

### Teste com cURL

```bash
# Listar eventos
curl "http://localhost:3000/api/eventos?ativo=true"

# Criar orientador
curl -X POST "http://localhost:3000/api/orientadores" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "12345678901",
    "telefone": "999999999",
    "email": "joao@escola.com",
    "escola": "Escola Municipal",
    "genero": "Masculino"
  }'
```

## 🚨 Tratamento de Erros

Todas as APIs retornam erros padronizados:

```json
{
  "error": "Mensagem de erro descritiva"
}
```

**Códigos de Status:**

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `404` - Recurso não encontrado
- `409` - Conflito (recurso já existe)
- `500` - Erro interno do servidor

## 🔧 Desenvolvimento

### Adicionar Nova API

1. Criar arquivo em `app/api/nova-api/route.ts`
2. Importar `prisma` de `@/lib/prisma`
3. Implementar métodos GET, POST, PUT, DELETE
4. Adicionar validação de dados
5. Documentar na API

### Testar APIs

```bash
# Testar conexão
yarn db:test

# Ver estatísticas
yarn db:status

# Abrir Prisma Studio
yarn db:studio
```

## 📊 Monitoramento

### Logs

- Todas as operações são logadas no console
- Erros são capturados e retornados de forma padronizada

### Métricas

- Use `yarn db:status` para ver estatísticas do banco
- Prisma Studio para visualização gráfica

---

**Última atualização:** 25/09/2025  
**Versão:** 1.0 - APIs Prisma Funcionais
