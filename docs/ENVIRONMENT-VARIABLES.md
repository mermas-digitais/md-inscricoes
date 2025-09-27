# 🔧 Variáveis de Ambiente - Mermãs Digitais

## 📋 Visão Geral

Este documento descreve todas as variáveis de ambiente utilizadas no sistema Mermãs Digitais.

## 🔐 Variáveis Obrigatórias

### Banco de Dados Supabase (Sistema Principal)

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Banco de Dados PostgreSQL Local (Prisma)

```bash
DATABASE_URL="postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db"
```

### Configurações de Email

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
SMTP_TLS=true
SMTP_CONNECTION_TIMEOUT=10000
SMTP_GREETING_TIMEOUT=5000
SMTP_SOCKET_TIMEOUT=10000
```

## 🎨 Variáveis de Interface

### Controle do Countdown MDX25

```bash
# Controla a exibição do countdown em todas as páginas do sistema
# Aplica-se a: / (página principal), /mdx25 (página inicial) e /mdx25/inscricoes (formulário)
# Valores: "true" (padrão) ou "false"
NEXT_PUBLIC_SHOW_COUNTDOWN=true
```

**Como usar:**

- `NEXT_PUBLIC_SHOW_COUNTDOWN=true` - Countdown visível (padrão)
- `NEXT_PUBLIC_SHOW_COUNTDOWN=false` - Countdown oculto

**Páginas afetadas:**

- `/` - Página principal do sistema
- `/mdx25` - Página inicial de verificação de email MDX25
- `/mdx25/inscricoes` - Formulário de inscrição MDX25

## 🔧 Variáveis de Desenvolvimento

```bash
NODE_ENV=development
```

## 📝 Exemplo de Arquivo .env

```bash
# ===============================================
# CONFIGURAÇÕES DO SISTEMA MERMÃS DIGITAIS
# ===============================================

# ===============================================
# BANCO DE DADOS SUPABASE (SISTEMA PRINCIPAL)
# ===============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ===============================================
# BANCO DE DADOS POSTGRESQL LOCAL (PRISMA)
# ===============================================
DATABASE_URL="postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db"

# ===============================================
# CONFIGURAÇÕES DE EMAIL
# ===============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
SMTP_TLS=true
SMTP_CONNECTION_TIMEOUT=10000
SMTP_GREETING_TIMEOUT=5000
SMTP_SOCKET_TIMEOUT=10000

# ===============================================
# CONFIGURAÇÕES DE INTERFACE
# ===============================================
# Controla a exibição do countdown na página MDX25
NEXT_PUBLIC_SHOW_COUNTDOWN=true

# ===============================================
# CONFIGURAÇÕES DE DESENVOLVIMENTO
# ===============================================
NODE_ENV=development
```

## 🚀 Como Configurar

1. **Copie o arquivo de exemplo:**

   ```bash
   cp .env.example .env
   ```

2. **Edite as variáveis:**

   - Substitua os valores placeholder pelos valores reais
   - Configure as credenciais do Supabase
   - Configure as credenciais do email SMTP

3. **Reinicie o servidor:**
   ```bash
   yarn dev
   ```

## 🔍 Verificação

Para verificar se as variáveis estão configuradas corretamente:

```bash
# Verificar variáveis de ambiente
yarn db:status

# Testar conexão com banco
yarn db:test

# Verificar configuração de email
yarn test:email
```

## ⚠️ Segurança

- **Nunca commite** arquivos `.env` no Git
- Use `.env.example` para documentar as variáveis
- Mantenha as chaves de API seguras
- Use variáveis de ambiente diferentes para desenvolvimento e produção

---

**Última atualização:** 25/09/2025  
**Versão:** 1.0 - Variáveis de Ambiente Documentadas
