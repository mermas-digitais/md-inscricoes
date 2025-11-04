# Sistema de Certificados - Mermãs Digitais

## Visão Geral

O sistema de certificados permite gerar e enviar certificados personalizados em PDF para alunas do programa Mermãs Digitais. Os certificados são gerados com base em um template de imagem de fundo configurável, onde são inseridos os dados da aluna (nome, CPF, data de conclusão e carga horária).

## Funcionalidades Implementadas

### ✅ Banco de Dados

- **Tabela `certificados_config`**: Armazena configurações de templates e posições dos campos
- **Campos adicionados em `inscricoes`**:
  - `data_conclusao`: Data de conclusão do curso
  - `certificado_enviado`: Flag indicando se o certificado foi enviado
  - `certificado_enviado_em`: Timestamp do envio

### ✅ APIs Criadas

- **`/api/matriculas/send-certificates`**: Envia certificados para alunas selecionadas
- **`/api/certificados/config`**: Gerencia configurações de certificados (CRUD)
- **`/api/certificados/upload-template`**: Upload de templates de certificado

### ✅ Serviços

- **`CertificateService`**: Classe principal para geração e envio de certificados
  - Geração de PDF com jsPDF
  - Envio de emails com anexos
  - Integração com banco de dados

### ✅ Interface de Usuário

- **`CertificateModal`**: Modal para envio de certificados
- **Integração no painel de matrículas**: Botão "Enviar Certificados" no menu de ações

## Como Usar

### 1. Configuração Inicial (Admin)

Antes de usar o sistema, é necessário configurar um template de certificado:

```bash
# 1. Fazer upload do template
POST /api/certificados/upload-template
# Enviar arquivo de imagem (JPG, PNG, WebP) como form-data

# 2. Criar configuração de certificado
POST /api/certificados/config
{
  "edicao": "2024.2",
  "templateUrl": "/assets/certificados/template_1234567890.jpg",
  "ativo": true,
  "posicoes": {
    "nome": { "x": 100, "y": 200 },
    "cpf": { "x": 100, "y": 250 },
    "data": { "x": 100, "y": 300 },
    "carga_horaria": { "x": 100, "y": 350 }
  },
  "fontes": {
    "nome": { "size": 16, "color": "#000000", "family": "helvetica" },
    "cpf": { "size": 12, "color": "#333333", "family": "helvetica" },
    "data": { "size": 12, "color": "#333333", "family": "helvetica" },
    "carga_horaria": { "size": 12, "color": "#333333", "family": "helvetica" }
  }
}
```

### 2. Envio de Certificados

1. Acesse o painel de matrículas (`/matriculas`)
2. Selecione as alunas desejadas (usando filtros se necessário)
3. Clique no botão de ações (três pontos) no canto superior direito
4. Selecione "Enviar Certificados"
5. Configure a data de conclusão
6. Clique em "Enviar Certificados"

### 3. Monitoramento

O sistema atualiza automaticamente:

- Flag `certificado_enviado` para `true`
- Campo `certificado_enviado_em` com timestamp
- Campo `data_conclusao` com a data especificada

## Estrutura de Arquivos

```
├── lib/services/
│   └── certificate-service.ts          # Serviço principal
├── app/api/
│   ├── matriculas/send-certificates/
│   │   └── route.ts                   # API de envio
│   └── certificados/
│       ├── config/route.ts            # API de configuração
│       └── upload-template/route.ts   # API de upload
├── components/ui/
│   └── certificate-modal.tsx          # Modal de interface
├── public/assets/certificados/        # Templates de certificado
└── prisma/schema.prisma               # Schema do banco atualizado
```

## Configuração de Template

### Posições dos Campos

As coordenadas X/Y são em milímetros (mm) no PDF:

- **nome**: Posição do nome da aluna
- **cpf**: Posição do CPF formatado
- **data**: Posição da data de conclusão
- **carga_horaria**: Posição da carga horária

### Configuração de Fontes

- **size**: Tamanho da fonte em pontos
- **color**: Cor em formato hexadecimal (#000000)
- **family**: Família da fonte (helvetica, times, courier)

## Exemplo de Configuração Completa

```json
{
  "edicao": "2024.2",
  "templateUrl": "/assets/certificados/template_2024_2.jpg",
  "ativo": true,
  "posicoes": {
    "nome": { "x": 150, "y": 180 },
    "cpf": { "x": 150, "y": 220 },
    "data": { "x": 150, "y": 260 },
    "carga_horaria": { "x": 150, "y": 300 }
  },
  "fontes": {
    "nome": { "size": 18, "color": "#2D3748", "family": "helvetica" },
    "cpf": { "size": 14, "color": "#4A5568", "family": "helvetica" },
    "data": { "size": 14, "color": "#4A5568", "family": "helvetica" },
    "carga_horaria": { "size": 14, "color": "#4A5568", "family": "helvetica" }
  }
}
```

## Próximos Passos

### Para usar o sistema:

1. **Executar migration do banco** (quando possível):

   ```bash
   npx prisma migrate dev --name add-certificates-system
   ```

2. **Fazer upload do template de certificado**:

   - Salvar imagem em `public/assets/certificados/`
   - Ou usar a API de upload

3. **Criar configuração inicial**:

   - Usar API ou inserir diretamente no banco
   - Ajustar posições conforme o template

4. **Testar envio**:
   - Selecionar alunas no painel
   - Enviar certificados de teste

### Melhorias Futuras:

- Interface visual para posicionar campos (drag & drop)
- Múltiplos templates por edição
- Preview do certificado antes do envio
- Relatórios de certificados enviados
- Templates personalizáveis por curso

## Troubleshooting

### Erro: "Nenhuma configuração de certificado ativa encontrada"

- Verificar se existe registro em `certificados_config` com `ativo = true`
- Criar configuração inicial usando a API

### Erro: "Erro ao carregar imagem do template"

- Verificar se o arquivo existe em `public/assets/certificados/`
- Verificar se a URL está correta na configuração
- Testar acesso direto ao arquivo no navegador

### Erro de envio de email:

- Verificar configurações SMTP no `.env`
- Verificar logs do servidor para detalhes específicos
- Testar configuração de email separadamente
