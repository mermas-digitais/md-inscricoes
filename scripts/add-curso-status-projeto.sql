-- ===============================================
-- ADICIONAR CAMPOS STATUS E PROJETO À TABELA CURSOS
-- ===============================================
-- Script para adicionar os campos status e projeto à tabela de cursos
-- Data de criação: 15 de agosto de 2025

-- Adicionar campo status (ativo/inativo)
ALTER TABLE cursos 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo' 
CHECK (status IN ('ativo', 'inativo'));

-- Adicionar campo projeto (Meninas STEM ou Mermãs Digitais)
ALTER TABLE cursos 
ADD COLUMN IF NOT EXISTS projeto TEXT NOT NULL DEFAULT 'Mermãs Digitais' 
CHECK (projeto IN ('Meninas STEM', 'Mermãs Digitais'));

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cursos_status ON cursos(status);
CREATE INDEX IF NOT EXISTS idx_cursos_projeto ON cursos(projeto);

-- Comentários das colunas
COMMENT ON COLUMN cursos.status IS 'Status do curso: ativo ou inativo';
COMMENT ON COLUMN cursos.projeto IS 'Projeto ao qual o curso pertence: Meninas STEM ou Mermãs Digitais';

-- Atualizar cursos existentes (opcional - definir projeto padrão)
-- UPDATE cursos SET projeto = 'Mermãs Digitais' WHERE projeto IS NULL;
-- UPDATE cursos SET status = 'ativo' WHERE status IS NULL;
