-- Script para adicionar o status "EXCEDENTE" ao banco de dados
-- Este script deve ser executado no Supabase SQL Editor

-- Remover a constraint existente
ALTER TABLE inscricoes DROP CONSTRAINT IF EXISTS inscricoes_status_check;

-- Adicionar nova constraint com o status EXCEDENTE
ALTER TABLE inscricoes ADD CONSTRAINT inscricoes_status_check 
CHECK (status IN ('INSCRITA', 'MATRICULADA', 'CANCELADA', 'EXCEDENTE'));

-- Verificar se a constraint foi adicionada corretamente
SELECT 
    tc.constraint_name, 
    cc.check_clause,
    tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'inscricoes' 
    AND tc.constraint_type = 'CHECK' 
    AND tc.constraint_name = 'inscricoes_status_check';
