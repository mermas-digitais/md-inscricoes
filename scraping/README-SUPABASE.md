# Scraping de Escolas para Supabase

Este diretório contém scripts para fazer scraping de escolas do site `escolas.com.br` e enviar os dados diretamente para o Supabase.

## 📋 Pré-requisitos

1. **Python 3.7+** instalado
2. **Credenciais do Supabase** (URL e chave anônima)
3. **Tabela `escolas`** criada no Supabase com a estrutura correta

## 🔧 Configuração

### 1. Instalar dependências

```bash
pip install -r requirements.txt
```

### 2. Configurar credenciais do Supabase

Edite o arquivo `supabase-config.py` e substitua pelos seus valores:

```python
SUPABASE_URL = "https://seu-projeto.supabase.co"
SUPABASE_KEY = "sua-chave-anonima-aqui"
```

### 3. Estrutura da tabela `escolas` no Supabase

A tabela deve ter a seguinte estrutura:

```sql
CREATE TABLE escolas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  rede TEXT NOT NULL CHECK (rede IN ('municipal', 'estadual', 'federal', 'particular')),
  publica BOOLEAN NOT NULL,
  uf TEXT NOT NULL,
  municipio TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🧪 Testando a conexão

Antes de executar o scraping completo, teste a conexão:

```bash
python test-supabase.py
```

## 🚀 Executando o scraping

### Opção 1: Apenas escolas particulares (recomendado para começar)

```bash
python scrape-particulares-supabase.py
```

### Opção 2: Todas as redes (particulares, estaduais, federais, municipais)

```bash
python scrape-to-supabase.py
```

## 📊 O que o script faz

1. **Acessa** as páginas do site `escolas.com.br`
2. **Extrai** informações de cada escola:
   - Nome da escola
   - Rede (particular, estadual, federal, municipal)
   - Se é pública ou não
   - UF (sempre "MA" para Maranhão)
   - Município
3. **Envia** os dados diretamente para o Supabase
4. **Salva backup** em arquivo JSON em caso de erro

## 🔍 Monitoramento

O script mostra em tempo real:

- ✅ Páginas sendo processadas
- ✅ Número de escolas extraídas por página
- ✅ Total de escolas salvas
- ❌ Erros e problemas
- 💾 Backups em caso de falha

## 📁 Arquivos gerados

- `backup-*.json`: Arquivos de backup em caso de erro
- Logs no console com progresso detalhado

## ⚠️ Considerações importantes

1. **Rate limiting**: O script inclui delays de 2 segundos entre requisições
2. **Respeito ao servidor**: Não sobrecarrega o site `escolas.com.br`
3. **Backup automático**: Dados são salvos localmente em caso de erro
4. **Limite de segurança**: Máximo de 50 páginas por tipo de escola

## 🛠️ Solução de problemas

### Erro de conexão com Supabase

- Verifique as credenciais em `supabase-config.py`
- Execute `python test-supabase.py` para diagnosticar

### Erro de inserção no banco

- Verifique se a tabela `escolas` existe
- Verifique se a estrutura da tabela está correta
- Os dados de backup estarão em arquivos `.json`

### Scraping interrompido

- O script pode ser executado novamente
- Ele começará do início (não há checkpoint)
- Dados duplicados serão tratados pelo Supabase

## 📈 Estatísticas esperadas

- **Escolas particulares**: ~1.144 escolas
- **Escolas estaduais**: ~2.000+ escolas
- **Escolas federais**: ~50+ escolas
- **Escolas municipais**: ~3.000+ escolas

**Total estimado**: ~6.000+ escolas do Maranhão
