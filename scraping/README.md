# 🏫 Scraping de Escolas Federais do Maranhão

Este diretório contém scripts para fazer scraping das escolas federais do Maranhão.

## 📁 Arquivos

- `scrape-federais-ma-json.py` - Script principal de scraping que salva em JSON
- `escolas_federais_ma.json` - Arquivo JSON com as 30 escolas federais coletadas
- `README-FEDERAIIS.md` - Documentação detalhada do processo
- `requirements.txt` - Dependências Python necessárias

## 🎯 Objetivo

Fazer scraping das escolas federais do Maranhão da URL `https://escolas.com.br/federais/ma/` e salvar os dados em formato JSON.

## 🚀 Como Usar

### Execução Manual

```bash
cd scraping
pip install requests beautifulsoup4
python scrape-federais-ma-json.py
```

## 📊 Resultados

- **30 escolas federais** encontradas no Maranhão
- **Dados coletados**: Nome, rede (federal), município, UF (MA)
- **Arquivo JSON gerado**: `escolas_federais_ma.json`

## 🏫 Escolas Incluídas

- **Escola Caminho das Estrelas** (Alcântara-MA)
- **29 campi do IFMA** (Instituto Federal do Maranhão) distribuídos por todo o estado

## ✅ Status

- ✅ Scraping concluído com sucesso
- ✅ 30 escolas federais coletadas
- ✅ Dados salvos em JSON
- ✅ Escolas já enviadas para o Supabase

## 📝 Dependências

- `requests` - Para fazer requisições HTTP
- `beautifulsoup4` - Para parsing HTML

## 🎯 Vantagens

- **Foco**: Apenas escolas federais do Maranhão
- **Eficiência**: Scraping rápido e direto
- **Simplicidade**: Script único e objetivo
- **Confiabilidade**: Dados limpos e estruturados
