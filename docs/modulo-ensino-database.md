# 📚 Módulo de Ensino - Documentação do Banco de Dados

## 🎯 Visão Geral

O **Módulo de Ensino** é uma expansão do sistema de inscrições que permite o gerenciamento completo de cursos, turmas, aulas e frequência. Mantém total compatibilidade com as tabelas existentes (`inscricoes`, `monitores`, `escolas`).

## 📊 Diagrama de Relacionamentos

```
cursos (1) ─── (N) turmas
                    │
                    ├── (N) turmas_monitores (N) ─── monitores
                    │
                    ├── (N) turmas_alunas (N) ─── inscricoes
                    │
                    └── (1) ─── (N) aulas
                                     │
                                     └── (1) ─── (N) frequencia (N) ─── inscricoes
```

## 🗃️ Estrutura das Tabelas

### 1. **cursos**

Armazena informações dos cursos oferecidos.

| Campo           | Tipo        | Restrições | Descrição                                |
| --------------- | ----------- | ---------- | ---------------------------------------- |
| `id`            | UUID        | PK, auto   | Identificador único                      |
| `nome_curso`    | TEXT        | NOT NULL   | Nome do curso                            |
| `descricao`     | TEXT        | -          | Descrição detalhada                      |
| `carga_horaria` | INTEGER     | -          | Horas totais do curso                    |
| `publico_alvo`  | TEXT        | CHECK      | 'Ensino Fundamental 2' ou 'Ensino Médio' |
| `created_at`    | TIMESTAMPTZ | auto       | Data de criação                          |

### 2. **turmas**

Representa uma turma específica de um curso em um período.

| Campo        | Tipo        | Restrições   | Descrição                                         |
| ------------ | ----------- | ------------ | ------------------------------------------------- |
| `id`         | UUID        | PK, auto     | Identificador único                               |
| `curso_id`   | UUID        | FK, NOT NULL | Referência ao curso                               |
| `nome_turma` | TEXT        | NOT NULL     | Nome identificador da turma                       |
| `ano_letivo` | INTEGER     | NOT NULL     | Ano letivo                                        |
| `status`     | TEXT        | CHECK        | 'Planejamento', 'Ativa', 'Concluída', 'Cancelada' |
| `created_at` | TIMESTAMPTZ | auto         | Data de criação                                   |

### 3. **turmas_monitores** (N:N)

Relacionamento entre turmas e monitores.

| Campo        | Tipo        | Restrições | Descrição          |
| ------------ | ----------- | ---------- | ------------------ |
| `turma_id`   | UUID        | PK, FK     | ID da turma        |
| `monitor_id` | UUID        | PK, FK     | ID do monitor      |
| `created_at` | TIMESTAMPTZ | auto       | Data de vinculação |

### 4. **turmas_alunas** (N:N)

Relacionamento entre turmas e alunas (inscrições).

| Campo        | Tipo        | Restrições | Descrição               |
| ------------ | ----------- | ---------- | ----------------------- |
| `turma_id`   | UUID        | PK, FK     | ID da turma             |
| `aluna_id`   | UUID        | PK, FK     | ID da aluna (inscrição) |
| `created_at` | TIMESTAMPTZ | auto       | Data de matrícula       |

### 5. **aulas**

Registra cada aula ministrada em uma turma.

| Campo                 | Tipo        | Restrições   | Descrição           |
| --------------------- | ----------- | ------------ | ------------------- |
| `id`                  | UUID        | PK, auto     | Identificador único |
| `turma_id`            | UUID        | FK, NOT NULL | Referência à turma  |
| `data_aula`           | DATE        | NOT NULL     | Data da aula        |
| `conteudo_ministrado` | TEXT        | -            | Conteúdo abordado   |
| `created_at`          | TIMESTAMPTZ | auto         | Data de criação     |

### 6. **frequencia**

Registra a presença de cada aluna em cada aula.

| Campo        | Tipo        | Restrições               | Descrição          |
| ------------ | ----------- | ------------------------ | ------------------ |
| `aula_id`    | UUID        | PK, FK                   | ID da aula         |
| `aluna_id`   | UUID        | PK, FK                   | ID da aluna        |
| `presente`   | BOOLEAN     | NOT NULL, default: false | Status de presença |
| `created_at` | TIMESTAMPTZ | auto                     | Data de registro   |

