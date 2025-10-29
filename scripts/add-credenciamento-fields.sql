-- Adicionar coluna orientador_presente na tabela inscricoes_eventos
ALTER TABLE inscricoes_eventos
ADD COLUMN orientador_presente BOOLEAN DEFAULT FALSE;

-- Adicionar coluna presente na tabela participantes_eventos
ALTER TABLE participantes_eventos
ADD COLUMN presente BOOLEAN DEFAULT FALSE;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'inscricoes_eventos' 
AND column_name = 'orientador_presente';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'participantes_eventos' 
AND column_name = 'presente';