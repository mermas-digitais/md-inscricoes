# Sistema de Escolas - Documentação

## Implementação Completa do Sistema de Busca de Escolas

### 1. Scripts SQL Executados

Execute o script `scripts/add-schools-and-field.sql` no Supabase SQL Editor para:

- ✅ Criar a tabela `escolas` com todas as escolas de Imperatriz-MA
- ✅ Adicionar índices para busca otimizada
- ✅ Inserir 144 escolas (municipais, estaduais)
- ✅ Adicionar campo `escola` na tabela `inscricoes`
- ✅ Configurar políticas de segurança (RLS)
- ✅ Permitir acesso público de leitura à tabela escolas

### 2. Funcionalidades Implementadas

#### 2.1 API de Busca de Escolas (`/api/escolas`)

- **Endpoint**: `GET /api/escolas?search=termo&limit=50`
- **Funcionalidade**: Busca escolas por nome (case-insensitive)
- **Parâmetros**:
  - `search`: Termo de busca (opcional)
  - `limit`: Limite de resultados (padrão: 50)

#### 2.2 Componente EscolaSelector

- **Local**: `components/ui/escola-selector.tsx`
- **Funcionalidades**:
  - ✅ Busca em tempo real com debounce (300ms)
  - ✅ Dropdown com resultados da busca
  - ✅ Exibe tipo da escola (Municipal/Estadual) com cores diferentes
  - ✅ Permite digitação livre caso a escola não esteja na lista
  - ✅ Interface responsiva e acessível
  - ✅ Validação de erro integrada
  - ✅ Seleção visual com ícones

#### 2.3 Integração no Formulário de Inscrição

- **Step 4**: Adicionado campo de escola após ano escolar
- **Validação**: Campo obrigatório com Zod schema
- **Resumo**: Exibe escola selecionada no Step 5

### 3. Estrutura do Banco de Dados

#### Tabela `escolas`

```sql
CREATE TABLE escolas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Municipal', 'Estadual', 'Federal', 'Particular')),
  cidade TEXT DEFAULT 'Imperatriz',
  estado TEXT DEFAULT 'MA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Campo adicionado em `inscricoes`

```sql
ALTER TABLE inscricoes ADD COLUMN escola TEXT;
```

### 4. Dados Disponíveis

**Total de Escolas**: 144 instituições de Imperatriz-MA

**Distribuição por Tipo**:

- **Municipal**: 121 escolas (84%)
- **Estadual**: 23 escolas (16%)

**Tipos de Instituições**:

- Creches municipais
- Escolas municipais de educação infantil
- Escolas municipais de ensino fundamental
- Centros de ensino estaduais
- Centros Educa Mais
- Instituto Estadual (IEMA)
- Colégio Militar

### 5. Como Usar

#### Para Administradores:

1. Execute o script SQL no Supabase
2. Verifique se as políticas RLS estão ativas
3. Teste a API de busca: `/api/escolas?search=municipal`

#### Para Usuários:

1. No Step 4 do formulário de inscrição
2. Digite o nome da escola no campo "Escola onde estuda"
3. Selecione da lista ou digite manualmente
4. Continue o processo de inscrição

### 6. Melhorias Futuras

#### Possíveis Expansões:

- [ ] Adicionar mais cidades do Maranhão
- [ ] Incluir escolas particulares
- [ ] Sistema de favoritos/sugestões
- [ ] Validação por geolocalização
- [ ] Cache de busca no cliente
- [ ] Autocomplete mais inteligente

#### Otimizações:

- [ ] Implementar busca full-text com PostgreSQL
- [ ] Cache de API com Redis
- [ ] Paginação para grandes volumes
- [ ] Compressão de dados

### 7. Benefícios da Implementação

✅ **UX Melhorada**: Busca rápida e intuitiva
✅ **Dados Estruturados**: Padronização de nomes de escolas
✅ **Validação**: Reduz erros de digitação
✅ **Escalabilidade**: Fácil adição de novas escolas
✅ **Performance**: Busca otimizada com índices
✅ **Flexibilidade**: Permite escolas não listadas

### 8. Troubleshooting

#### Problemas Comuns:

**Erro 500 na API**:

- Verificar se as políticas RLS estão configuradas
- Confirmar se o usuário `anon` tem permissão SELECT

**Busca não funciona**:

- Verificar se os índices foram criados
- Testar consulta SQL diretamente

**Escola não aparece**:

- Verificar se foi inserida corretamente
- Testar busca com termo mais genérico

#### Logs para Debug:

```javascript
// No componente EscolaSelector
console.log("Buscando escolas:", searchTerm);
console.log("Resultados:", escolas);

// Na API
console.log("Parâmetros de busca:", { search, limit });
console.log("Resultados encontrados:", escolas?.length);
```

### 9. Monitoramento

#### Métricas Importantes:

- Tempo de resposta da API de escolas
- Taxa de uso do campo escola vs digitação livre
- Escolas mais buscadas
- Erros de validação no campo escola

#### Queries Úteis:

```sql
-- Escolas mais escolhidas
SELECT escola, COUNT(*) as total
FROM inscricoes
WHERE escola IS NOT NULL
GROUP BY escola
ORDER BY total DESC;

-- Taxa de preenchimento
SELECT
  COUNT(*) as total_inscricoes,
  COUNT(escola) as com_escola,
  ROUND(COUNT(escola) * 100.0 / COUNT(*), 2) as taxa_preenchimento
FROM inscricoes;
```

---

## Resumo da Implementação

✅ **Completo e Funcional**: Sistema pronto para produção
✅ **Bem Documentado**: Código comentado e documentação detalhada  
✅ **Otimizado**: Busca rápida e interface responsiva
✅ **Flexível**: Permite expansão futura
✅ **Integrado**: Funcionando com o sistema existente

**Status**: 🟢 Pronto para uso
