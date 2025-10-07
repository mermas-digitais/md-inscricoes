"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  Plus,
  ChevronDown,
  ChevronUp,
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
  message: string;
  results?: EmailResult[];
  sent?: number;
  failed?: number;
}

export default function EmailManager() {
  const [filters, setFilters] = useState<Filters>({});
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailResponse | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showVariables, setShowVariables] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Variáveis disponíveis para personalização
  const availableVariables = [
    { name: "{{nome}}", description: "Nome da pessoa" },
    { name: "{{email}}", description: "Email da pessoa" },
    { name: "{{telefone}}", description: "Telefone (se disponível)" },
    { name: "{{cidade}}", description: "Cidade (se disponível)" },
    { name: "{{escolaridade}}", description: "Escolaridade (se disponível)" },
    {
      name: "{{experiencia_tech}}",
      description: "Experiência em tech (se disponível)",
    },
    { name: "{{role}}", description: "Tipo (Candidata/Monitor)" },
  ];

  // Preview do conteúdo personalizado
  const getPreviewContent = () => {
    const sampleData = {
      "{{nome}}": "Maria Silva",
      "{{email}}": "maria@email.com",
      "{{telefone}}": "(11) 99999-9999",
      "{{cidade}}": "São Paulo",
      "{{escolaridade}}": "Ensino Superior Completo",
      "{{experiencia_tech}}": "Intermediário",
      "{{role}}": "Candidata",
    };

    let preview = htmlContent;
    Object.entries(sampleData).forEach(([variable, value]) => {
      preview = preview.replace(new RegExp(variable, "g"), value);
    });

    return preview;
  };

  const getPreviewSubject = () => {
    const sampleData = {
      "{{nome}}": "Maria Silva",
      "{{email}}": "maria@email.com",
      "{{telefone}}": "(11) 99999-9999",
      "{{cidade}}": "São Paulo",
      "{{escolaridade}}": "Ensino Superior Completo",
      "{{experiencia_tech}}": "Intermediário",
      "{{role}}": "Candidata",
    };

    let preview = subject;
    Object.entries(sampleData).forEach(([variable, value]) => {
      preview = preview.replace(new RegExp(variable, "g"), value);
    });

    return preview;
  };

  // Buscar contagem de destinatários baseado nos filtros
  useEffect(() => {
    const fetchRecipientCount = async () => {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const response = await fetch(
          `/api/matriculas/inscricoes?count=true&${params}`
        );
        const data = await response.json();
        setRecipientCount(data.total || 0);
      } catch (error) {
        console.error("Erro ao buscar contagem:", error);
        setRecipientCount(0);
      }
    };

    fetchRecipientCount();
  }, [filters]);

  const handleSendEmail = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      alert("Por favor, preencha o assunto e o conteúdo do email.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/matriculas/send-mass-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          htmlContent,
          filters,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Erro ao enviar emails:", error);
      setResult({
        success: false,
        message: "Erro interno do servidor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(
      "htmlContent"
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);

      setHtmlContent(before + variable + after);

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
              <h2 className="text-lg font-semibold text-gray-900">
                Filtros de Destinatários
              </h2>
              <p className="text-sm text-gray-600">
                Selecione quem receberá o email
              </p>
            </div>
          </div>

          {recipientCount !== null && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {recipientCount}
                </span>
                <span className="text-sm text-gray-600">destinatários</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">
            Opções de Filtragem
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {showFilters ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Ocultar Filtros
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Mostrar Filtros
              </>
            )}
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
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experiencia_tech">Experiência em Tech</Label>
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
                    <SelectItem value="Básico">Básico</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
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
                  placeholder="Ex: SP"
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
              <h2 className="text-lg font-semibold text-gray-900">
                Composição do Email
              </h2>
              <p className="text-sm text-gray-600">
                Monte sua mensagem personalizada
              </p>
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
              className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Editar" : "Preview"}
            </Button>
          </div>
        </div>

        {/* Painel de Variáveis */}
        {showVariables && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Variáveis Disponíveis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableVariables.map((variable) => (
                <button
                  key={variable.name}
                  onClick={() => insertVariable(variable.name)}
                  className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded group-hover:bg-blue-200">
                      {variable.name}
                    </code>
                    <Plus className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-600">
                    {variable.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!previewMode ? (
            <>
              {/* Formulário de Edição */}
              <div>
                <Label htmlFor="subject">Assunto do Email</Label>
                <Input
                  id="subject"
                  placeholder="Ex: Bem-vinda ao programa, {{nome}}!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="htmlContent">Conteúdo do Email (HTML)</Label>
                <Textarea
                  id="htmlContent"
                  placeholder="Ex: Olá {{nome}}, esperamos você no nosso programa..."
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </>
          ) : (
            <>
              {/* Modo Preview */}
              <div className="space-y-4">
                <div>
                  <Label>Preview do Assunto:</Label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium">
                      {getPreviewSubject() || "Sem assunto"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Preview do Conteúdo:</Label>
                  <div
                    className="mt-1 p-4 bg-gray-50 border border-gray-200 rounded-lg prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botão de Envio */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={handleSendEmail}
            disabled={
              isLoading ||
              !subject.trim() ||
              !htmlContent.trim() ||
              recipientCount === 0
            }
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 hover:shadow-lg hover:shadow-pink-200 hover:scale-105 transition-all duration-300 px-6 py-2.5 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar para {recipientCount} destinatários
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                result.success ? "bg-green-50" : "bg-red-50"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Resultado do Envio
              </h2>
              <p className="text-sm text-gray-600">{result.message}</p>
            </div>
          </div>

          {result.success && result.results && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {result.sent} enviados
                  </span>
                </div>
                {result.failed && result.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {result.failed} falharam
                    </span>
                  </div>
                )}
              </div>

              {result.results.some((r) => !r.success) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Erros:
                  </h4>
                  <div className="space-y-2">
                    {result.results
                      .filter((r) => !r.success)
                      .map((error, index) => (
                        <div
                          key={index}
                          className="text-sm p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <strong className="text-red-800">
                              {error.nome}
                            </strong>
                            <span className="text-red-600">
                              ({error.email})
                            </span>
                          </div>
                          <p className="text-red-700 text-xs">{error.error}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
