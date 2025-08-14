-- ===============================================
-- QUERIES ÚTEIS PARA O MÓDULO DE ENSINO
-- ===============================================
-- Exemplos de consultas para trabalhar com as novas tabelas
-- Data de criação: 14 de agosto de 2025

-- ===============================================
-- 1. CONSULTAS BÁSICAS
-- ===============================================

-- Listar todos os cursos com suas informações
SELECT 
    id,
    nome_curso,
    descricao,
    carga_horaria,
    publico_alvo,
    created_at
FROM cursos
ORDER BY nome_curso;

-- Listar turmas ativas com informações do curso
SELECT 
    t.id,
    t.nome_turma,
    t.ano_letivo,
    t.status,
    c.nome_curso,
    c.publico_alvo
FROM turmas t
JOIN cursos c ON t.curso_id = c.id
WHERE t.status = 'Ativa'
ORDER BY t.ano_letivo DESC, c.nome_curso;

-- ===============================================
-- 2. RELATÓRIOS DE TURMAS
-- ===============================================

-- Relatório completo de uma turma específica
SELECT 
    t.nome_turma,
    t.ano_letivo,
    t.status,
    c.nome_curso,
    c.carga_horaria,
    COUNT(DISTINCT ta.aluna_id) as total_alunas,
    COUNT(DISTINCT tm.monitor_id) as total_monitores,
    COUNT(DISTINCT a.id) as total_aulas
FROM turmas t
JOIN cursos c ON t.curso_id = c.id
LEFT JOIN turmas_alunas ta ON t.id = ta.turma_id
LEFT JOIN turmas_monitores tm ON t.id = tm.turma_id
LEFT JOIN aulas a ON t.id = a.turma_id
WHERE t.id = 'UUID_DA_TURMA' -- Substituir pelo UUID real
GROUP BY t.id, t.nome_turma, t.ano_letivo, t.status, c.nome_curso, c.carga_horaria;

-- Listar alunas de uma turma específica
SELECT 
    i.nome,
    i.email,
    i.escolaridade,
    i.ano_escolar,
    i.escola,
    ta.created_at as data_matricula
FROM turmas_alunas ta
JOIN inscricoes i ON ta.aluna_id = i.id
WHERE ta.turma_id = 'UUID_DA_TURMA' -- Substituir pelo UUID real
ORDER BY i.nome;

-- Listar monitores de uma turma específica
SELECT 
    m.nome,
    m.email,
    m.funcao,
    tm.created_at as data_vinculo
FROM turmas_monitores tm
JOIN monitores m ON tm.monitor_id = m.id
WHERE tm.turma_id = 'UUID_DA_TURMA' -- Substituir pelo UUID real
ORDER BY m.nome;

-- ===============================================
-- 3. RELATÓRIOS DE FREQUÊNCIA
-- ===============================================

-- Frequência geral por aluna em uma turma
SELECT 
    i.nome as nome_aluna,
    COUNT(f.aula_id) as total_aulas,
    COUNT(CASE WHEN f.presente = true THEN 1 END) as aulas_presentes,
    COUNT(CASE WHEN f.presente = false THEN 1 END) as aulas_ausentes,
    ROUND(
        (COUNT(CASE WHEN f.presente = true THEN 1 END) * 100.0) / 
        NULLIF(COUNT(f.aula_id), 0), 
        2
    ) as percentual_presenca
FROM turmas_alunas ta
JOIN inscricoes i ON ta.aluna_id = i.id
LEFT JOIN aulas a ON a.turma_id = ta.turma_id
LEFT JOIN frequencia f ON f.aula_id = a.id AND f.aluna_id = ta.aluna_id
WHERE ta.turma_id = 'UUID_DA_TURMA' -- Substituir pelo UUID real
GROUP BY ta.aluna_id, i.nome
ORDER BY percentual_presenca DESC, i.nome;

-- Frequência por aula em uma turma
SELECT 
    a.data_aula,
    a.conteudo_ministrado,
    COUNT(f.aluna_id) as total_alunas,
    COUNT(CASE WHEN f.presente = true THEN 1 END) as presentes,
    COUNT(CASE WHEN f.presente = false THEN 1 END) as ausentes,
    ROUND(
        (COUNT(CASE WHEN f.presente = true THEN 1 END) * 100.0) / 
        NULLIF(COUNT(f.aluna_id), 0), 
        2
    ) as percentual_presenca
FROM aulas a
LEFT JOIN frequencia f ON a.id = f.aula_id
WHERE a.turma_id = 'UUID_DA_TURMA' -- Substituir pelo UUID real
GROUP BY a.id, a.data_aula, a.conteudo_ministrado
ORDER BY a.data_aula DESC;

-- ===============================================
-- 4. DASHBOARDS E ESTATÍSTICAS
-- ===============================================

-- Estatísticas gerais do módulo de ensino
SELECT 
    COUNT(DISTINCT c.id) as total_cursos,
    COUNT(DISTINCT t.id) as total_turmas,
    COUNT(DISTINCT CASE WHEN t.status = 'Ativa' THEN t.id END) as turmas_ativas,
    COUNT(DISTINCT ta.aluna_id) as total_alunas_matriculadas,
    COUNT(DISTINCT tm.monitor_id) as total_monitores_ativos,
    COUNT(DISTINCT a.id) as total_aulas_ministradas
FROM cursos c
LEFT JOIN turmas t ON c.id = t.curso_id
LEFT JOIN turmas_alunas ta ON t.id = ta.turma_id
LEFT JOIN turmas_monitores tm ON t.id = tm.turma_id
LEFT JOIN aulas a ON t.id = a.turma_id;

