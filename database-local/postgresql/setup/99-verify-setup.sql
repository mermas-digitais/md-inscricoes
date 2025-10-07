-- ===============================================
-- SCRIPT DE VERIFICAÇÃO FINAL
-- ===============================================
-- Este script verifica se todas as tabelas foram criadas corretamente

-- ===============================================
-- VERIFICAÇÃO DE TABELAS
-- ===============================================
DO $$
DECLARE
    table_count INTEGER;
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'inscricoes', 'monitores', 'escolas', 'verification_codes',
        'cursos', 'turmas', 'turmas_monitores', 'turmas_alunas',
        'aulas', 'frequencia'
    ];
    missing_tables TEXT[] := '{}';
BEGIN
    -- Contar total de tabelas
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RAISE NOTICE '===============================================';
    RAISE NOTICE '📊 VERIFICAÇÃO FINAL DO BANCO DE DADOS';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Total de tabelas criadas: %', table_count;
    
    -- Verificar tabelas específicas
    FOREACH table_name IN ARRAY tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    -- Resultado da verificação
    IF array_length(missing_tables, 1) IS NULL THEN
        RAISE NOTICE '✅ TODAS AS TABELAS FORAM CRIADAS COM SUCESSO!';
        RAISE NOTICE '🎉 BANCO DE DADOS PRONTO PARA USO!';
    ELSE
        RAISE NOTICE '⚠️  TABELAS FALTANDO: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE '❌ VERIFIQUE OS SCRIPTS DE INICIALIZAÇÃO';
    END IF;
    
    RAISE NOTICE '===============================================';
    RAISE NOTICE '🔗 CONEXÃO: postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db';
    RAISE NOTICE '===============================================';
END $$;
