# 🔧 Sistema de Clientes Abstratos

## 📋 Visão Geral

O sistema de clientes abstratos fornece uma camada de abstração que permite que as APIs funcionem tanto com banco local (Prisma) quanto com nuvem (Supabase) de forma transparente. Isso resolve o problema de dependência de banco local e permite desenvolvimento flexível.

## 🏗️ Arquitetura

### Clientes Abstratos

1. **DatabaseClient** - Cliente de banco de dados unificado
2. **HttpClient** - Cliente HTTP com retry automático
3. **ApiClient** - Cliente de APIs com métodos de conveniência

### Serviços

1. **InscricoesService** - Gerencia operações de inscrições
2. **VerificationService** - Gerencia códigos de verificação
3. **EscolasService** - Gerencia operações de escolas

## 🚀 Como Usar

### 1. Importação Básica

```typescript
import { getDatabaseClient } from "@/lib/clients/database-client";
import { inscricoesService } from "@/lib/services/inscricoes-service";
```

### 2. Uso em APIs

```typescript
// Antes (dependia de banco específico)
import { prisma } from "@/lib/prisma";
const inscricoes = await prisma.inscricoes.findMany();

// Depois (funciona com qualquer banco)
import { inscricoesService } from "@/lib/services/inscricoes-service";
const result = await inscricoesService.findInscricoes();
```

### 3. Exemplo de API Atualizada

```typescript
import { NextRequest, NextResponse } from "next/server";
import { inscricoesService } from "@/lib/services/inscricoes-service";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Usar serviço abstrato
    const result = await inscricoesService.createInscricao(data, false);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      curso: result.curso,
      status: result.status,
      provider: result.provider,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

## 🔄 Migração de APIs

### Passo 1: Identificar Dependências

```typescript
// Antes
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);
```

### Passo 2: Substituir por Serviços

```typescript
// Depois
import { inscricoesService } from "@/lib/services/inscricoes-service";
import { verificationService } from "@/lib/services/verification-service";
```

### Passo 3: Atualizar Lógica

```typescript
// Antes
const inscricoes = await prisma.inscricoes.findMany({
  where: { curso: "Jogos" },
});

// Depois
const result = await inscricoesService.findInscricoes({
  curso: "Jogos",
});
```

## 📊 APIs Atualizadas

### Rotas MDX25 (Completamente Atualizadas)

- ✅ `/api/mdx25/inscricao` - Usa InscricoesService
- ✅ `/api/mdx25/check-cpf` - Usa InscricoesService
- ✅ `/api/mdx25/send-verification` - Usa VerificationService
- ✅ `/api/mdx25/verify-code` - Usa VerificationService
- ✅ `/api/mdx25/escolas` - Usa EscolasService

### Rotas Principais (Versões Atualizadas)

- ✅ `/api/inscricao-updated` - Versão atualizada
- ✅ `/api/check-cpf-updated` - Versão atualizada
- ✅ `/api/send-verification-updated` - Versão atualizada
- ✅ `/api/verify-code-updated` - Versão atualizada
- ✅ `/api/escolas-updated` - Versão atualizada

## 🧪 Testando o Sistema

### Script de Teste

```bash
# Testar clientes abstratos
npm run test:abstract-clients

# Testar sistema flexível de banco
npm run db:test-flexible

# Verificar status do banco
npm run db:status-api
```

### Teste Manual

```bash
# Testar API MDX25
curl -X POST http://localhost:3000/api/mdx25/check-cpf \
  -H "Content-Type: application/json" \
  -d '{"cpf": "123.456.789-00"}'

# Testar API atualizada
curl -X POST http://localhost:3000/api/check-cpf-updated \
  -H "Content-Type: application/json" \
  -d '{"cpf": "123.456.789-00"}'
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Modo do banco
DATABASE_MODE=auto

# Banco local
DATABASE_URL="postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db"

# Banco Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Fallback
DATABASE_FALLBACK=true
DATABASE_PRIMARY=prisma
```

## 📈 Benefícios

### ✅ **Flexibilidade Total**

- Funciona com banco local ou nuvem
- Alternância automática baseada na disponibilidade
- Fallback automático em caso de erro

### ✅ **Desenvolvimento Simplificado**

- Não precisa subir banco local
- Desenvolvimento remoto sem problemas
- Testes funcionam em qualquer ambiente

### ✅ **Manutenibilidade**

- Código centralizado em serviços
- Lógica de negócio separada da infraestrutura
- Fácil de testar e debugar

### ✅ **Compatibilidade**

- Mantém compatibilidade com código existente
- Migração gradual possível
- APIs antigas continuam funcionando

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

## 🔄 Próximos Passos

1. **Migrar APIs Restantes** - Atualizar todas as rotas para usar serviços
2. **Testes Automatizados** - Criar testes para os serviços
3. **Monitoramento** - Adicionar métricas e logs
4. **Documentação** - Expandir documentação das APIs

## 🚨 Troubleshooting

### Erro: "Cannot find module"

```bash
# Verificar se os arquivos foram criados
ls -la lib/clients/
ls -la lib/services/
```

### Erro: "Database connection failed"

```bash
# Verificar configuração
npm run db:test-flexible
```

### Erro: "Service not found"

```bash
# Verificar importações
import { inscricoesService } from '@/lib/services/inscricoes-service';
```

---

**🎉 Agora você pode desenvolver sem se preocupar com a disponibilidade do banco local!**
