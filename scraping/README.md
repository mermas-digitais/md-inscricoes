# 🕷️ Scraping de Escolas do Maranhão

Este diretório contém todos os scripts necessários para extrair dados de escolas do Maranhão do site `escolas.com.br`.

## 📁 Arquivos

- **`scrape-escolas-ma.py`** - Script principal de scraping
- **`requirements.txt`** - Dependências Python necessárias
- **`test-dependencies.py`** - Teste de dependências
- **`run-scraping.ps1`** - Script de execução para Windows
- **`run-scraping.sh`** - Script de execução para Linux/Mac
- **`README-SCRAPING.md`** - Documentação detalhada

## 🚀 Execução Rápida

### Windows

```powershell
.\run-scraping.ps1
```

### Linux/Mac

```bash
chmod +x run-scraping.sh
./run-scraping.sh
```

### Manual

```bash
pip install -r requirements.txt
python scrape-escolas-ma.py
```

## 📊 Resultado

O script gera um arquivo `escolas.json` com todas as escolas do Maranhão no formato:

```json
{
  "nome": "Nome da Escola",
  "rede": "municipal|estadual|federal|particular",
  "publica": true|false,
  "uf": "MA",
  "municipio": "Nome do Município"
}
```

## 🔗 Integração

Após o scraping, use os scripts em `../scripts/` para inserir os dados no Supabase:

- `insert-escolas-supabase.py` - Inserção via API
- `insert-escolas-supabase.sql` - Inserção via SQL
