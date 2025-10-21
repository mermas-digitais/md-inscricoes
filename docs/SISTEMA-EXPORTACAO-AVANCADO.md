# 📊 Sistema Avançado de Exportação de Dados - MDX25

## 🎯 Visão Geral

Sistema completo de exportação de dados de eventos com **modal configurável**, **múltiplos formatos** e **opções avançadas** de filtragem e agrupamento.

---

## 🚀 Funcionalidades Implementadas

### 1. **Modal de Configuração de Exportação**

- ✅ Interface com 3 abas (Campos, Formato, Opções)
- ✅ Seleção granular de campos por categoria
- ✅ Preview de quantos registros serão exportados
- ✅ Design responsivo e intuitivo

### 2. **Campos Exportáveis (17 campos disponíveis)**

#### 👥 **Equipe**

- Nome da Equipe
- Modalidade

#### 🎓 **Orientador**

- Nome do Orientador
- Email do Orientador
- Telefone do Orientador
- Escola do Orientador

#### 👤 **Participantes**

- Total de Participantes
- Nomes dos Participantes (lista separada por `;`)
- CPFs dos Participantes (lista separada por `;`)
- Gêneros dos Participantes (lista separada por `;`)
- Idades dos Participantes (calculadas automaticamente)
- Total de Ouvintes
- Total de Competidores

#### 📊 **Status**

- Status da Inscrição
- Observações

#### 📅 **Metadados**

- Data de Inscrição
- ID da Inscrição

---

## 📁 Formatos de Exportação

### 1. **CSV (Comma Separated Values)**

- ✅ Formato universal
- ✅ Compatível com Excel, Google Sheets
- ✅ Leve e rápido
- ✅ Encoding UTF-8 com BOM
- ✅ Aspas duplas para valores com vírgula

**Arquivos gerados:**

- `{EventoNome}_inscricoes_{Data}.csv` - Dados principais
- `{EventoNome}_participantes_{Data}.csv` - Detalhes dos participantes (opcional)

### 2. **Excel (XLSX)**

- ✅ Múltiplas abas/planilhas
- ✅ Formatação profissional
- ✅ Largura de colunas automática
- ✅ 4 abas incluídas:
  1. **Inscrições** - Dados principais configurados
  2. **Resumo** - Estatísticas gerais (opcional)
  3. **Participantes** - Lista detalhada de todos os participantes (opcional)
  4. **Por Modalidade** - Distribuição e métricas por modalidade

**Arquivo gerado:**

- `{EventoNome}_completo_{Data}.xlsx`

### 3. **PDF (Portable Document Format)**

- ✅ Documento profissional formatado
- ✅ Pronto para impressão
- ✅ Layout landscape (horizontal)
- ✅ Tabela com formatação em grid
- ✅ Cabeçalho com nome do evento
- ✅ Data/hora de geração
- ✅ Resumo estatístico (opcional)

**Arquivo gerado:**

- `{EventoNome}_relatorio_{Data}.pdf`

---

## ⚙️ Opções Avançadas

### **1. Filtrar Dados**

- **Exportar apenas registros filtrados**: Exporta somente os dados visíveis após aplicação de filtros de busca/status/modalidade
- **Exportar todos os registros**: Ignora filtros e exporta tudo

### **2. Agrupamento**

Agrupa os dados por:

- ✅ **Nenhum** - Ordem padrão
- ✅ **Modalidade** - Agrupa inscrições por modalidade (JOGOS, ROBOTICA, OUVINTE)
- ✅ **Status** - Agrupa por status (INSCRITA, APROVADA, REJEITADA, etc.)
- ✅ **Escola** - Agrupa por escola do orientador

Quando agrupado, adiciona uma coluna "Grupo" no início.

### **3. Incluir Resumo Estatístico**

Adiciona seção extra com:

- Total de Inscrições
- Total de Participantes
- Média de Participantes por Equipe
- Distribuição por Modalidade
- Distribuição por Status
- Top 10 Escolas (Excel apenas)

### **4. Planilha/Arquivo Separado para Participantes**

Gera arquivo adicional com uma linha por participante contendo:

- Nome da Equipe
- Modalidade
- Status
- Nome do Participante
- CPF
- Data de Nascimento
- Gênero
- Idade (calculada)
- Tipo (Ouvinte/Competidor)
- Dados do Orientador
- Escola

---

## 📊 Dados Estatísticos Adicionais (Excel)

### **Aba: Resumo**

```
Métrica                              | Valor
-------------------------------------|--------
Total de Inscrições                  | 45
Total de Participantes               | 180
Média de Participantes por Equipe    | 4.00
Total de Escolas Únicas              | 12

DISTRIBUIÇÃO POR MODALIDADE
JOGOS                                | 25
ROBOTICA                             | 15
OUVINTE                              | 5

DISTRIBUIÇÃO POR STATUS
INSCRITA                             | 30
APROVADA                             | 10
EXCEDENTE                            | 5

TOP 10 ESCOLAS
IFMA Campus São Luís Monte Castelo   | 8
Colégio Universitário - UFMA         | 6
...
```

### **Aba: Por Modalidade**

```
Modalidade | Inscrições | Participantes | Média/Equipe | Escolas | Ouvintes | Competidores
-----------|------------|---------------|--------------|---------|----------|-------------
JOGOS      | 25         | 100           | 4.00         | 8       | 0        | 100
ROBOTICA   | 15         | 60            | 4.00         | 6       | 0        | 60
OUVINTE    | 5          | 20            | 4.00         | 4       | 20       | 0
```

---

## 🎨 Interface do Modal

### **Aba 1: Campos**

