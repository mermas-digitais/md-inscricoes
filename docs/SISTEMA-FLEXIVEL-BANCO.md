# 🔄 Sistema Flexível de Banco de Dados

## 📋 Visão Geral

O sistema flexível de banco de dados permite alternar entre banco local (PostgreSQL via Docker) e nuvem (Supabase) através de uma simples variável de ambiente. Isso torna o desenvolvimento muito mais prático, especialmente quando o banco local não está disponível.

## 🚀 Como Usar

### 1. Configuração Básica

Adicione ao seu arquivo `.env`:

```bash
# Modo do banco: "local", "supabase", ou "auto"
DATABASE_MODE=auto

# Banco local (Docker)
DATABASE_URL="postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db"

# Banco Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Fallback automático (opcional)
DATABASE_FALLBACK=true
DATABASE_PRIMARY=prisma
```

### 2. Modos de Operação

#### Modo `auto` (Recomendado)

```bash
DATABASE_MODE=auto
```

- Detecta automaticamente qual banco usar
- Tenta Supabase primeiro, se não disponível usa banco local
- Ideal para desenvolvimento

#### Modo `local`

```bash
DATABASE_MODE=local
```

- Força uso do banco local (Docker)
- Útil quando você tem o Docker rodando

#### Modo `supabase`

```bash
DATABASE_MODE=supabase
```

- Força uso do Supabase
- Útil para produção ou quando o banco local não está disponível

## 🔧 APIs Disponíveis

### Status do Banco

```bash
# Verificar status
GET /api/database-status

# Testar conexão
POST /api/database-status
{
  "action": "test"
}

# Forçar reconexão
POST /api/database-status
{
  "action": "reconnect"
}
```

### Exemplo de Resposta

```json
{
  "success": true,
  "data": {
    "activeProvider": "supabase",
    "prismaAvailable": false,
    "supabaseAvailable": true,
    "connectionTest": {
      "provider": "supabase",
      "status": "success"
    },
    "config": {
      "mode": "auto",
      "fallbackEnabled": true,
      "fallbackPrimary": "prisma"
    }
  }
}
```

## 💻 Uso em Código

### Importação Básica

```typescript
import { dbManager } from "@/lib/database-manager";
import { executeHybridOperation } from "@/lib/api-database";

// Obter provedor ativo
const provider = await dbManager.getActiveProvider();

// Executar operação híbrida
const result = await executeHybridOperation(
  // Operação Prisma
  async (prisma) => {
    return await prisma.inscricoes.findMany();
  },
  // Operação Supabase
  async (supabase) => {
    const { data } = await supabase.from("inscricoes").select("*");
    return data;
  }
);
```

### APIs com Fallback Automático

```typescript
import { withDatabase, createSuccessResponse } from "@/lib/api-database";

export const GET = withDatabase(async (request: NextRequest) => {
  const result = await executeHybridOperation(
    async (prisma) => await prisma.inscricoes.findMany(),
    async (supabase) => {
      const { data } = await supabase.from("inscricoes").select("*");
      return data;
    }
  );

  return createSuccessResponse(result.data, result.provider);
});
```

## 🧪 Testando o Sistema

### Script de Teste

```bash
# Testar sistema flexível
npm run db:test-flexible

# Verificar status via API
npm run db:status-api
```

### Teste Manual

```bash
# Verificar status
curl http://localhost:3000/api/database-status

# Testar conexão
curl -X POST http://localhost:3000/api/database-status \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

## 🔄 Fallback Automático

Quando `DATABASE_FALLBACK=true`, o sistema automaticamente tenta o banco alternativo em caso de erro:

```typescript
const result = await dbManager.executeWithFallback(
  // Operação primária
  async (provider) => {
    // Sua operação aqui
  },
  // Operação de fallback
  async (provider) => {
    // Operação alternativa aqui
  }
);
```

## 📊 Monitoramento

### Logs Automáticos

O sistema registra automaticamente:

- Qual provedor está sendo usado
- Tentativas de fallback
- Erros de conexão
- Status de disponibilidade

### Métricas Disponíveis

- Provedor ativo
- Disponibilidade de cada banco
- Status de conexão
- Configuração atual

## 🚨 Tratamento de Erros

### Erros Comuns

1. **Banco local não disponível**

   ```
   Solução: Use DATABASE_MODE=supabase ou inicie o Docker
   ```

2. **Supabase não configurado**

   ```
   Solução: Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Erro de conexão**
   ```
   Solução: Verifique as credenciais e use o fallback automático
   ```

### Debug

```typescript
// Verificar configuração
console.log(await dbManager.getStats());

// Testar conexão
const test = await dbManager.testConnection();
console.log(test);
```

## 🔧 Migração de APIs Existentes

### Antes (Supabase apenas)

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

export async function GET() {
  const { data } = await supabase.from("inscricoes").select("*");
  return NextResponse.json({ data });
}
```

### Depois (Sistema flexível)

```typescript
import { executeHybridOperation, withDatabase } from "@/lib/api-database";

export const GET = withDatabase(async () => {
  const result = await executeHybridOperation(
    async (prisma) => await prisma.inscricoes.findMany(),
    async (supabase) => {
      const { data } = await supabase.from("inscricoes").select("*");
      return data;
    }
  );

  return NextResponse.json({
    data: result.data,
    provider: result.provider,
  });
});
```

## 📈 Benefícios

✅ **Desenvolvimento Flexível**: Use banco local ou nuvem conforme necessário  
✅ **Fallback Automático**: Sistema continua funcionando mesmo com falhas  
✅ **Zero Downtime**: Alternância transparente entre bancos  
✅ **Compatibilidade**: Mantém compatibilidade com código existente  
✅ **Monitoramento**: Logs e métricas detalhadas  
✅ **Configuração Simples**: Apenas uma variável de ambiente

## 🎯 Casos de Uso

### Desenvolvimento Local

```bash
DATABASE_MODE=local  # Usa Docker quando disponível
```

### Desenvolvimento Remoto

```bash
DATABASE_MODE=supabase  # Usa nuvem quando Docker não disponível
```

### Produção

```bash
DATABASE_MODE=supabase  # Sempre usa nuvem
DATABASE_FALLBACK=true  # Fallback para banco local se necessário
```

### Desenvolvimento Híbrido

```bash
DATABASE_MODE=auto  # Detecta automaticamente
DATABASE_FALLBACK=true  # Fallback habilitado
```

---

**🎉 Agora você pode desenvolver sem se preocupar com a disponibilidade do banco local!**
