-- ===============================================
-- ATUALIZAÇÃO: NOME_TURMA PARA CODIGO_TURMA
-- ===============================================
-- Script para renomear a coluna nome_turma para codigo_turma
-- e adicionar campos necessários para a nova estrutura
-- Data: 15 de agosto de 2025

-- 1. Renomear a coluna nome_turma para codigo_turma
ALTER TABLE turmas RENAME COLUMN nome_turma TO codigo_turma;

-- 2. Adicionar coluna de descrição (se não existir)
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 3. Adicionar coluna de semestre (se não existir)
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS semestre INTEGER NOT NULL DEFAULT 1 CHECK (semestre IN (1, 2));

-- 4. Adicionar coluna updated_at (se não existir)
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Atualizar o comentário da coluna
COMMENT ON COLUMN turmas.codigo_turma IS 'Código identificador da turma (ex: MS123-2024.1, MD456-2024.2)';
COMMENT ON COLUMN turmas.descricao IS 'Descrição opcional da turma';
COMMENT ON COLUMN turmas.semestre IS 'Semestre letivo: 1 ou 2';

-- 6. Criar índice para o novo campo semestre
CREATE INDEX IF NOT EXISTS idx_turmas_semestre ON turmas(semestre);

-- 7. Criar índice composto para consultas por ano e semestre
CREATE INDEX IF NOT EXISTS idx_turmas_ano_semestre ON turmas(ano_letivo, semestre);

-- 8. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_turmas_updated_at ON turmas;
CREATE TRIGGER update_turmas_updated_at
    BEFORE UPDATE ON turmas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Verificação das alterações
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'turmas' 
        AND column_name = 'codigo_turma'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'SUCCESS: Coluna codigo_turma criada com sucesso!';
    ELSE
        RAISE NOTICE 'ERROR: Falha ao criar coluna codigo_turma';
    END IF;
END $$;

RAISE NOTICE 'Atualização da tabela turmas concluída! ✅';