## 🔍 Relacionamentos Detalhados

### **1:N (Um para Muitos)**

- **cursos → turmas**: Um curso pode ter várias turmas
- **turmas → aulas**: Uma turma pode ter várias aulas
- **aulas → frequencia**: Uma aula pode ter vários registros de frequência

### **N:N (Muitos para Muitos)**

- **turmas ↔ monitores**: Uma turma pode ter vários monitores, um monitor pode estar em várias turmas
- **turmas ↔ alunas**: Uma turma pode ter várias alunas, uma aluna pode estar em várias turmas
- **aulas ↔ alunas** (via frequencia): Uma aula registra frequência de várias alunas

## 📈 Casos de Uso Principais

### **Gestão de Cursos**

- Criar/editar cursos com diferentes públicos-alvo
- Definir carga horária e descrição
- Categorizar por nível de ensino

### **Administração de Turmas**

- Criar turmas para cursos específicos
- Controlar status (Planejamento → Ativa → Concluída)
- Associar monitores e matricular alunas

### **Controle de Aulas**

- Registrar aulas ministradas
- Documentar conteúdo abordado
- Manter histórico cronológico

### **Gestão de Frequência**

- Marcar presença/ausência por aula
- Calcular percentuais de frequência
- Gerar relatórios de aproveitamento

## 🚀 Queries Comuns

### **Listar turmas ativas com estatísticas**

```sql
SELECT
    t.nome_turma,
    c.nome_curso,
    COUNT(DISTINCT ta.aluna_id) as total_alunas,
    COUNT(DISTINCT a.id) as total_aulas
FROM turmas t
JOIN cursos c ON t.curso_id = c.id
LEFT JOIN turmas_alunas ta ON t.id = ta.turma_id
LEFT JOIN aulas a ON t.id = a.turma_id
WHERE t.status = 'Ativa'
GROUP BY t.id, t.nome_turma, c.nome_curso;
```

### **Calcular frequência de uma aluna**

```sql
SELECT
    i.nome,
    COUNT(f.aula_id) as total_aulas,
    COUNT(CASE WHEN f.presente = true THEN 1 END) as presentes,
    ROUND(
        (COUNT(CASE WHEN f.presente = true THEN 1 END) * 100.0) /
        COUNT(f.aula_id), 2
    ) as percentual_presenca
FROM inscricoes i
JOIN frequencia f ON i.id = f.aluna_id
JOIN aulas a ON f.aula_id = a.id
WHERE a.turma_id = 'UUID_DA_TURMA'
GROUP BY i.id, i.nome;
```

## 🛡️ Integridade e Segurança

### **Constraints Implementadas**

- ✅ **Chaves primárias** em todas as tabelas
- ✅ **Chaves estrangeiras** com CASCADE delete
- ✅ **CHECK constraints** para valores válidos
- ✅ **NOT NULL** em campos obrigatórios

### **Índices para Performance**

- ✅ Índices em chaves estrangeiras
- ✅ Índices em campos de busca frequente
- ✅ Índices compostos para queries complexas

### **Padrões de Nomenclatura**

- 📝 **Tabelas**: plural, minúsculo, underscore
- 📝 **Campos**: descritivo, underscore
- 📝 **PKs**: sempre `id` UUID
- 📝 **FKs**: `{tabela}_id`

## 📋 Próximos Passos

### **Implementação**

1. ✅ Executar `create-modulo-ensino-tables.sql`
2. ⏳ Criar APIs REST para cada entidade
3. ⏳ Desenvolver interfaces de usuário
4. ⏳ Implementar relatórios e dashboards

### **Funcionalidades Futuras**

- 📊 Dashboard de estatísticas
- 📧 Notificações de baixa frequência
- 📄 Exportação de relatórios
- 🔔 Lembretes de aulas
- 📱 App mobile para monitores

## 📞 Suporte

Para dúvidas sobre a estrutura do banco de dados ou implementação das queries, consulte:

- `scripts/create-modulo-ensino-tables.sql` - Script de criação
- `scripts/modulo-ensino-queries.sql` - Exemplos de uso
- Esta documentação para referência conceitual

---

_Documentação criada em 14 de agosto de 2025_
