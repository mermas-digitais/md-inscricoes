-- Script para corrigir as constraints das tabelas para MDX25
-- 1. Corrigir constraint de gênero na tabela orientadores
-- 2. Corrigir constraint de status na tabela inscricoes_eventos

-- ============================================
-- 1. CORRIGIR CONSTRAINT DE GÊNERO (orientadores)
-- ============================================

-- Remover a constraint antiga
ALTER TABLE orientadores DROP CONSTRAINT IF EXISTS orientadores_genero_check;

-- Adicionar nova constraint com os valores corretos
ALTER TABLE orientadores ADD CONSTRAINT orientadores_genero_check 
CHECK (genero IN (
    'feminino',
    'masculino', 
    'nao-binario',
    'transgenero',
    'outro',
    'prefiro_nao_informar'
));

-- ============================================
-- 2. CORRIGIR CONSTRAINT DE STATUS (inscricoes_eventos)
-- ============================================

-- Remover a constraint antiga
ALTER TABLE inscricoes_eventos DROP CONSTRAINT IF EXISTS inscricoes_eventos_status_check;

-- Adicionar nova constraint com os valores corretos
ALTER TABLE inscricoes_eventos ADD CONSTRAINT inscricoes_eventos_status_check 
CHECK (status IN (
    'PENDENTE',
    'APROVADA',
    'REJEITADA',
    'CANCELADA',
    'INSCRITA',
    'EXCEDENTE'
));

-- ============================================
-- 3. VERIFICAR SE AS CONSTRAINTS FORAM APLICADAS
-- ============================================

-- Verificar constraint de gênero
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'orientadores_genero_check';

-- Verificar constraint de status
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'inscricoes_eventos_status_check';
