# 📁 Scripts Utilitários

Este diretório contém scripts utilitários essenciais para o projeto de inscrições.

## 📋 Scripts Disponíveis

### 🔧 Prisma & Utilitários

- **`prisma-utils.ts`** - Utilitários para Prisma (status, clear, seed, backup)
- **`test-prisma.ts`** - Teste de conexão Prisma

## 🕷️ Scraping

Para scripts de scraping de escolas, consulte o diretório `../scraping/`.

## 🐳 Banco de Dados Local

Para scripts de gerenciamento do banco PostgreSQL local, consulte o diretório `../database-local/`.

## 🚀 Como Usar

### Testar Prisma

```bash
npx tsx test-prisma.ts
```

### Utilitários Prisma

```bash
# Ver status do banco
npx tsx prisma-utils.ts status

# Limpar dados de teste
npx tsx prisma-utils.ts clear

# Criar dados de exemplo
npx tsx prisma-utils.ts seed

# Fazer backup
npx tsx prisma-utils.ts backup
```
