-- ===============================================
-- MÓDULO DE ENSINO - NOVAS TABELAS
-- ===============================================
-- Script para criar as tabelas do novo Módulo de Ensino
-- Mantém compatibilidade com tabelas existentes (inscricoes, monitores, escolas)
-- Data de criação: 14 de agosto de 2025

-- ===============================================
-- 1. TABELA CURSOS
-- ===============================================
-- Armazena informações dos cursos oferecidos
CREATE TABLE IF NOT EXISTS cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_curso TEXT NOT NULL,
    descricao TEXT,
    carga_horaria INTEGER,
    publico_alvo TEXT CHECK (publico_alvo IN ('Ensino Fundamental 2', 'Ensino Médio')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cursos_publico_alvo ON cursos(publico_alvo);
CREATE INDEX IF NOT EXISTS idx_cursos_created_at ON cursos(created_at);

-- ===============================================
-- 2. TABELA TURMAS
-- ===============================================
-- Representa uma turma específica de um curso em um período
CREATE TABLE IF NOT EXISTS turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    nome_turma TEXT NOT NULL,
    ano_letivo INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Planejamento' CHECK (status IN ('Planejamento', 'Ativa', 'Concluída', 'Cancelada')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_turmas_curso_id ON turmas(curso_id);
CREATE INDEX IF NOT EXISTS idx_turmas_ano_letivo ON turmas(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_turmas_status ON turmas(status);
CREATE INDEX IF NOT EXISTS idx_turmas_created_at ON turmas(created_at);

-- ===============================================
-- 3. TABELA DE ASSOCIAÇÃO TURMAS_MONITORES
-- ===============================================
-- Relacionamento Muitos-para-Muitos: Monitores podem estar em várias turmas
CREATE TABLE IF NOT EXISTS turmas_monitores (
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    monitor_id UUID NOT NULL REFERENCES monitores(id) ON DELETE CASCADE,
    PRIMARY KEY (turma_id, monitor_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_turmas_monitores_turma_id ON turmas_monitores(turma_id);
CREATE INDEX IF NOT EXISTS idx_turmas_monitores_monitor_id ON turmas_monitores(monitor_id);

-- ===============================================
-- 4. TABELA DE ASSOCIAÇÃO TURMAS_ALUNAS
-- ===============================================
-- Relacionamento Muitos-para-Muitos: Alunas podem estar em várias turmas
CREATE TABLE IF NOT EXISTS turmas_alunas (
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    aluna_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
    PRIMARY KEY (turma_id, aluna_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_turmas_alunas_turma_id ON turmas_alunas(turma_id);
CREATE INDEX IF NOT EXISTS idx_turmas_alunas_aluna_id ON turmas_alunas(aluna_id);

-- ===============================================
-- 5. TABELA AULAS
-- ===============================================
-- Registra cada aula de uma turma
CREATE TABLE IF NOT EXISTS aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    data_aula DATE NOT NULL,
    conteudo_ministrado TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_aulas_turma_id ON aulas(turma_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data_aula ON aulas(data_aula);
CREATE INDEX IF NOT EXISTS idx_aulas_created_at ON aulas(created_at);

-- Índice composto para consultas por turma e data
CREATE INDEX IF NOT EXISTS idx_aulas_turma_data ON aulas(turma_id, data_aula);

-- ===============================================
-- 6. TABELA FREQUENCIA
-- ===============================================
-- Registra a presença de cada aluna em cada aula
CREATE TABLE IF NOT EXISTS frequencia (
    aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
    aluna_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (aula_id, aluna_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_frequencia_aula_id ON frequencia(aula_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_aluna_id ON frequencia(aluna_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_presente ON frequencia(presente);

-- ===============================================
-- COMENTÁRIOS DAS TABELAS PARA DOCUMENTAÇÃO
-- ===============================================

COMMENT ON TABLE cursos IS 'Armazena informações dos cursos oferecidos no Módulo de Ensino';
COMMENT ON COLUMN cursos.nome_curso IS 'Nome do curso (ex: Robótica, Programação)';
COMMENT ON COLUMN cursos.publico_alvo IS 'Público alvo: Ensino Fundamental 2 ou Ensino Médio';

COMMENT ON TABLE turmas IS 'Representa uma turma específica de um curso em um período letivo';
COMMENT ON COLUMN turmas.nome_turma IS 'Nome identificador da turma (ex: Robótica 2024 - Turma A)';
COMMENT ON COLUMN turmas.status IS 'Status da turma: Planejamento, Ativa, Concluída ou Cancelada';

COMMENT ON TABLE turmas_monitores IS 'Relacionamento N:N entre turmas e monitores';
COMMENT ON TABLE turmas_alunas IS 'Relacionamento N:N entre turmas e alunas (inscrições)';

COMMENT ON TABLE aulas IS 'Registra cada aula ministrada em uma turma';
COMMENT ON COLUMN aulas.data_aula IS 'Data em que a aula foi ministrada';
COMMENT ON COLUMN aulas.conteudo_ministrado IS 'Descrição do conteúdo abordado na aula';

COMMENT ON TABLE frequencia IS 'Registra a presença de cada aluna em cada aula';
COMMENT ON COLUMN frequencia.presente IS 'Indica se a aluna esteve presente na aula';

-- ===============================================
-- VERIFICAÇÃO DE INTEGRIDADE
-- ===============================================

-- Função para verificar se as tabelas foram criadas corretamente
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('cursos', 'turmas', 'turmas_monitores', 'turmas_alunas', 'aulas', 'frequencia');
    
    IF table_count = 6 THEN
        RAISE NOTICE 'SUCCESS: Todas as 6 tabelas do Módulo de Ensino foram criadas com sucesso!';
    ELSE
        RAISE NOTICE 'WARNING: Apenas % de 6 tabelas foram criadas.', table_count;
    END IF;
END $$;

-- ===============================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ===============================================

-- Inserir cursos de exemplo
INSERT INTO cursos (nome_curso, descricao, carga_horaria, publico_alvo) VALUES
('Robótica Educacional', 'Curso de introdução à robótica com foco educacional', 40, 'Ensino Fundamental 2'),
('Programação Básica', 'Fundamentos de programação e lógica', 60, 'Ensino Médio'),
('Jogos Digitais', 'Desenvolvimento de jogos simples', 50, 'Ensino Médio')
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Módulo de Ensino configurado com sucesso! 🎓';
