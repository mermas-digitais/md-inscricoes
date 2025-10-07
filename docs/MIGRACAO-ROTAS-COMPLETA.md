# Migração Completa das Rotas da API

## Resumo

Este documento descreve a migração completa de todas as rotas da API para usar a nova estrutura de serviços abstratos que gerencia automaticamente o uso de bancos de dados (local via Prisma ou nuvem via Supabase).

## Rotas Migradas

### 1. Rotas de Inscrição

- **`/api/inscricao`** - Migrada para usar `InscricoesService`
- **`/api/check-cpf`** - Migrada para usar `InscricoesService`

### 2. Rotas de Verificação

- **`/api/send-verification`** - Migrada para usar `VerificationService`
- **`/api/verify-code`** - Migrada para usar `VerificationService`

### 3. Rotas de Escolas

- **`/api/escolas`** - Migrada para usar `EscolasService`
- **`/api/escolas-prisma`** - Migrada para usar `EscolasService` (mantida por ter funcionalidade adicional)

### 4. Rotas de Email

- **`/api/send-confirmation`** - Migrada para usar `ApiClient`
- **`/api/send-excedente`** - Migrada para usar `ApiClient`

## Rotas Removidas (Duplicadas)

### Rotas "Flexible" (Removidas)

- `app/api/inscricao-flexible/route.ts`
- `app/api/check-cpf-flexible/route.ts`

### Rotas "Updated" (Removidas)

- `app/api/inscricao-updated/route.ts`
- `app/api/check-cpf-updated/route.ts`
- `app/api/send-verification-updated/route.ts`
- `app/api/verify-code-updated/route.ts`
- `app/api/escolas-updated/route.ts`

## Benefícios da Migração

### 1. **Abstração de Banco de Dados**

- Todas as rotas agora usam automaticamente o banco disponível (local ou nuvem)
- Fallback automático quando o banco local não está disponível
- Configuração centralizada via variáveis de ambiente

### 2. **Código Mais Limpo**

- Rotas mais simples e focadas na lógica de negócio
- Remoção de código duplicado
- Melhor organização e manutenibilidade

### 3. **Consistência**

- Todas as rotas seguem o mesmo padrão
- Tratamento de erros padronizado
- Logs consistentes

### 4. **Flexibilidade**

- Fácil troca entre bancos de dados
- Configuração via variáveis de ambiente
- Suporte a diferentes provedores

## Estrutura dos Serviços

### InscricoesService

```typescript
// Métodos disponíveis:
-createInscricao(data, isMDX25) -
  checkCPFExists(cpf, isMDX25) -
  findInscricoes(filters);
```

### VerificationService

```typescript
// Métodos disponíveis:
-createAndSendCode(email, isMDX25) - verifyCode(email, code, isMDX25);
```

### EscolasService

```typescript
// Métodos disponíveis:
-findEscolas(filters) -
  createEscola(data) -
  findEscolaById(id) -
  getEscolasStats();
```

### ApiClient

```typescript
// Métodos disponíveis:
-sendConfirmationEmail(data) - sendExcedenteEmail(data) - getDatabaseStatus();
```

## Configuração

### Variáveis de Ambiente

```env
# Modo do banco de dados
DATABASE_MODE=auto  # auto, local, supabase

# Fallback
DATABASE_FALLBACK=true
DATABASE_PRIMARY=prisma

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Local (Prisma)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

## Testes

### Script de Teste

```bash
npm run test:migrated-routes
```

Este script testa todas as rotas migradas para garantir que estão funcionando corretamente.

### Teste Manual

1. Inicie o servidor: `npm run dev`
2. Teste as rotas via Postman ou curl
3. Verifique os logs para confirmar o uso do banco correto

## Compatibilidade

### Rotas MDX25

As rotas MDX25 já foram migradas anteriormente e continuam funcionando:

- `/api/mdx25/inscricao`
- `/api/mdx25/check-cpf`
- `/api/mdx25/send-verification`
- `/api/mdx25/verify-code`
- `/api/mdx25/escolas`

### Rotas Existentes

Todas as outras rotas da API continuam funcionando normalmente, apenas as rotas principais foram migradas para usar a nova estrutura.

## Próximos Passos

1. **Monitoramento**: Acompanhe os logs para verificar o uso correto dos bancos
2. **Testes**: Execute os testes regularmente para garantir a estabilidade
3. **Otimização**: Considere migrar outras rotas conforme necessário
4. **Documentação**: Mantenha a documentação atualizada

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**

   - Verifique as variáveis de ambiente
   - Confirme se o banco local está rodando
   - Teste a conectividade com Supabase

2. **Rotas não funcionando**

   - Verifique se o servidor está rodando
   - Confirme se as dependências estão instaladas
   - Verifique os logs do servidor

3. **Emails não sendo enviados**
   - Verifique as configurações SMTP
   - Confirme se as credenciais estão corretas
   - Teste a conectividade SMTP

### Logs Úteis

```bash
# Verificar status do banco
npm run db:status-api

# Testar clientes abstratos
npm run test:abstract-clients

# Testar rotas migradas
npm run test:migrated-routes
```

## Conclusão

A migração foi concluída com sucesso. Todas as rotas principais agora usam a nova estrutura de serviços abstratos, proporcionando:

- ✅ Abstração completa de banco de dados
- ✅ Fallback automático
- ✅ Código mais limpo e organizado
- ✅ Melhor manutenibilidade
- ✅ Configuração flexível
- ✅ Testes automatizados

O sistema agora está mais robusto e preparado para diferentes cenários de uso.
