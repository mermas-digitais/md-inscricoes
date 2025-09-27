# 🕷️ Scraping de Escolas do Maranhão

Este script extrai dados de escolas do Maranhão do site `escolas.com.br` e gera um arquivo JSON com a estrutura necessária para o banco de dados.

## 📋 Pré-requisitos

- **Python 3.7+** instalado
- **pip** para instalar dependências

## 🚀 Como Executar

### Windows (PowerShell)

```powershell
cd scripts
.\run-scraping.ps1
```

### Linux/Mac (Bash)

```bash
cd scripts
chmod +x run-scraping.sh
./run-scraping.sh
```

### Execução Manual

```bash
cd scripts
pip install -r requirements.txt
python scrape-escolas-ma.py
```

## 📊 Dados Extraídos

O script extrai escolas de 4 categorias:

1. **Escolas Municipais** - `https://escolas.com.br/municipais/ma`
2. **Escolas Estaduais** - `https://escolas.com.br/estaduais/ma`
3. **Escolas Federais** - `https://escolas.com.br/federais/ma`
4. **Escolas Particulares** - `https://escolas.com.br/particulares/ma`

## 📁 Estrutura dos Dados

Cada escola é extraída com a seguinte estrutura:

```json
{
  "nome": "Nome da Escola",
  "rede": "municipal|estadual|federal|particular",
  "publica": true|false,
  "uf": "MA",
  "municipio": "Nome do Município"
}
```

## 📄 Arquivos Gerados

- **`escolas.json`** - Arquivo principal com todos os dados extraídos
- **`escolas.json`** - Substitui o arquivo anterior a cada execução

## 🔧 Dependências

- **beautifulsoup4** - Para parsing HTML
- **requests** - Para requisições HTTP
- **lxml** - Parser XML/HTML rápido

## ⚠️ Considerações

- **Rate Limiting**: O script faz requisições sequenciais para evitar sobrecarregar o servidor
- **Dados Dinâmicos**: O site pode ter mudanças na estrutura, pode ser necessário ajustar o script
- **Municípios**: A extração de municípios usa regex para identificar padrões como "Cidade-MA"

## 🐛 Troubleshooting

### Erro de Conexão

```
requests.exceptions.ConnectionError
```

**Solução**: Verifique sua conexão com a internet

### Erro de Parsing

```
AttributeError: 'NoneType' object has no attribute 'text'
```

**Solução**: O site pode ter mudado a estrutura. Verifique o HTML manualmente

### Erro de Dependências

```
ModuleNotFoundError: No module named 'bs4'
```

**Solução**: Execute `pip install -r requirements.txt`

## 📈 Estatísticas Esperadas

Baseado em execuções anteriores, você pode esperar:

- **Municipais**: ~500-800 escolas
- **Estaduais**: ~200-400 escolas
- **Federais**: ~20-50 escolas
- **Particulares**: ~300-600 escolas

**Total estimado**: 1000-2000 escolas

## 🔄 Próximos Passos

Após o scraping, você pode:

1. **Revisar os dados** no arquivo `escolas.json`
2. **Usar o script de inserção** para popular o Supabase
3. **Validar os municípios** extraídos
4. **Filtrar duplicatas** se necessário
