-- Script para ajustar posições dos campos no certificado
-- IMPORTANTE: Ajuste as coordenadas X,Y conforme seu template

-- Exemplo de como atualizar as posições
-- Substitua os valores X,Y pelas posições corretas no seu template

UPDATE certificados_config 
SET 
    posicoes = '{
        "nome": {"x": 200, "y": 150},
        "cpf": {"x": 200, "y": 180},
        "data": {"x": 200, "y": 210},
        "carga_horaria": {"x": 200, "y": 240}
    }'::jsonb,
    updated_at = NOW()
WHERE ativo = TRUE;

-- Verificar as posições atualizadas
SELECT 
    'Posições Atualizadas' as status,
    posicoes
FROM certificados_config 
WHERE ativo = TRUE;

/*
INSTRUÇÕES PARA AJUSTAR POSIÇÕES:

1. Abra o arquivo A4 - 23.png em um editor de imagem
2. Identifique onde cada campo deve aparecer:
   - Nome da aluna
   - CPF formatado
   - Data de conclusão
   - Carga horária

3. Meça as coordenadas em pixels e converta para mm:
   - 1 pixel ≈ 0.264583 mm (para 96 DPI)
   - Ou use uma ferramenta online de conversão

4. Atualize as coordenadas X,Y no script acima

5. Execute o script para aplicar as mudanças

EXEMPLO DE CONVERSÃO:
- Se o nome deve aparecer a 200px da esquerda e 100px do topo
- X = 200 * 0.264583 = 52.9 mm
- Y = 100 * 0.264583 = 26.5 mm
- Use: {"x": 53, "y": 27}
*/