- **Seleção por categoria** com ícones:
  - 👥 Dados da Equipe
  - 🎓 Dados do Orientador
  - 👤 Dados dos Participantes
  - 📊 Status e Observações
  - 📅 Metadados
- **Badge** mostrando quantos campos de cada categoria estão selecionados
- **Botões rápidos**: "Todos" e "Nenhum"
- **Contador** de campos selecionados

### **Aba 2: Formato**

Cards visuais para cada formato com:

- Ícone colorido (verde/azul/vermelho)
- Descrição detalhada
- Tags de características (Leve, Universal, Formatado, etc.)

### **Aba 3: Opções**

Checkboxes e Radio buttons para:

- Escolha entre dados filtrados ou todos
- Seleção de agrupamento
- Inclusão de resumo
- Planilha separada de participantes

---

## 🔧 Uso

```tsx
// No componente da página de eventos
import { ExportModal } from "@/components/export-modal";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils";

// Estados
const [showExportModal, setShowExportModal] = useState(false);

// Handler do modal
const handleExport = async (config: ExportConfig) => {
  const dataToExport = config.includeFiltered ? filteredInscricoes : inscricoes;

  switch (config.format) {
    case "csv":
      exportToCSV(dataToExport, config, evento.nome);
      break;
    case "excel":
      await exportToExcel(dataToExport, config, evento.nome);
      break;
    case "pdf":
      await exportToPDF(dataToExport, config, evento.nome);
      break;
  }
};

// Botão de exportação
<Button onClick={() => setShowExportModal(true)}>
  <FileDown className="w-4 h-4 mr-2" />
  Exportar
</Button>

// Modal
<ExportModal
  open={showExportModal}
  onOpenChange={setShowExportModal}
  evento={{ id: evento.id, nome: evento.nome }}
  inscricoes={inscricoes}
  filteredInscricoes={filteredInscricoes}
  onExport={handleExport}
/>
```

---

## 📦 Dependências Instaladas

```bash
yarn add xlsx jspdf jspdf-autotable
```

- **xlsx** (v0.18.5) - Geração de arquivos Excel
- **jspdf** (v3.0.3) - Geração de PDFs
- **jspdf-autotable** (v5.0.2) - Tabelas automáticas em PDFs

---

## 🎯 Casos de Uso

### **Caso 1: Relatório Completo para Impressão**

1. Abrir modal de exportação
2. Aba "Campos": Selecionar todos
3. Aba "Formato": PDF
4. Aba "Opções":
   - ✅ Exportar apenas filtrados: NÃO
   - ✅ Incluir resumo: SIM
5. Exportar → Gera PDF profissional com todas as inscrições

### **Caso 2: Planilha para Análise Detalhada**

1. Abrir modal
2. Aba "Campos": Selecionar campos de orientador + participantes
3. Aba "Formato": Excel
4. Aba "Opções":
   - ✅ Agrupar por: Modalidade
   - ✅ Incluir resumo: SIM
   - ✅ Planilha separada: SIM
5. Exportar → Gera Excel com 4 abas + análises

### **Caso 3: Lista Rápida de Contatos**

1. Filtrar por status "APROVADA"
2. Abrir modal
3. Aba "Campos": Nome Equipe, Orientador (Nome, Email, Telefone)
4. Aba "Formato": CSV
5. Aba "Opções":
   - ✅ Exportar apenas filtrados: SIM
6. Exportar → CSV simples para importar em sistema de email

### **Caso 4: Certificados por Participante**

1. Abrir modal
2. Aba "Campos": Dados dos Participantes completos
3. Aba "Formato": Excel
4. Aba "Opções":
   - ✅ Planilha separada de participantes: SIM
5. Exportar → Excel com aba "Participantes" para mail merge

---

## 🔍 Detalhes Técnicos

### **Segurança**

- ✅ Escapamento de caracteres especiais em CSV
- ✅ Aspas duplas para valores com vírgula
- ✅ UTF-8 BOM para acentuação correta

### **Performance**

- ✅ Importação dinâmica de bibliotecas pesadas (xlsx, jspdf)
- ✅ Processamento assíncrono
- ✅ Feedback visual durante exportação

### **Flexibilidade**

- ✅ Sistema modular e extensível
- ✅ Fácil adicionar novos campos em `EXPORT_FIELDS`
- ✅ Configuração por objeto TypeScript tipado

### **UX/UI**

- ✅ Modal responsivo
- ✅ Validação de campos selecionados
- ✅ Preview de quantidade de dados
- ✅ Toasts informativos
- ✅ Disabled state quando não há dados

---

## 📝 Próximas Melhorias Sugeridas

1. **Agendamento de Exportações**

   - Exportação automática diária/semanal
   - Envio por email

2. **Templates Personalizados**

   - Salvar configurações favoritas
   - Compartilhar templates entre usuários

3. **Exportação em Lote**

   - Exportar múltiplos eventos de uma vez
   - Comparação entre eventos

4. **Gráficos no PDF/Excel**

   - Gráficos de pizza para distribuições
   - Gráficos de barras para comparações

5. **Exportação para Google Sheets**
   - Integração direta com API do Google
   - Atualização automática

---

## ✅ Status da Implementação

- ✅ Modal de exportação criado
- ✅ 17 campos exportáveis configurados
- ✅ 3 formatos suportados (CSV, Excel, PDF)
- ✅ Filtros e agrupamentos funcionais
- ✅ Resumos estatísticos implementados
- ✅ Planilhas separadas para participantes
- ✅ Integração completa na página de eventos
- ✅ Zero erros de compilação
- ✅ Dependências instaladas

**Pronto para uso em produção!** 🎉
