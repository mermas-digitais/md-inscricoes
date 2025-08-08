-- Script para testar a lógica de excedente
-- ATENÇÃO: Este é apenas um script de teste, não execute em produção

-- Simular 50 inscrições para o curso "Jogos"
-- (Este é apenas um exemplo da lógica, não execute este INSERT)


-- Exemplo de como a lógica funciona:
-- 1. Verificar quantas inscrições existem para o curso
SELECT COUNT(*) FROM inscricoes 
WHERE curso = 'Jogos' 
AND status IN ('INSCRITA', 'MATRICULADA');

-- 2. Se o resultado for >= 50, a nova inscrição recebe status 'EXCEDENTE'
-- 3. Se o resultado for < 50, a nova inscrição recebe status 'INSCRITA'

-- Exemplo de consulta para ver distribuição de status por curso:
SELECT 
  curso,
  status,
  COUNT(*) as quantidade
FROM inscricoes 
GROUP BY curso, status 
ORDER BY curso, status;

-- Ver apenas vagas ocupadas (INSCRITA + MATRICULADA) por curso:
SELECT 
  curso,
  COUNT(*) as vagas_ocupadas,
  (50 - COUNT(*)) as vagas_restantes
FROM inscricoes 
WHERE status IN ('INSCRITA', 'MATRICULADA')
GROUP BY curso;

