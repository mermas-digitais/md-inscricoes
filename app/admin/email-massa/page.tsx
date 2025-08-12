"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Mail,
  Send,
  Users,
  Filter,
  Eye,
  Settings,
  Palette,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Inscricao {
  id: string;
  nome: string;
  email: string;
  curso: string;
  status: string;
  escolaridade: string;
  created_at: string;
}

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

const predefinedTemplates = {
  confirmacao: {
    subject: "Confirmação de Inscrição - {{nome}}",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; font-size: 28px; margin: 0;">MD Inscrições</h1>
            <p style="color: #64748b; margin: 10px 0 0 0;">Sistema de Inscrições</p>
          </div>
          
          <h2 style="color: #334155; font-size: 24px; margin-bottom: 20px;">Olá, {{nome}}!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Sua inscrição foi confirmada com sucesso! Estamos muito felizes em tê-lo(a) conosco.
          </p>
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">Próximos Passos</h3>
            <p style="color: #1e40af; margin: 0;">Em breve entraremos em contato com mais informações sobre o processo.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Atenciosamente,<br>
              <strong>Equipe MD Inscrições</strong>
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
Olá, {{nome}}!

Sua inscrição foi confirmada com sucesso! Estamos muito felizes em tê-lo(a) conosco.

Próximos Passos:
Em breve entraremos em contato com mais informações sobre o processo.

Atenciosamente,
Equipe MD Inscrições
    `,
  },
  aprovacao: {
    subject: "Parabéns! Sua inscrição foi aprovada - {{nome}}",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f0fdf4; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; font-size: 28px; margin: 0;">🎉 Parabéns!</h1>
          </div>
          
          <h2 style="color: #334155; font-size: 24px; margin-bottom: 20px;">Olá, {{nome}}!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Temos uma ótima notícia! Sua inscrição foi <strong>aprovada</strong>!
          </p>
          
          <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #16a34a; margin: 0 0 10px 0;">Status: APROVADO ✅</h3>
            <p style="color: #16a34a; margin: 0;">Você foi selecionado(a) para participar do processo!</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px;">
              Equipe MD Inscrições
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
🎉 Parabéns, {{nome}}!

Temos uma ótima notícia! Sua inscrição foi APROVADA!

Status: APROVADO ✅
Você foi selecionado(a) para participar do processo!

Equipe MD Inscrições
    `,
  },
};

