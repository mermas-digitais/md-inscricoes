-- Script simplificado para atualizar escolas no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que a extensão unaccent esteja disponível
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Criar tabela de escolas se não existir
CREATE TABLE IF NOT EXISTS escolas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Municipal', 'Estadual', 'Federal', 'Particular')),
  cidade TEXT DEFAULT 'Imperatriz',
  estado TEXT DEFAULT 'MA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Adicionar constraint UNIQUE de forma segura
DO $$ 
BEGIN
    -- Tentar adicionar a constraint
    BEGIN
        ALTER TABLE escolas ADD CONSTRAINT unique_escola_nome UNIQUE (nome);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint já existe, ignorar erro
            RAISE NOTICE 'Constraint unique_escola_nome já existe';
        WHEN others THEN
            -- Outro erro, mostrar mas continuar
            RAISE NOTICE 'Erro ao criar constraint: %', SQLERRM;
    END;
END $$;

-- 4. Adicionar índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_escolas_nome ON escolas USING GIN (to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_escolas_nome_unaccent ON escolas USING GIN (to_tsvector('portuguese', unaccent(lower(nome))));
CREATE INDEX IF NOT EXISTS idx_escolas_tipo ON escolas (tipo);

-- 5. Criar função para busca sem acentos
CREATE OR REPLACE FUNCTION search_escolas_sem_acento(
  search_term TEXT,
  escola_tipo TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE(id INTEGER, nome TEXT, tipo TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.nome, e.tipo
  FROM escolas e
  WHERE 
    (escola_tipo IS NULL OR e.tipo = escola_tipo)
    AND (
      search_term IS NULL 
      OR search_term = '' 
      OR unaccent(lower(e.nome)) LIKE '%' || unaccent(lower(search_term)) || '%'
    )
  ORDER BY e.nome
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 6. Inserir/atualizar dados das escolas (UPSERT)
INSERT INTO escolas (nome, tipo) VALUES
('Centro Educa Mais Caminho do Futuro', 'Estadual'),
('Centro Educa Mais Mourao Rangel', 'Estadual'),
('Centro Educa Mais Nascimento de Moraes', 'Estadual'),
('Centro Educa Mais Tancredo de Almeida Neves', 'Estadual'),
('Centro de Ensino Amaral Raposo', 'Estadual'),
('Centro de Ensino Delahe Fiquene', 'Estadual'),
('Centro de Ensino Dorgival Pinheiro de Sousa', 'Estadual'),
('Centro de Ensino Dorgival Pinheiro de Sousa - Anexo I - Centro', 'Estadual'),
('Centro de Ensino Dorgival Pinheiro de Sousa - Anexo II - Petrolina', 'Estadual'),
('Centro de Ensino Estado de Goias', 'Estadual'),
('Centro de Ensino Governador Archer', 'Estadual'),
('Centro de Ensino Graça Aranha', 'Estadual'),
('Centro de Ensino Nova Vitória', 'Estadual'),
('Centro de Ensino Professor Edinan Moraes', 'Estadual'),
('Centro de Ensino Raimundo Soares da Cunha', 'Estadual'),
('Centro de Ensino Uniao', 'Estadual'),
('Centro de Ensino Urbano Rocha', 'Estadual'),
('Centro de Ensino Vespasiano Ramos', 'Estadual'),
('Centro de Ensino Vinicius de Moraes', 'Estadual'),
('Centro de Ensino de Educação de Jovens e Adultos II', 'Estadual'),
('Colégio Militar Tiradentes II - Imperatriz', 'Estadual'),
('Iema - Instituto Estadual de Educação Ciência e Tecnologia do MA - Unidade Vocacional Imperatriz', 'Estadual'),
('Instituto Estadual de Educação Ciência e Tecnologia do Maranhão - Iema Pleno Imperatriz', 'Estadual'),
('Colégio Estadual Inf Professora Juracy Athayde Conceição', 'Municipal'),
('Colégio Estadual Maranhense', 'Municipal'),
('Conselho Comunitário do Pq Alvorada Dois', 'Municipal'),
('Creche Aconchego', 'Municipal'),
('Creche Cantinho do Saber', 'Municipal'),
('Creche Cidade Esperança', 'Municipal'),
('Creche Moranguinho', 'Municipal'),
('Creche Municipal Arco Íris', 'Municipal'),
('Creche Municipal Caminho Feliz', 'Municipal'),
('Creche Municipal Cantinho da Alegria I', 'Municipal'),
('Creche Municipal Cirandinha', 'Municipal'),
('Creche Municipal Educandário do Saber', 'Municipal'),
('Creche Municipal Irmã Dulce', 'Municipal'),
('Creche Municipal Mundo Infantil', 'Municipal'),
('Creche Municipal Santa Margarida', 'Municipal'),
('Creche Municipalizada Maranhão do Sul', 'Municipal'),
('Creche Risco e Rabisco', 'Municipal'),
('Creche Santa Terezinha', 'Municipal'),
('Creche Vovo Suelly', 'Municipal'),
('Educandário Lirio dos Vales', 'Municipal'),
('Escola Espaço Infantil Maranatha', 'Municipal'),
('Escola Municipal Adalberto Franklin Pereira de Castro', 'Municipal'),
('Escola Municipal Afonso Pena', 'Municipal'),
('Escola Municipal Antonio Leite Andrade', 'Municipal'),
('Escola Municipal Bernardo Sayão', 'Municipal'),
('Escola Municipal Casa de Dom Bosco', 'Municipal'),
('Escola Municipal Castro Alves I', 'Municipal'),
('Escola Municipal Castro Alves II', 'Municipal'),
('Escola Municipal Chaparral', 'Municipal'),
('Escola Municipal Coelho Neto', 'Municipal'),
('Escola Municipal Constantino Barbosa da Silva', 'Municipal'),
('Escola Municipal Creche Esperança', 'Municipal'),
('Escola Municipal Darcy Ribeiro', 'Municipal'),
('Escola Municipal Dom Marcelino', 'Municipal'),
('Escola Municipal Dom Pedro I', 'Municipal'),
('Escola Municipal Domingos Moraes', 'Municipal'),
('Escola Municipal Edelvira Marques', 'Municipal'),
('Escola Municipal Educ Bilingue Para Surdos Professor Telasco Pereira Filho', 'Municipal'),
('Escola Municipal Eliza Nunes', 'Municipal'),
('Escola Municipal Enock Alves Bezerra', 'Municipal'),
('Escola Municipal Fernanda Branco Oliveira', 'Municipal'),
('Escola Municipal Fraternidade', 'Municipal'),
('Escola Municipal Frei Manoel Procópio', 'Municipal'),
('Escola Municipal Frei Tadeu', 'Municipal'),
('Escola Municipal Giovanni Zanni', 'Municipal'),
('Escola Municipal Humberto de Campos', 'Municipal'),
('Escola Municipal João Gonçalves Santiago', 'Municipal'),
('Escola Municipal João Guimarães', 'Municipal'),
('Escola Municipal João Lisboa', 'Municipal'),
('Escola Municipal João Silva', 'Municipal'),
('Escola Municipal José de Alencar', 'Municipal'),
('Escola Municipal Juscelino Kubitschek', 'Municipal'),
('Escola Municipal Lago do Cisne', 'Municipal'),
('Escola Municipal Lauro Tupinamba Valente', 'Municipal'),
('Escola Municipal Leoncio Pires Dourado', 'Municipal'),
('Escola Municipal Luis de Franca Moreira', 'Municipal'),
('Escola Municipal Machado de Assis', 'Municipal'),
('Escola Municipal Madalena de Canossa', 'Municipal'),
('Escola Municipal Manoel Ribeiro', 'Municipal'),
('Escola Municipal Marcionilia Gomes Soares', 'Municipal'),
('Escola Municipal Marechal Rondon', 'Municipal'),
('Escola Municipal Maria das Neves Marques de Sousa', 'Municipal'),
('Escola Municipal Maria Evangelista de Sousa', 'Municipal'),
('Escola Municipal Maria Francisca Pereira da Silva', 'Municipal'),
('Escola Municipal Mariana Luz', 'Municipal'),
('Escola Municipal Marly Sarney', 'Municipal'),
('Escola Municipal Menino Jesus II', 'Municipal'),
('Escola Municipal Morada do Sol', 'Municipal'),
('Escola Municipal Moranguinho', 'Municipal'),
('Escola Municipal Moreira Neto', 'Municipal'),
('Escola Municipal Nossa Senhora da Conceição', 'Municipal'),
('Escola Municipal Nossa Senhora de Nazare', 'Municipal'),
('Escola Municipal Nucleo Santa Cruz', 'Municipal'),
('Escola Municipal Paulo Freire', 'Municipal'),
('Escola Municipal Pedro Abreu', 'Municipal'),
('Escola Municipal Pedro Ferreira Alencar', 'Municipal'),
('Escola Municipal Pres Costa e Silva', 'Municipal'),
('Escola Municipal Professor José Queiroz', 'Municipal'),
('Escola Municipal Raimundo Correa', 'Municipal'),
('Escola Municipal Raimundo Ribeiro', 'Municipal'),
('Escola Municipal Santa Clara de Assis - Jisca', 'Municipal'),
('Escola Municipal Santa Laura', 'Municipal'),
('Escola Municipal Santa Lucia', 'Municipal'),
('Escola Municipal Santa Maria', 'Municipal'),
('Escola Municipal Santa Rita', 'Municipal'),
('Escola Municipal Santa Tereza', 'Municipal'),
('Escola Municipal Santa Tereza D Avila', 'Municipal'),
('Escola Municipal Santo Amaro', 'Municipal'),
('Escola Municipal Santo Inacio de Loyola', 'Municipal'),
('Escola Municipal Santos Dumont', 'Municipal'),
('Escola Municipal Senhor Jesus', 'Municipal'),
('Escola Municipal Sousa Lima', 'Municipal'),
('Escola Municipal Sumaré', 'Municipal'),
('Escola Municipal São Félix', 'Municipal'),
('Escola Municipal São Francisco', 'Municipal'),
('Escola Municipal São Francisco do Canindé', 'Municipal'),
('Escola Municipal São Jorge I', 'Municipal'),
('Escola Municipal São Sebastião', 'Municipal'),
('Escola Municipal São Vicente de Paula', 'Municipal'),
('Escola Municipal Tia Emília', 'Municipal'),
('Escola Municipal Tiradentes II', 'Municipal'),
('Escola Municipal Tocantins', 'Municipal'),
('Escola Municipal Tomé de Sousa', 'Municipal'),
('Escola Municipal Vital Brazil', 'Municipal'),
('Escola Municipal Wady Fiquene', 'Municipal'),
('Escola Municipal de 1 Grau Princesa Izabel', 'Municipal'),
('Escola Municipal de Educação Infantil Frei Benjamin Zanardini', 'Municipal'),
('Escola Municipal de Educação Infantil Governador Jackson Lago', 'Municipal'),
('Escola Municipal de Educação Infantil Herica Barros de Jesus', 'Municipal'),
('Escola Municipal de Educação Infantil Jair Rosignoli', 'Municipal'),
('Escola Municipal de Educação Infantil Jeova Pereira da Silva', 'Municipal'),
('Escola Municipal de Educação Infantil José Carneiro dos Santos', 'Municipal'),
('Escola Municipal de Educação Infantil José Ribamar Garros', 'Municipal'),
('Escola Municipal de Educação Infantil Maria José Silva Nunes', 'Municipal'),
('Escola Municipal de Educação Infantil Maria Luiza Coelho Brandao', 'Municipal'),
('Escola Municipal de Educação Infantil Marlene Soares', 'Municipal'),
('Escola Municipal de Educação Infantil Nossa Senhora de Fatima', 'Municipal'),
('Escola Municipal de Educação Infantil Pequeno Príncipe', 'Municipal'),
('Escola Municipal de Educação Infantil Shirley Farias Torres Ferreira', 'Municipal'),
('Escola Municipal de Ensino Fundamental Gonçalves Dias', 'Municipal'),
('Escola Municipal de Ensino Fundamental Ipiranga', 'Municipal'),
('Escola Municipalizada Frei Paulo de Graymoor', 'Municipal'),
('Fundação Educacional Pirangi', 'Municipal')
ON CONFLICT (nome) DO UPDATE SET 
  tipo = EXCLUDED.tipo,
  cidade = EXCLUDED.cidade,
  estado = EXCLUDED.estado;

-- 7. Adicionar campo escola na tabela de inscrições se não existir
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE inscricoes ADD COLUMN escola TEXT;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna escola já existe na tabela inscricoes';
    END;
END $$;

-- 8. Comentário sobre o campo escola
DO $$ 
BEGIN
    BEGIN
        COMMENT ON COLUMN inscricoes.escola IS 'Nome da escola onde a aluna estuda';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Erro ao adicionar comentário: %', SQLERRM;
    END;
END $$;

-- 9. Configurar RLS (Row Level Security)
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;

-- 10. Criar política de acesso
DROP POLICY IF EXISTS "Enable read access for all users" ON escolas;
CREATE POLICY "Enable read access for all users" ON escolas
FOR SELECT USING (true);

-- 11. Conceder permissões
GRANT SELECT ON escolas TO anon;
GRANT SELECT ON escolas TO authenticated;

-- 12. Verificar resultado
SELECT 
  'Escolas inseridas' as info,
  COUNT(*) as total,
  COUNT(CASE WHEN tipo = 'Estadual' THEN 1 END) as estaduais,
  COUNT(CASE WHEN tipo = 'Municipal' THEN 1 END) as municipais
FROM escolas;
