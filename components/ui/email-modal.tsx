"use client";

import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EscolaSelector from "@/components/ui/escola-selector";
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
  FileText,
  School,
  Calendar,
  BookOpen,
  GraduationCap,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface Inscricao {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nome_responsavel: string;
  telefone_whatsapp: string;
  escolaridade: string;
  ano_escolar: string;
  escola: string;
  status: "INSCRITA" | "MATRICULADA" | "CANCELADA" | "EXCEDENTE";
  curso: string;
  created_at: string;
}

interface Filters {
  status: string[];
  curso: string[];
  escolaridade: string[];
  escola: string;
  anoEscolar: string[];
  cidade: string;
  estado: string;
  idadeMin: string;
  idadeMax: string;
}

interface EmailResult {
  email: string;
  nome: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  allInscricoes: Inscricao[];
  monitorName: string;
}

export function EmailModal({
  isOpen,
  onClose,
  allInscricoes,
  monitorName,
}: EmailModalProps) {
  const [filters, setFilters] = useState<Filters>({
    status: [],
    curso: [],
    escolaridade: [],
    escola: "",
    anoEscolar: [],
    cidade: "",
    estado: "",
    idadeMin: "",
    idadeMax: "",
  });

  const [filteredData, setFilteredData] = useState<Inscricao[]>([]);
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Opções para os filtros
  const statusOptions = ["INSCRITA", "MATRICULADA", "EXCEDENTE", "CANCELADA"];
  const cursoOptions = ["Jogos", "Robótica"];
  const escolaridadeOptions = [
    "Ensino Fundamental",
    "Ensino Médio",
    "Ensino Superior",
    "Pós-graduação",
  ];
  const anoEscolarOptions = [
    "6º ano",
    "7º ano",
    "8º ano",
    "9º ano",
    "1º ano EM",
    "2º ano EM",
    "3º ano EM",
    "Ensino Superior",
    "Pós-graduação",
  ];

  // Templates predefinidos
  const templates = [
    {
      name: "Confirmação de Matrícula",
      subject: "🎉 Sua matrícula foi confirmada - Mermãs Digitais",
      html: `
        <h2>Parabéns, {{nome}}!</h2>
        <p>Sua matrícula no curso de <strong>{{curso}}</strong> foi confirmada!</p>
        <p>Detalhes da matrícula:</p>
        <ul>
          <li><strong>Nome:</strong> {{nome}}</li>
          <li><strong>Curso:</strong> {{curso}}</li>
          <li><strong>Email:</strong> {{email}}</li>
        </ul>
        <p>Em breve você receberá mais informações sobre o início das aulas.</p>
        <p>Atenciosamente,<br>Equipe Mermãs Digitais</p>
      `,
      text: `Parabéns, {{nome}}! Sua matrícula no curso de {{curso}} foi confirmada! Em breve você receberá mais informações.`,
    },
    {
      name: "Lembrete de Documentação",
      subject: "📄 Documentação Pendente - Mermãs Digitais",
      html: `
        <h2>Olá, {{nome}}!</h2>
        <p>Notamos que alguns documentos ainda estão pendentes para finalizar sua inscrição.</p>
        <p>Por favor, acesse nossa plataforma e envie os documentos necessários.</p>
        <p>Seus dados:</p>
        <ul>
          <li><strong>Nome:</strong> {{nome}}</li>
          <li><strong>Email:</strong> {{email}}</li>
          <li><strong>Curso:</strong> {{curso}}</li>
        </ul>
        <p>Caso tenha dúvidas, entre em contato conosco.</p>
        <p>Atenciosamente,<br>Equipe Mermãs Digitais</p>
      `,
      text: `Olá, {{nome}}! Alguns documentos ainda estão pendentes. Por favor, acesse nossa plataforma e envie os documentos necessários.`,
    },
    {
      name: "Comunicado Geral",
      subject: "📢 Comunicado Importante - Mermãs Digitais",
      html: `
        <h2>Olá, {{nome}}!</h2>
        <p>Esperamos que você esteja bem!</p>
        <p>Gostaríamos de compartilhar uma informação importante sobre o programa Mermãs Digitais.</p>
        <p>[INSIRA SEU COMUNICADO AQUI]</p>
        <p>Seus dados de contato:</p>
        <ul>
          <li><strong>Nome:</strong> {{nome}}</li>
          <li><strong>Email:</strong> {{email}}</li>
          <li><strong>Telefone:</strong> {{telefone_whatsapp}}</li>
        </ul>
        <p>Atenciosamente,<br>Equipe Mermãs Digitais</p>
      `,
      text: `Olá, {{nome}}! Gostaríamos de compartilhar uma informação importante. [INSIRA SEU COMUNICADO AQUI]`,
    },
  ];

  // Função para calcular idade
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...allInscricoes];

    // Filtro por status
    if (filters.status.length > 0) {
      filtered = filtered.filter((item) =>
        filters.status.includes(item.status)
      );
    }

    // Filtro por curso
    if (filters.curso.length > 0) {
      filtered = filtered.filter((item) => filters.curso.includes(item.curso));
    }

    // Filtro por escolaridade
    if (filters.escolaridade.length > 0) {
      filtered = filtered.filter((item) =>
        filters.escolaridade.includes(item.escolaridade)
      );
    }

    // Filtro por escola
    if (filters.escola) {
      filtered = filtered.filter((item) =>
        item.escola?.toLowerCase().includes(filters.escola.toLowerCase())
      );
    }

    // Filtro por ano escolar
    if (filters.anoEscolar.length > 0) {
      filtered = filtered.filter((item) =>
        filters.anoEscolar.includes(item.ano_escolar)
      );
    }

    // Filtro por cidade
    if (filters.cidade) {
      filtered = filtered.filter((item) =>
        item.cidade?.toLowerCase().includes(filters.cidade.toLowerCase())
      );
    }

    // Filtro por estado
    if (filters.estado) {
      filtered = filtered.filter((item) =>
        item.estado?.toLowerCase().includes(filters.estado.toLowerCase())
      );
    }

    // Filtro por idade
    if (filters.idadeMin || filters.idadeMax) {
      filtered = filtered.filter((item) => {
        if (!item.data_nascimento) return false;
        const age = calculateAge(item.data_nascimento);
        const minAge = filters.idadeMin ? parseInt(filters.idadeMin) : 0;
        const maxAge = filters.idadeMax ? parseInt(filters.idadeMax) : 150;
        return age >= minAge && age <= maxAge;
      });
    }

    setFilteredData(filtered);
  }, [filters, allInscricoes]);

  // Funções para manipular filtros
  const toggleArrayFilter = (filterType: keyof Filters, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[filterType] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [filterType]: newArray };
    });
  };

  const setStringFilter = (filterType: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      curso: [],
      escolaridade: [],
      escola: "",
      anoEscolar: [],
      cidade: "",
      estado: "",
      idadeMin: "",
      idadeMax: "",
    });
  };

  // Contar filtros ativos
  const activeFiltersCount = Object.values(filters).reduce((count, filter) => {
    if (Array.isArray(filter)) {
      return count + filter.length;
    }
    return count + (filter ? 1 : 0);
  }, 0);

  // Aplicar template
  const applyTemplate = (template: (typeof templates)[0]) => {
    setSubject(template.subject);
    setHtmlContent(template.html);
    setTextContent(template.text);
  };

  // Função para substituir variáveis no preview
  const replaceVariables = (template: string, data: Inscricao): string => {
    let result = template;
    const variables = {
      "{{nome}}": data.nome || "",
      "{{email}}": data.email || "",
      "{{telefone_whatsapp}}": data.telefone_whatsapp || "",
      "{{curso}}": data.curso || "",
      "{{escolaridade}}": data.escolaridade || "",
      "{{escola}}": data.escola || "",
      "{{cidade}}": data.cidade || "",
      "{{estado}}": data.estado || "",
      "{{cpf}}": data.cpf || "",
      "{{data_nascimento}}": data.data_nascimento
        ? new Date(data.data_nascimento).toLocaleDateString("pt-BR")
        : "",
      "{{nome_responsavel}}": data.nome_responsavel || "",
      "{{ano_escolar}}": data.ano_escolar || "",
      "{{status}}": data.status || "",
      "{{endereco}}": `${data.logradouro || ""}, ${data.numero || ""}${
        data.complemento ? ` - ${data.complemento}` : ""
      } - ${data.bairro || ""}, ${data.cidade || ""} - ${
        data.estado || ""
      }, CEP: ${data.cep || ""}`,
    };

    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(
        new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        value
      );
    });

    return result;
  };

  // Enviar emails
  const sendEmails = async () => {
    if (!subject.trim() || (!htmlContent.trim() && !textContent.trim())) {
      alert("Por favor, preencha o assunto e o conteúdo do email.");
      return;
    }

    if (filteredData.length === 0) {
      alert("Nenhum destinatário foi selecionado com os filtros aplicados.");
      return;
    }

    setIsSending(true);
    setShowResults(false);

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
          recipients: filteredData.map((item) => ({
            email: item.email,
            nome: item.nome,
            data: item,
          })),
          filters,
          monitorEmail: "monitor@email.com", // Aqui você pode passar o email do monitor
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResults(result.results || []);
        setShowResults(true);
      } else {
        throw new Error(result.error || "Erro ao enviar emails");
      }
    } catch (error) {
      console.error("Erro ao enviar emails:", error);
      alert("Erro ao enviar emails. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] flex flex-col bg-gradient-to-br from-white to-gray-50 p-0 overflow-hidden">
        <DialogHeader className="border-b border-gray-200 px-6 py-4 flex-shrink-0 bg-white">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
              <Mail className="w-5 h-5 text-white" />
            </div>
            Envio de Email em Massa
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Configure os filtros, selecione um template ou crie seu próprio
            email para enviar para as alunas selecionadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-6">
          <div className="space-y-6 py-6">
            {showResults ? (
              // Resultados do envio
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Resultados do Envio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {results.filter((r) => r.success).length}
                          </div>
                          <div className="text-sm text-green-700">
                            Enviados com sucesso
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {results.filter((r) => !r.success).length}
                          </div>
                          <div className="text-sm text-red-700">
                            Falha no envio
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {results.length}
                          </div>
                          <div className="text-sm text-blue-700">
                            Total de tentativas
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
                        >
                          <div className="flex items-center gap-3">
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <div>
                              <div className="font-medium text-sm">
                                {result.nome}
                              </div>
                              <div className="text-xs text-gray-500">
                                {result.email}
                              </div>
                            </div>
                          </div>
                          {result.error && (
                            <div className="text-xs text-red-600 max-w-xs truncate">
                              {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowResults(false)}
                        variant="outline"
                      >
                        Enviar Novos Emails
                      </Button>
                      <Button onClick={onClose}>Fechar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Templates Predefinidos */}
                <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Templates Predefinidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {templates.map((template, index) => (
                        <Card
                          key={index}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => applyTemplate(template)}
                        >
                          <CardContent className="p-4">
                            <div className="font-semibold text-sm mb-2">
                              {template.name}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {template.subject}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Filtros */}
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-900">
                          Filtros de Destinatários
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700"
                          >
                            {activeFiltersCount} filtro(s) ativo(s)
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Limpar
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Status */}
                      <Card className="p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-green-600" />
                          <Label className="font-semibold text-gray-700">
                            Status
                          </Label>
                        </div>
                        <div className="space-y-2">
                          {statusOptions.map((status) => (
                            <div
                              key={status}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`status-${status}`}
                                checked={filters.status.includes(status)}
                                onCheckedChange={() =>
                                  toggleArrayFilter("status", status)
                                }
                              />
                              <Label
                                htmlFor={`status-${status}`}
                                className="text-sm"
                              >
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Curso */}
                      <Card className="p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          <Label className="font-semibold text-gray-700">
                            Curso
                          </Label>
                        </div>
                        <div className="space-y-2">
                          {cursoOptions.map((curso) => (
                            <div
                              key={curso}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`curso-${curso}`}
                                checked={filters.curso.includes(curso)}
                                onCheckedChange={() =>
                                  toggleArrayFilter("curso", curso)
                                }
                              />
                              <Label
                                htmlFor={`curso-${curso}`}
                                className="text-sm"
                              >
                                {curso}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Escolaridade */}
                      <Card className="p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <Label className="font-semibold text-gray-700">
                            Escolaridade
                          </Label>
                        </div>
                        <div className="space-y-2">
                          {escolaridadeOptions.map((esc) => (
                            <div
                              key={esc}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`esc-${esc}`}
                                checked={filters.escolaridade.includes(esc)}
                                onCheckedChange={() =>
                                  toggleArrayFilter("escolaridade", esc)
                                }
                              />
                              <Label htmlFor={`esc-${esc}`} className="text-sm">
                                {esc}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {/* Preview de destinatários */}
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-900">
                          {filteredData.length} destinatário(s) selecionado(s)
                        </span>
                      </div>
                      {filteredData.length > 0 && (
                        <div className="text-sm text-green-700">
                          {filteredData
                            .slice(0, 3)
                            .map((item) => item.nome)
                            .join(", ")}
                          {filteredData.length > 3 &&
                            ` e mais ${filteredData.length - 3}`}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Conteúdo do Email */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Conteúdo do Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Assunto do email..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="htmlContent">Conteúdo HTML</Label>
                      <Textarea
                        id="htmlContent"
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        placeholder="Conteúdo do email em HTML..."
                        className="mt-1 min-h-32"
                        rows={8}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {
                          "Variáveis disponíveis: {{nome}}, {{email}}, {{curso}}, {{telefone_whatsapp}}, {{cidade}}, {{estado}}, etc."
                        }
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="textContent">
                        Conteúdo Texto (fallback)
                      </Label>
                      <Textarea
                        id="textContent"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Versão em texto simples do email..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    {/* Preview */}
                    {filteredData.length > 0 &&
                      (subject || htmlContent || textContent) && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            <Eye className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold">
                              Preview para: {filteredData[0].nome}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold">Assunto: </span>
                              {replaceVariables(subject, filteredData[0])}
                            </div>
                            {htmlContent && (
                              <div>
                                <span className="font-semibold">
                                  Conteúdo:{" "}
                                </span>
                                <div
                                  className="mt-2 p-3 bg-white rounded border text-sm"
                                  dangerouslySetInnerHTML={{
                                    __html: replaceVariables(
                                      htmlContent,
                                      filteredData[0]
                                    ),
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {!showResults && (
              <Button
                onClick={sendEmails}
                disabled={
                  isSending || filteredData.length === 0 || !subject.trim()
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para {filteredData.length} destinatário(s)
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
