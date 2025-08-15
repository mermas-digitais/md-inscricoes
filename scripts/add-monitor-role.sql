-- Adicionar coluna role na tabela monitores
ALTER TABLE monitores 
ADD COLUMN role VARCHAR(20) DEFAULT 'MONITOR' CHECK (role IN ('MONITOR', 'ADM'));

-- Atualizar monitores existentes para ter role ADM (você pode ajustar isso conforme necessário)
-- UPDATE monitores SET role = 'ADM' WHERE email = 'email-do-admin@example.com';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_monitores_role ON monitores(role);

-- Comentários
COMMENT ON COLUMN monitores.role IS 'Role do monitor: MONITOR (visualização apenas) ou ADM (pode criar usuários e monitores)';
