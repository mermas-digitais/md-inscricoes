-- Script final para corrigir a constraint de unicidade da tabela escolas
-- Permite escolas com o mesmo nome em municípios diferentes

-- 1. Verificar constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'escolas'::regclass 
    AND contype = 'u';

-- 2. Remover TODAS as constraints de unicidade existentes
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS escolas_nome_key;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS unique_escola_nome;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS unique_escola_nome_municipio_uf;

-- 3. Criar nova constraint de unicidade composta (nome + municipio + uf)
-- Isso permite escolas com o mesmo nome em municípios diferentes
ALTER TABLE escolas ADD CONSTRAINT unique_escola_nome_municipio_uf 
    UNIQUE (nome, municipio, uf);

-- 4. Verificar se a alteração foi aplicada
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'escolas'::regclass 
    AND contype = 'u';

-- 5. Verificar dados duplicados que podem causar problemas
SELECT nome, municipio, uf, COUNT(*) as count
FROM escolas 
GROUP BY nome, municipio, uf 
HAVING COUNT(*) > 1
ORDER BY count DESC;
