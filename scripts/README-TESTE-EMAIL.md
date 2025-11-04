# 📧 Scripts de Teste para Email de Confirmação MDX25

Este diretório contém scripts para testar o envio de emails de confirmação sem precisar preencher todo o formulário de inscrição.

## 🚀 Scripts Disponíveis

### 1. **test-email-simple.js** (Recomendado)

Script mais simples e direto para teste rápido.

```bash
# Teste com email padrão
node scripts/test-email-simple.js

# Teste com seu email
node scripts/test-email-simple.js seuemail@exemplo.com
```

### 2. **test-mdx25-confirmation-email.js**

Script completo com múltiplos testes e validações.

```bash
node scripts/test-mdx25-confirmation-email.js
```

### 3. **test-mdx25-confirmation-email.ps1** (Windows)

Script PowerShell para usuários Windows.

```powershell
.\scripts\test-mdx25-confirmation-email.ps1
```

## 📋 Pré-requisitos

1. **Servidor rodando:**

   ```bash
   npm run dev
   ```

2. **Variáveis de ambiente configuradas:**
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

## 🔧 Como Usar

### Teste Rápido (Recomendado)

```bash
# 1. Inicie o servidor
npm run dev

# 2. Em outro terminal, execute o teste
node scripts/test-email-simple.js seuemail@teste.com
```

### Teste Completo

```bash
# 1. Inicie o servidor
npm run dev

# 2. Execute o teste completo
node scripts/test-mdx25-confirmation-email.js
```

## 📊 O que os Scripts Testam

### ✅ **Teste Principal**

- Envio de email com dados válidos
- Verificação de resposta de sucesso
- Medição de tempo de resposta

### 🔍 **Teste de Validação**

- Campos obrigatórios ausentes
- Resposta de erro apropriada

### 🔄 **Teste com Dados Alternativos**

- Diferentes combinações de dados
- Verificação de robustez

## 🐛 Solução de Problemas

### Erro: `ECONNREFUSED`

```
💡 Dica: Certifique-se de que o servidor está rodando (npm run dev)
```

### Erro: `Request timeout`

```
💡 Dica: O servidor pode estar demorando para responder. Verifique os logs.
```

### Erro de Autenticação SMTP

```
🔍 Verifique as variáveis de ambiente:
- SMTP_USER
- SMTP_PASS
- SMTP_HOST
- SMTP_PORT
```

## 📝 Dados de Teste

Os scripts usam dados fictícios para teste:

```json
{
  "email": "teste@exemplo.com",
  "nomeCompleto": "Maria da Silva Santos",
  "nomeCurso": "Desenvolvimento Web Full Stack",
  "cpf": "123.456.789-00"
}
```

## 🎯 Resultados Esperados

### ✅ **Sucesso**

```json
{
  "success": true,
  "message": "Email de confirmação MDX25 enviado com sucesso!"
}
```

### ❌ **Falha de Validação**

```json
{
  "error": "Dados obrigatórios não fornecidos"
}
```

### ❌ **Falha de SMTP**

```json
{
  "error": "Erro de autenticação SMTP"
}
```

## 🔧 Personalização

### Alterar Dados de Teste

Edite o arquivo `test-email-simple.js`:

```javascript
const defaultTestData = {
  email: "seuemail@teste.com", // Seu email
  nomeCompleto: "Seu Nome", // Seu nome
  nomeCurso: "Nome do Curso", // Nome do curso
  cpf: "000.000.000-00", // CPF de teste
};
```

### Alterar URL do Servidor

Se o servidor estiver rodando em porta diferente:

```javascript
const PORT = 3001; // Altere para sua porta
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique se o servidor está rodando
2. Confirme as variáveis de ambiente SMTP
3. Verifique os logs do servidor
4. Teste com um email real para confirmar o recebimento




