"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Users,
  Filter,
  Send,
  Eye,
  X,
  Info,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Filters {
  escolaridade?: string;
  situacao_trabalho?: string;
  cidade?: string;
  estado?: string;
  experiencia_tech?: string;
}

interface EmailResult {
  email: string;
  nome: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailResponse {
  success: boolean;
  totalRecipients: number;
  successCount: number;
  errorCount: number;
  results: EmailResult[];
  errors: EmailResult[];
}

const VARIABLES_HELP = [
  { variable: "{{nome}}", description: "Nome completo da candidata" },
  { variable: "{{email}}", description: "Email da candidata" },
  { variable: "{{telefone}}", description: "Telefone da candidata" },
  { variable: "{{cidade}}", description: "Cidade da candidata" },
  { variable: "{{estado}}", description: "Estado da candidata" },
  { variable: "{{escolaridade}}", description: "Nível de escolaridade" },
  {
    variable: "{{situacao_trabalho}}",
    description: "Situação de trabalho atual",
  },
  {
    variable: "{{experiencia_tech}}",
    description: "Experiência com tecnologia",
  },
  {
    variable: "{{data_inscricao}}",
    description: "Data da inscrição (formatada)",
  },
];

export default function EmailManager() {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [emailResults, setEmailResults] = useState<EmailResponse | null>(null);

  // Preview do conteúdo personalizado
  const getPreviewContent = () => {
    const sampleData = {
      nome: "Maria Silva",
      email: "maria@exemplo.com",
      telefone: "(11) 99999-9999",
      cidade: "São Paulo",
      estado: "SP",
      escolaridade: "Ensino Superior Completo",
      situacao_trabalho: "Empregada",
      experiencia_tech: "Básica",
      data_inscricao: new Date().toLocaleDateString("pt-BR"),
    };

    let preview = htmlContent;
    Object.entries(sampleData).forEach(([key, value]) => {
      const variable = `{{${key}}}`;
      preview = preview.replace(new RegExp(variable, "g"), value);
    });

    return preview;
  };

  // Buscar quantidade de destinatários com base nos filtros
  const fetchRecipientCount = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/monitor/inscricoes?${params}`);
      const inscricoes = await response.json();

      if (Array.isArray(inscricoes)) {
        setRecipientCount(inscricoes.length);
      }
    } catch (error) {
      console.error("Erro ao buscar destinatários:", error);
    }
  };

  // Efeito para atualizar contagem quando filtros mudam
  useEffect(() => {
    if (showFilters || Object.keys(filters).length > 0) {
      fetchRecipientCount();
    } else {
      fetchRecipientCount(); // Buscar total sem filtros
    }
  }, [filters, showFilters]);

  // Enviar emails
  const handleSendEmails = async () => {
    if (!subject || !htmlContent) {
      alert("Assunto e conteúdo são obrigatórios!");
      return;
    }

    if (!confirm(`Confirma o envio para ${recipientCount} destinatários?`)) {
      return;
    }

    setIsLoading(true);
    setEmailResults(null);

    try {
      const response = await fetch("/api/monitor/send-mass-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          htmlContent,
          textContent,
          filters,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar emails");
      }

      setEmailResults(result);
    } catch (error) {
      alert(
        `Erro ao enviar emails: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Inserir variável no cursor
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(
      "htmlContent"
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setHtmlContent(newText);

      // Restaurar posição do cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filtros de Destinatários</h2>
              <p className="text-sm text-gray-600">Selecione quem receberá o email</p>
            </div>
          </div>
          
          {recipientCount !== null && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-semibold text-gray-900">{recipientCount}</span>
                <span className="text-sm text-gray-600">destinatários</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">Opções de Filtragem</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {showFilters ? "Ocultar" : "Mostrar"} Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="escolaridade">Escolaridade</Label>
                <Select
                  value={filters.escolaridade || ""}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      escolaridade: value || undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="Ensino Fundamental Incompleto">
                      Ensino Fundamental Incompleto
                    </SelectItem>
                    <SelectItem value="Ensino Fundamental Completo">
                      Ensino Fundamental Completo
                    </SelectItem>
                    <SelectItem value="Ensino Médio Incompleto">
                      Ensino Médio Incompleto
                    </SelectItem>
                    <SelectItem value="Ensino Médio Completo">
                      Ensino Médio Completo
                    </SelectItem>
                    <SelectItem value="Ensino Superior Incompleto">
                      Ensino Superior Incompleto
                    </SelectItem>
                    <SelectItem value="Ensino Superior Completo">
                      Ensino Superior Completo
                    </SelectItem>
                    <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="situacao_trabalho">Situação de Trabalho</Label>
                <Select
                  value={filters.situacao_trabalho || ""}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      situacao_trabalho: value || undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="Empregada">Empregada</SelectItem>
                    <SelectItem value="Desempregada">Desempregada</SelectItem>
                    <SelectItem value="Estudante">Estudante</SelectItem>
                    <SelectItem value="Autônoma">Autônoma</SelectItem>
                    <SelectItem value="Do lar">Do lar</SelectItem>
                    <SelectItem value="Aposentada">Aposentada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experiencia_tech">
                  Experiência com Tecnologia
                </Label>
                <Select
                  value={filters.experiencia_tech || ""}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      experiencia_tech: value || undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="Básica">Básica</SelectItem>
                    <SelectItem value="Intermediária">Intermediária</SelectItem>
                    <SelectItem value="Avançada">Avançada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Filtrar por cidade"
                  value={filters.cidade || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      cidade: e.target.value || undefined,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="Filtrar por estado (ex: SP)"
                  value={filters.estado || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      estado: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
                className="hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Composição do Email */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Composição do Email</h2>
              <p className="text-sm text-gray-600">Monte sua mensagem personalizada</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVariables(!showVariables)}
              className="hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <Info className="w-4 h-4 mr-2" />
              Variáveis
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? "Editar" : "Preview"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Ajuda de Variáveis */}
          {showVariables && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    Variáveis disponíveis para personalização:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {VARIABLES_HELP.map(({ variable, description }) => (
                      <div key={variable} className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 font-mono text-xs"
                          onClick={() => insertVariable(variable)}
                        >
                          {variable}
                        </Button>
                        <span className="text-muted-foreground">
                          {description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!previewMode ? (
            // Modo de Edição
            <>
              <div>
                <Label htmlFor="subject">Assunto do Email</Label>
                <Input
                  id="subject"
                  placeholder="Assunto do email (pode usar variáveis como {{nome}})"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="htmlContent">Conteúdo HTML</Label>
                <Textarea
                  id="htmlContent"
                  placeholder="Conteúdo do email em HTML (pode usar variáveis como {{nome}}, {{cidade}}, etc.)"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="textContent">Conteúdo Texto (opcional)</Label>
                <Textarea
                  id="textContent"
                  placeholder="Versão em texto simples do email (será gerada automaticamente se não fornecida)"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                />
              </div>
            </>
          ) : (
            // Modo Preview
            <div className="space-y-4">
              <div>
                <Label>Preview do Assunto:</Label>
                <div className="p-3 bg-muted rounded border">
                  {subject.replace(/\{\{nome\}\}/g, "Maria Silva")}
                </div>
              </div>

              <div>
                <Label>Preview do Conteúdo:</Label>
                <div
                  className="p-4 bg-muted rounded border max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Envio */}
      <div className="flex justify-center">
        <Button
          onClick={handleSendEmails}
          disabled={
            !subject || !htmlContent || isLoading || recipientCount === 0
          }
          size="lg"
          className="w-full max-w-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar para {recipientCount || 0} destinatários
            </>
          )}
        </Button>
      </div>

      {/* Resultados do Envio */}
      {emailResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Resultados do Envio
              {emailResults.errorCount === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {emailResults.successCount}
                </div>
                <div className="text-sm text-green-700">
                  Enviados com sucesso
                </div>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {emailResults.errorCount}
                </div>
                <div className="text-sm text-red-700">Erros</div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {emailResults.totalRecipients}
                </div>
                <div className="text-sm text-blue-700">
                  Total de destinatários
                </div>
              </div>
            </div>

            {emailResults.errors.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h4 className="font-medium text-red-600 mb-2">
                  Erros encontrados:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {emailResults.errors.map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded">
                      <strong>{error.nome}</strong> ({error.email}):{" "}
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