export default function EmailMassa() {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [filteredInscricoes, setFilteredInscricoes] = useState<Inscricao[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    curso: "todos",
    status: "todos",
    escolaridade: "todos",
    anoInscricao: "",
  });

  // Email
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>(
    predefinedTemplates.confirmacao
  );
  const [fromName, setFromName] = useState("MD Inscrições");
  const [showPreview, setShowPreview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sendResults, setSendResults] = useState<any>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Carregar inscrições
  const loadInscricoes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "todos") {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/inscricoes?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setInscricoes(data.inscricoes);
        setFilteredInscricoes(data.inscricoes);
      } else {
        throw new Error(data.error || "Erro ao carregar inscrições");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar inscrições",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInscricoes();
  }, [filters]);

  // Aplicar template predefinido
  const applyTemplate = (templateKey: keyof typeof predefinedTemplates) => {
    setEmailTemplate(predefinedTemplates[templateKey]);
  };

  // Selecionar/deselecionar todos
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInscricoes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInscricoes.map((i) => i.id));
    }
  };

  // Enviar emails
  const sendBulkEmail = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um destinatário",
        variant: "destructive",
      });
      return;
    }

    if (!emailTemplate.subject || !emailTemplate.htmlContent) {
      toast({
        title: "Erro",
        description: "Preencha o assunto e conteúdo do email",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/admin/send-bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientIds: selectedIds,
          subject: emailTemplate.subject,
          htmlContent: emailTemplate.htmlContent,
          textContent: emailTemplate.textContent,
          fromName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSendResults(result);
        setShowResults(true);
        setSelectedIds([]);
        toast({
          title: "Sucesso",
          description: `${result.totalSent} emails enviados com sucesso!`,
          variant: "success",
        });
      } else {
        throw new Error(result.error || "Erro ao enviar emails");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar emails",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pendente: "bg-yellow-100 text-yellow-800",
      aprovado: "bg-blue-100 text-blue-800",
      matriculado: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
    } as const;

    return (
      <Badge
        className={
          colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email em Massa</h1>
            <p className="text-gray-600">
              Envie emails personalizados para múltiplos inscritos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filtros e Lista de Destinatários */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Curso</Label>
                <Select
                  value={filters.curso}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, curso: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os cursos</SelectItem>
                    <SelectItem value="Informática">Informática</SelectItem>
                    <SelectItem value="Administração">Administração</SelectItem>
                    <SelectItem value="Contabilidade">Contabilidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="matriculado">Matriculado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Escolaridade</Label>
                <Select
                  value={filters.escolaridade}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, escolaridade: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="Ensino Fundamental">
                      Ensino Fundamental
                    </SelectItem>
                    <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                    <SelectItem value="Ensino Superior">
                      Ensino Superior
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ano de Inscrição</Label>
                <Input
                  type="number"
                  placeholder="2025"
                  value={filters.anoInscricao}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      anoInscricao: e.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Destinatários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Destinatários ({filteredInscricoes.length})
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedIds.length} selecionados
                  </span>
                  <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                    {selectedIds.length === filteredInscricoes.length
                      ? "Desmarcar todos"
                      : "Selecionar todos"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Carregando inscrições...</p>
                </div>
              ) : filteredInscricoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma inscrição encontrada com os filtros aplicados
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredInscricoes.map((inscricao) => (
                    <div
                      key={inscricao.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        selectedIds.includes(inscricao.id)
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedIds.includes(inscricao.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds((prev) => [...prev, inscricao.id]);
                            } else {
                              setSelectedIds((prev) =>
                                prev.filter((id) => id !== inscricao.id)
                              );
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{inscricao.nome}</p>
                          <p className="text-sm text-gray-600">
                            {inscricao.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(inscricao.status)}
                        <Badge variant="outline" className="text-xs">
                          {inscricao.curso}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor de Email */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Composição do Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Templates Predefinidos */}
              <div>
                <Label>Templates Predefinidos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyTemplate("confirmacao")}
                    className="text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Confirmação
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyTemplate("aprovacao")}
                    className="text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aprovação
                  </Button>
                </div>
              </div>

              {/* Remetente */}
              <div>
                <Label>Nome do Remetente</Label>
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="MD Inscrições"
                />
              </div>

              {/* Assunto */}
              <div>
                <Label>Assunto</Label>
                <Input
                  value={emailTemplate.subject}
                  onChange={(e) =>
                    setEmailTemplate((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Assunto do email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use <code>{"{{nome}}"}</code> e <code>{"{{email}}"}</code>{" "}
                  para personalização
                </p>
              </div>

              {/* Conteúdo */}
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visual">Visual</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="space-y-4">
                  <div>
                    <Label>Conteúdo (Texto Simples)</Label>
                    <Textarea
                      value={emailTemplate.textContent}
                      onChange={(e) =>
                        setEmailTemplate((prev) => ({
                          ...prev,
                          textContent: e.target.value,
                        }))
                      }
                      placeholder="Conteúdo em texto simples..."
                      rows={8}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="html" className="space-y-4">
                  <div>
                    <Label>Conteúdo HTML</Label>
                    <Textarea
                      value={emailTemplate.htmlContent}
                      onChange={(e) =>
                        setEmailTemplate((prev) => ({
                          ...prev,
                          htmlContent: e.target.value,
                        }))
                      }
                      placeholder="<p>Conteúdo HTML...</p>"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={sendBulkEmail}
                  disabled={sending || selectedIds.length === 0}
                  className="flex-1"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar ({selectedIds.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p>
                <strong>De:</strong> {fromName}
              </p>
              <p>
                <strong>Assunto:</strong>{" "}
                {emailTemplate.subject.replace(/\{\{nome\}\}/g, "João Silva")}
              </p>
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html: emailTemplate.htmlContent
                  .replace(/\{\{nome\}\}/g, "João Silva")
                  .replace(/\{\{email\}\}/g, "joao@exemplo.com"),
              }}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Resultados */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resultados do Envio</DialogTitle>
          </DialogHeader>
          {sendResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {sendResults.totalSent}
                  </p>
                  <p className="text-sm text-green-700">Enviados</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {sendResults.totalErrors}
                  </p>
                  <p className="text-sm text-red-700">Erros</p>
                </div>
              </div>

              {sendResults.errors && sendResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Erros:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {sendResults.errors.map((error: any, index: number) => (
                      <p key={index} className="text-sm text-red-600">
                        {error.email}: {error.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowResults(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
