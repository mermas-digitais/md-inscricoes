# Scraping de Escolas Federais do Maranhão

Este diretório contém scripts para fazer scraping das escolas federais do Maranhão e enviar diretamente para o Supabase.

## 🎯 Objetivo

Fazer scraping apenas das escolas federais do Maranhão da URL `https://escolas.com.br/federais/ma/` e enviar os dados diretamente para o Supabase, de forma mais objetiva e focada.

## 📁 Arquivos

- `scrape-federais-ma-supabase.py` - Script principal de scraping (com credenciais)
- `scrape-federais-ma-json.py` - Script de scraping que salva em JSON
- `upload-federais-to-supabase.py` - Script para enviar JSON para Supabase
- `run-federais-scraping.ps1` - Script PowerShell para Windows
- `run-federais-scraping.sh` - Script Bash para Linux/macOS
- `run-upload-federais.ps1` - Script PowerShell para upload
- `escolas_federais_ma.json` - Arquivo JSON com as escolas coletadas
- `README-FEDERAIIS.md` - Este arquivo de documentação

## 🚀 Como Usar

### Método 1: Scraping + Upload Direto (Recomendado)

#### Windows (PowerShell)

```powershell
cd scraping
# 1. Fazer scraping e salvar em JSON
python scrape-federais-ma-json.py

# 2. Configurar credenciais no upload-federais-to-supabase.py
# 3. Enviar para Supabase
.\run-upload-federais.ps1
```

#### Linux/macOS (Bash)

```bash
cd scraping
# 1. Fazer scraping e salvar em JSON
python scrape-federais-ma-json.py

# 2. Configurar credenciais no upload-federais-to-supabase.py
# 3. Enviar para Supabase
python upload-federais-to-supabase.py
```

### Método 2: Scraping Direto para Supabase

#### Windows (PowerShell)

```powershell
cd scraping
.\run-federais-scraping.ps1
```

#### Linux/macOS (Bash)

```bash
cd scraping
chmod +x run-federais-scraping.sh
./run-federais-scraping.sh
```

### Execução Manual

```bash
cd scraping
pip install requests beautifulsoup4 supabase
python scrape-federais-ma-json.py
```

## ⚙️ Configuração

### Para Upload Direto (Método 1 - Recomendado)

Configure as credenciais do Supabase no arquivo `upload-federais-to-supabase.py`:

```python
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key"
```

### Para Scraping Direto (Método 2)

Configure as credenciais do Supabase no arquivo `scrape-federais-ma-supabase.py`:

```python
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key"
```

## 📊 Estrutura dos Dados

As escolas serão salvas no Supabase com a seguinte estrutura:

```json
{
  "nome": "Nome da Escola",
  "rede": "federal",
  "publica": true,
  "uf": "MA",
  "municipio": "Nome do Município"
}
```

## 🔍 Funcionalidades

- ✅ Scraping focado apenas em escolas federais
- ✅ Envio direto para o Supabase
- ✅ Verificação de duplicatas
- ✅ Tratamento de erros
- ✅ Logs detalhados
- ✅ Limpeza automática de texto

## 📝 Logs

O script fornece logs detalhados durante a execução:

- ✅ Escolas encontradas e processadas
- ⚠️ Escolas que já existem no banco
- ❌ Erros durante o processamento
- 📊 Estatísticas finais

## 🛠️ Dependências

- `requests` - Para fazer requisições HTTP
- `beautifulsoup4` - Para parsing HTML
- `supabase` - Cliente Python para Supabase

## 🎯 Vantagens

- **Foco**: Apenas escolas federais do Maranhão
- **Eficiência**: Envio direto para o Supabase
- **Simplicidade**: Script único e objetivo
- **Confiabilidade**: Verificação de duplicatas
- **Manutenibilidade**: Código limpo e documentado
