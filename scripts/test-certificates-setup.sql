-- Script de teste para verificar se o sistema de certificados está funcionando
-- Execute este script para testar a configuração

-- 1. Verificar se a configuração está ativa
SELECT 
    'Configuração Ativa' as teste,
    edicao,
    template_url,
    ativo
FROM certificados_config 
WHERE ativo = TRUE;

-- 2. Verificar se os campos foram adicionados na tabela inscricoes
SELECT 
    'Campos Adicionados' as teste,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'inscricoes' 
AND column_name IN ('data_conclusao', 'certificado_enviado', 'certificado_enviado_em');

-- 3. Verificar se existem alunas para teste
SELECT 
    'Alunas Disponíveis' as teste,
    COUNT(*) as total_alunas,
    COUNT(CASE WHEN status = 'MATRICULADA' THEN 1 END) as matriculadas
FROM inscricoes;

-- 4. Mostrar algumas alunas para teste
SELECT 
    'Alunas para Teste' as teste,
    id,
    nome,
    email,
    curso,
    status
FROM inscricoes 
LIMIT 5;

-- 5. Verificar configuração de posições
SELECT 
    'Posições Configuradas' as teste,
    posicoes->>'nome' as posicao_nome,
    posicoes->>'cpf' as posicao_cpf,
    posicoes->>'data' as posicao_data,
    posicoes->>'carga_horaria' as posicao_carga_horaria
FROM certificados_config 
WHERE ativo = TRUE;
