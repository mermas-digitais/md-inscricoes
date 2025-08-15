-- Script para corrigir as constraints das colunas status e projeto
-- para aceitar valores em minúsculo

-- Primeiro, vamos remover as constraints existentes
ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_status_check;
ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_projeto_check;

-- Atualizar os dados existentes para minúsculo
UPDATE cursos SET status = 'ativo' WHERE status = 'ATIVO';
UPDATE cursos SET status = 'inativo' WHERE status = 'INATIVO';

-- Verificar se ainda existem dados com outros valores
SELECT DISTINCT status FROM cursos;
SELECT DISTINCT projeto FROM cursos;

-- Agora vamos recriar as constraints com valores em minúsculo
ALTER TABLE cursos 
ADD CONSTRAINT cursos_status_check 
CHECK (status IN ('ativo', 'inativo'));

ALTER TABLE cursos 
ADD CONSTRAINT cursos_projeto_check 
CHECK (projeto IN ('Meninas STEM', 'Mermãs Digitais'));

-- Verificar se as constraints foram criadas corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'cursos'::regclass 
AND conname IN ('cursos_status_check', 'cursos_projeto_check');