-- Ranking de cursos por popularidade
SELECT 
    c.nome_curso,
    c.publico_alvo,
    COUNT(DISTINCT t.id) as total_turmas,
    COUNT(DISTINCT ta.aluna_id) as total_alunas,
    AVG(
        (SELECT COUNT(*) FROM aulas WHERE turma_id = t.id)
    ) as media_aulas_por_turma
FROM cursos c
LEFT JOIN turmas t ON c.id = t.curso_id
LEFT JOIN turmas_alunas ta ON t.id = ta.turma_id
GROUP BY c.id, c.nome_curso, c.publico_alvo
ORDER BY total_alunas DESC, total_turmas DESC;

-- ===============================================
-- 5. VIEWS ÚTEIS PARA A APLICAÇÃO
-- ===============================================

-- View para listar turmas com estatísticas
CREATE OR REPLACE VIEW vw_turmas_estatisticas AS
SELECT 
    t.id,
    t.nome_turma,
    t.ano_letivo,
    t.status,
    c.nome_curso,
    c.publico_alvo,
    c.carga_horaria,
    COUNT(DISTINCT ta.aluna_id) as total_alunas,
    COUNT(DISTINCT tm.monitor_id) as total_monitores,
    COUNT(DISTINCT a.id) as total_aulas,
    t.created_at
FROM turmas t
JOIN cursos c ON t.curso_id = c.id
LEFT JOIN turmas_alunas ta ON t.id = ta.turma_id
LEFT JOIN turmas_monitores tm ON t.id = tm.turma_id
LEFT JOIN aulas a ON t.id = a.turma_id
GROUP BY t.id, t.nome_turma, t.ano_letivo, t.status, c.nome_curso, c.publico_alvo, c.carga_horaria, t.created_at;

-- View para relatório de frequência resumido
CREATE OR REPLACE VIEW vw_frequencia_resumida AS
SELECT 
    ta.turma_id,
    ta.aluna_id,
    i.nome as nome_aluna,
    COUNT(f.aula_id) as total_aulas,
    COUNT(CASE WHEN f.presente = true THEN 1 END) as aulas_presentes,
    ROUND(
        (COUNT(CASE WHEN f.presente = true THEN 1 END) * 100.0) / 
        NULLIF(COUNT(f.aula_id), 0), 
        2
    ) as percentual_presenca
FROM turmas_alunas ta
JOIN inscricoes i ON ta.aluna_id = i.id
LEFT JOIN aulas a ON a.turma_id = ta.turma_id
LEFT JOIN frequencia f ON f.aula_id = a.id AND f.aluna_id = ta.aluna_id
GROUP BY ta.turma_id, ta.aluna_id, i.nome;

-- ===============================================
-- 6. FUNÇÕES ÚTEIS
-- ===============================================

-- Função para calcular percentual de presença de uma aluna
CREATE OR REPLACE FUNCTION calcular_percentual_presenca(
    p_aluna_id UUID,
    p_turma_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_aulas INTEGER;
    aulas_presentes INTEGER;
    percentual DECIMAL(5,2);
BEGIN
    -- Contar total de aulas da turma
    SELECT COUNT(*) INTO total_aulas
    FROM aulas 
    WHERE turma_id = p_turma_id;
    
    -- Contar presenças da aluna
    SELECT COUNT(*) INTO aulas_presentes
    FROM frequencia f
    JOIN aulas a ON f.aula_id = a.id
    WHERE f.aluna_id = p_aluna_id 
    AND a.turma_id = p_turma_id 
    AND f.presente = true;
    
    -- Calcular percentual
    IF total_aulas > 0 THEN
        percentual := (aulas_presentes * 100.0) / total_aulas;
    ELSE
        percentual := 0;
    END IF;
    
    RETURN percentual;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso da função:
-- SELECT calcular_percentual_presenca('uuid_aluna', 'uuid_turma');

-- ===============================================
-- 7. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ===============================================

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_turmas_alunas_lookup ON turmas_alunas(aluna_id, turma_id);
CREATE INDEX IF NOT EXISTS idx_turmas_monitores_lookup ON turmas_monitores(monitor_id, turma_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_lookup ON frequencia(aluna_id, aula_id, presente);

-- ===============================================
-- EXEMPLO DE USO PRÁTICO
-- ===============================================

/*
-- 1. Criar um curso
INSERT INTO cursos (nome_curso, descricao, carga_horaria, publico_alvo) 
VALUES ('Robótica Avançada', 'Curso avançado de robótica', 80, 'Ensino Médio');

-- 2. Criar uma turma
INSERT INTO turmas (curso_id, nome_turma, ano_letivo, status) 
VALUES ('uuid_do_curso', 'Robótica 2025 - Turma A', 2025, 'Planejamento');

-- 3. Associar monitor à turma
INSERT INTO turmas_monitores (turma_id, monitor_id) 
VALUES ('uuid_da_turma', 'uuid_do_monitor');

-- 4. Matricular aluna na turma
INSERT INTO turmas_alunas (turma_id, aluna_id) 
VALUES ('uuid_da_turma', 'uuid_da_aluna');

-- 5. Registrar uma aula
INSERT INTO aulas (turma_id, data_aula, conteudo_ministrado) 
VALUES ('uuid_da_turma', '2025-08-14', 'Introdução aos sensores');

-- 6. Registrar frequência
INSERT INTO frequencia (aula_id, aluna_id, presente) 
VALUES ('uuid_da_aula', 'uuid_da_aluna', true);
*/
