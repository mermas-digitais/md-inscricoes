# 🏆 Sistema de Certificados - Mermãs Digitais

Sistema completo para geração e envio de certificados personalizados em PDF para alunas do programa Mermãs Digitais.

## 🚀 Funcionalidades

- ✅ **Geração de PDF**: Certificados personalizados com template de fundo
- ✅ **Envio por Email**: Envio automático com PDF anexo
- ✅ **Interface Integrada**: Botão no painel de matrículas
- ✅ **Configuração Flexível**: Templates e posições configuráveis
- ✅ **Rastreamento**: Controle de certificados enviados

## 📋 Pré-requisitos

1. **Banco de dados atualizado** com as novas tabelas
2. **Template de certificado** em formato JPG/PNG/WebP
3. **Configuração SMTP** para envio de emails

## 🛠️ Instalação

### 1. Atualizar Banco de Dados

```bash
# Executar migration (quando possível)
npx prisma migrate dev --name add-certificates-system

# Ou aplicar manualmente as mudanças do schema.prisma
```

### 2. Configurar Template

1. Salve seu template de certificado em `public/assets/certificados/`
2. Execute o script de configuração inicial:

```bash
# Ajustar o arquivo scripts/create-initial-certificate-config.ts
# com o caminho correto do seu template
npx ts-node scripts/create-initial-certificate-config.ts
```

### 3. Ajustar Posições

Edite a configuração no banco para ajustar as posições dos campos conforme seu template:

```sql
UPDATE certificados_config
SET posicoes = '{
  "nome": {"x": 150, "y": 180},
  "cpf": {"x": 150, "y": 220},
  "data": {"x": 150, "y": 260},
  "carga_horaria": {"x": 150, "y": 300}
}'
WHERE ativo = true;
```

## 🎯 Como Usar

### Envio de Certificados

1. **Acesse o painel de matrículas** (`/matriculas`)
2. **Selecione as alunas** (use filtros se necessário)
3. **Clique no menu de ações** (três pontos no canto superior)
4. **Selecione "Enviar Certificados"**
5. **Configure a data de conclusão**
6. **Clique em "Enviar Certificados"**

### Monitoramento

O sistema atualiza automaticamente:

- ✅ Flag `certificado_enviado` = `true`
- ✅ Campo `certificado_enviado_em` com timestamp
- ✅ Campo `data_conclusao` com a data especificada

## 🔧 Configuração Avançada

### Posições dos Campos

As coordenadas são em milímetros (mm) no PDF:

- **nome**: Posição do nome da aluna
- **cpf**: Posição do CPF formatado (000.000.000-00)
- **data**: Posição da data de conclusão (DD/MM/AAAA)
- **carga_horaria**: Posição da carga horária (XX horas)

### Configuração de Fontes

```json
{
  "fontes": {
    "nome": { "size": 18, "color": "#2D3748", "family": "helvetica" },
    "cpf": { "size": 14, "color": "#4A5568", "family": "helvetica" },
    "data": { "size": 14, "color": "#4A5568", "family": "helvetica" },
    "carga_horaria": { "size": 14, "color": "#4A5568", "family": "helvetica" }
  }
}
```

## 📁 Estrutura de Arquivos

```
├── lib/services/certificate-service.ts     # Serviço principal
├── app/api/
│   ├── matriculas/send-certificates/       # API de envio
│   └── certificados/
│       ├── config/                         # API de configuração
│       └── upload-template/                # API de upload
├── components/ui/certificate-modal.tsx     # Modal de interface
├── public/assets/certificados/             # Templates
└── scripts/create-initial-certificate-config.ts
```

## 🐛 Troubleshooting

### Erro: "Nenhuma configuração de certificado ativa encontrada"

```sql
-- Verificar configuração ativa
SELECT * FROM certificados_config WHERE ativo = true;

-- Criar configuração se não existir
INSERT INTO certificados_config (edicao, template_url, ativo, posicoes, fontes)
VALUES ('2024.2', '/assets/certificados/template.jpg', true, '{}', '{}');
```

### Erro: "Erro ao carregar imagem do template"

- ✅ Verificar se arquivo existe em `public/assets/certificados/`
- ✅ Verificar URL na configuração
- ✅ Testar acesso direto: `http://localhost:3000/assets/certificados/template.jpg`

### Erro de envio de email

- ✅ Verificar configurações SMTP no `.env`
- ✅ Testar configuração de email separadamente
- ✅ Verificar logs do servidor

## 📊 APIs Disponíveis

### Enviar Certificados

```bash
POST /api/matriculas/send-certificates
{
  "alunaIds": ["uuid1", "uuid2"],
  "dataConclusao": "2024-12-15"
}
```

### Gerenciar Configurações

```bash
# Listar configurações
GET /api/certificados/config

# Criar configuração
POST /api/certificados/config
{
  "edicao": "2024.2",
  "templateUrl": "/assets/certificados/template.jpg",
  "ativo": true,
  "posicoes": {...},
  "fontes": {...}
}

# Atualizar configuração
PUT /api/certificados/config
{
  "id": "uuid",
  "posicoes": {...}
}
```

### Upload de Template

```bash
POST /api/certificados/upload-template
# Form-data com arquivo de imagem
```

## 🔮 Próximas Melhorias

- [ ] Interface visual para posicionar campos (drag & drop)
- [ ] Múltiplos templates por edição
- [ ] Preview do certificado antes do envio
- [ ] Relatórios de certificados enviados
- [ ] Templates personalizáveis por curso
- [ ] Assinatura digital nos certificados

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do servidor
2. Consultar documentação completa em `docs/SISTEMA-CERTIFICADOS.md`
3. Testar APIs individualmente
4. Verificar configurações do banco de dados

---

**Desenvolvido para Mermãs Digitais** 🚀
