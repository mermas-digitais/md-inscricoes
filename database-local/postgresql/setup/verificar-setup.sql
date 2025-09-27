-- SCRIPT DE VERIFICAÇÃO COMPLETA DO SETUP
-- ===============================================
-- Execute este script para verificar se o setup
-- está funcionando corretamente

-- ===============================================
-- 1. VERIFICAR TABELAS CRIADAS
-- ===============================================

SELECT 
    'TABELAS CRIADAS' as verificacao,
    COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Listar todas as tabelas
SELECT 
    table_name as tabela,
    CASE 
        WHEN table_name IN ('inscricoes', 'monitores', 'escolas', 'verification_codes', 'cursos', 'turmas', 'turmas_monitores', 'turmas_alunas', 'aulas', 'frequencia', 'modulos', 'materiais_aula') 
        THEN 'Sistema Original'
        WHEN table_name IN ('eventos', 'orientadores', 'modalidades', 'inscricoes_eventos', 'participantes_eventos')
        THEN 'Sistema de Eventos'
        ELSE 'Outras'
    END as categoria
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY categoria, table_name;

-- ===============================================
-- 2. VERIFICAR DADOS MIGRADOS
-- ===============================================

SELECT 'DADOS MIGRADOS' as verificacao;

-- Contar registros em cada tabela principal
SELECT 
    'inscricoes' as tabela, 
    COUNT(*) as registros 
FROM inscricoes
UNION ALL
SELECT 'monitores', COUNT(*) FROM monitores
UNION ALL
SELECT 'escolas', COUNT(*) FROM escolas
UNION ALL
SELECT 'verification_codes', COUNT(*) FROM verification_codes
UNION ALL
SELECT 'cursos', COUNT(*) FROM cursos
UNION ALL
SELECT 'turmas', COUNT(*) FROM turmas
UNION ALL
SELECT 'turmas_monitores', COUNT(*) FROM turmas_monitores
UNION ALL
SELECT 'turmas_alunas', COUNT(*) FROM turmas_alunas
UNION ALL
SELECT 'aulas', COUNT(*) FROM aulas
UNION ALL
SELECT 'frequencia', COUNT(*) FROM frequencia
ORDER BY tabela;

-- ===============================================
-- 3. VERIFICAR CONSTRAINTS E ÍNDICES
-- ===============================================

SELECT 'CONSTRAINTS E ÍNDICES' as verificacao;

-- Verificar constraints de chave primária
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ===============================================
-- 4. VERIFICAR FUNÇÕES E TRIGGERS
-- ===============================================

SELECT 'FUNÇÕES E TRIGGERS' as verificacao;

-- Verificar funções criadas
SELECT 
    routine_name as funcao,
    routine_type as tipo
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Verificar triggers criados
SELECT 
    trigger_name as trigger,
    event_object_table as tabela,
    action_timing as timing,
    event_manipulation as evento
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ===============================================
-- 5. VERIFICAR RELACIONAMENTOS (FOREIGN KEYS)
-- ===============================================

SELECT 'RELACIONAMENTOS' as verificacao;

-- Verificar foreign keys
SELECT 
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_name AS tabela_destino,
    ccu.column_name AS coluna_destino
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ===============================================
-- 6. VERIFICAR EXTENSÕES
-- ===============================================

SELECT 'EXTENSÕES' as verificacao;

-- Verificar extensões instaladas
SELECT 
    extname as extensao,
    extversion as versao
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'unaccent', 'pg_trgm')
ORDER BY extname;

-- ===============================================
-- 7. VERIFICAR CONFIGURAÇÕES
-- ===============================================

SELECT 'CONFIGURAÇÕES' as verificacao;

-- Verificar timezone
SELECT 
    'timezone' as configuracao,
    current_setting('timezone') as valor;

-- Verificar encoding
SELECT 
    'encoding' as configuracao,
    current_setting('server_encoding') as valor;

