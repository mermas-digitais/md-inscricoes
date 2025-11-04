-- Script para atualizar configuração do certificado com o template real
-- Execute este script após fazer upload do template

-- Atualizar a configuração ativa com o template correto
UPDATE certificados_config 
SET 
    template_url = '/assets/certificados/A4 - 23.png',
    updated_at = NOW()
WHERE ativo = TRUE;

-- Verificar se foi atualizado
SELECT 
    id, 
    edicao, 
    template_url, 
    ativo,
    posicoes,
    fontes,
    updated_at
FROM certificados_config 
WHERE ativo = TRUE;

-- Mostrar mensagem de sucesso
SELECT '✅ Configuração atualizada com sucesso!' as status;
SELECT '📝 Próximo passo: Ajustar posições dos campos conforme seu template' as proximo_passo;