-- ===============================================
-- 8. TESTE DE FUNCIONALIDADE
-- ===============================================

SELECT 'TESTE DE FUNCIONALIDADE' as verificacao;

-- Testar função de atualização de updated_at
DO $$
BEGIN
    -- Inserir um registro de teste na tabela inscricoes
    INSERT INTO inscricoes (
        email, nome, cpf, data_nascimento, cep, logradouro, numero, 
        bairro, cidade, estado, nome_responsavel, telefone_whatsapp, 
        escolaridade, ano_escolar, curso
    ) VALUES (
        'teste@exemplo.com', 'Teste', '12345678901', '2000-01-01', 
        '65000000', 'Rua Teste', '123', 'Centro', 'Imperatriz', 'MA', 
        'Responsável Teste', '999999999', 'Ensino Médio', '3º Ano', 'Teste'
    );
    
    -- Atualizar o registro para testar o trigger
    UPDATE inscricoes SET nome = 'Teste Atualizado' WHERE email = 'teste@exemplo.com';
    
    -- Verificar se updated_at foi atualizado
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE email = 'teste@exemplo.com' 
        AND updated_at > created_at
    ) THEN
        RAISE NOTICE '✅ Trigger de updated_at funcionando!';
    ELSE
        RAISE NOTICE '❌ Trigger de updated_at não funcionou!';
    END IF;
    
    -- Limpar o registro de teste
    DELETE FROM inscricoes WHERE email = 'teste@exemplo.com';
    
    RAISE NOTICE '✅ Teste de funcionalidade concluído!';
END $$;

-- ===============================================
-- 9. RESUMO FINAL
-- ===============================================

SELECT 'RESUMO FINAL' as verificacao;

-- Contar total de registros
SELECT 
    'TOTAL DE REGISTROS' as metrica,
    (
        (SELECT COUNT(*) FROM inscricoes) +
        (SELECT COUNT(*) FROM monitores) +
        (SELECT COUNT(*) FROM escolas) +
        (SELECT COUNT(*) FROM verification_codes) +
        (SELECT COUNT(*) FROM cursos) +
        (SELECT COUNT(*) FROM turmas) +
        (SELECT COUNT(*) FROM turmas_monitores) +
        (SELECT COUNT(*) FROM turmas_alunas) +
        (SELECT COUNT(*) FROM aulas) +
        (SELECT COUNT(*) FROM frequencia)
    ) as valor;

-- Verificar se setup está completo
DO $$
DECLARE
    table_count INTEGER;
    total_records INTEGER;
BEGIN
    -- Contar tabelas
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    -- Contar registros principais
    SELECT 
        (SELECT COUNT(*) FROM inscricoes) +
        (SELECT COUNT(*) FROM monitores) +
        (SELECT COUNT(*) FROM escolas) +
        (SELECT COUNT(*) FROM verification_codes) +
        (SELECT COUNT(*) FROM cursos) +
        (SELECT COUNT(*) FROM turmas) +
        (SELECT COUNT(*) FROM turmas_monitores) +
        (SELECT COUNT(*) FROM turmas_alunas) +
        (SELECT COUNT(*) FROM aulas) +
        (SELECT COUNT(*) FROM frequencia)
    INTO total_records;
    
    RAISE NOTICE '===============================================';
    RAISE NOTICE '📊 VERIFICAÇÃO COMPLETA DO SETUP';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '📋 Tabelas criadas: %', table_count;
    RAISE NOTICE '📝 Registros migrados: %', total_records;
    
    IF table_count >= 17 AND total_records >= 400 THEN
        RAISE NOTICE '✅ SETUP COMPLETO E FUNCIONANDO!';
        RAISE NOTICE '🎉 Banco pronto para uso!';
    ELSIF table_count >= 12 THEN
        RAISE NOTICE '⚠️  SETUP BÁSICO OK - Faltam tabelas de eventos';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETO - Verifique os logs';
    END IF;
    
    RAISE NOTICE '===============================================';
END $$;
