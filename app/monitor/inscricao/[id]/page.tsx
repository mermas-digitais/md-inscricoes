"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  FileText,
  Upload,
  Eye,
  Copy,
  MessageCircle,
  Camera,
  AlertTriangle,
  CheckCircle,
  Trash2,
  BookOpen,
  Trophy,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileUploader } from "@/components/ui/file-uploader";

interface Inscricao {
  id: string;
  nome: string;
  email: string;
  telefone_whatsapp: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nome_responsavel: string;
  escolaridade: string;
  ano_escolar: string;
  escola: string;
  curso: string;
  status: string;
  documento_rg_cpf: string | null;
  documento_declaracao: string | null;
  documento_termo: string | null;
  created_at: string;
}

export default function DetalheInscricao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedFiles, setDraggedFiles] = useState<Record<string, boolean>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean;
    type: "matricula" | "cancelar" | null;
    title: string;
    description: string;
  }>({
    show: false,
    type: null,
    title: "",
    description: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean;
    type: "rg_cpf" | "declaracao" | "termo" | null;
    fileName: string;
  }>({
    show: false,
    type: null,
    fileName: "",
  });
  const [showScanner, setShowScanner] = useState<{
    show: boolean;
    type: "rg_cpf" | "declaracao" | "termo" | null;
  }>({
    show: false,
    type: null,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const inscricaoId = resolvedParams.id;
  const monitorEmail = searchParams.get("email");

  // Funções de drag & drop
  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedFiles((prev) => ({ ...prev, [type]: true }));
  };

  const handleDragEnter = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedFiles((prev) => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Verificar se realmente saiu da área
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedFiles((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedFiles((prev) => ({ ...prev, [type]: false }));

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.includes("image") || file.type.includes("pdf")) {
        handleFileUpload(type as "rg_cpf" | "declaracao" | "termo", file);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, envie apenas imagens (JPG, PNG) ou PDF.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileAttach = (type: "rg_cpf" | "declaracao" | "termo") => {
    setShowScanner({
      show: true,
      type: type,
    });
  };

  const handleScannerConfirm = (file: File) => {
    if (showScanner.type) {
      handleFileUpload(showScanner.type, file);
    }
    setShowScanner({ show: false, type: null });
  };

  const handleScannerClose = () => {
    setShowScanner({ show: false, type: null });
  };

  const handleDeleteFile = (type: "rg_cpf" | "declaracao" | "termo") => {
    const fieldName = `documento_${type}` as keyof Inscricao;
    const fileName = inscricao?.[fieldName] as string;

    setShowDeleteConfirm({
      show: true,
      type: type,
      fileName: fileName || "arquivo",
    });
  };

  const confirmDeleteFile = async () => {
    if (showDeleteConfirm.type) {
      await handleFileUpload(showDeleteConfirm.type, null);
      setShowDeleteConfirm({ show: false, type: null, fileName: "" });
    }
  };

  const allDocumentsPresent = () => {
    return (
      inscricao?.documento_rg_cpf &&
      inscricao?.documento_declaracao &&
      inscricao?.documento_termo
    );
  };

  const handleConfirmMatricula = () => {
    if (!allDocumentsPresent()) {
      toast({
        title: "Documentos incompletos",
        description:
          "É necessário anexar todos os 3 documentos antes de confirmar a matrícula.",
        variant: "warning",
      });
      return;
    }

    setShowConfirmDialog({
      show: true,
      type: "matricula",
      title: "Confirmar Matrícula",
      description:
        "Tem certeza que deseja confirmar a matrícula desta inscrição? Esta ação não pode ser desfeita.",
    });
  };

  const handleConfirmCancelar = () => {
    setShowConfirmDialog({
      show: true,
      type: "cancelar",
      title: "Cancelar Inscrição",
      description:
        "Tem certeza que deseja cancelar esta inscrição? Esta ação não pode ser desfeita.",
    });
  };

  const executeStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(
        `/api/monitor/inscricoes/${inscricaoId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setInscricao((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast({
          title: "Sucesso",
          description: `Status alterado para ${
            newStatus === "matriculado" ? "Matriculado" : "Cancelado"
          } com sucesso!`,
          variant: "success",
        });
      } else {
        throw new Error("Erro ao alterar status");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status da inscrição.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (
    type: "rg_cpf" | "declaracao" | "termo",
    file: File | null
  ) => {
    if (!file) {
      // Remover arquivo
      try {
        const response = await fetch(`/api/monitor/upload`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inscricaoId,
            fileType: type,
          }),
        });

        if (response.ok) {
          const fieldName = `documento_${type}`;
          setInscricao((prev) =>
            prev ? { ...prev, [fieldName]: null } : null
          );
          toast({
            title: "Sucesso",
            description: "Arquivo removido com sucesso!",
            variant: "success",
          });
        } else {
          throw new Error("Erro ao remover arquivo");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao remover o arquivo.",
          variant: "destructive",
        });
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("inscricaoId", inscricaoId);
    formData.append("fileType", type);

    try {
      const response = await fetch("/api/monitor/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const fieldName = `documento_${type}`;
        setInscricao((prev) =>
          prev ? { ...prev, [fieldName]: data.url } : null
        );
        toast({
          title: "Sucesso",
          description: "Arquivo enviado com sucesso!",
          variant: "success",
        });
      } else {
        throw new Error("Erro no upload");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
      variant: "info",
    });
  };

  const openWhatsApp = (phone: string | undefined | null, name: string) => {
    if (!phone) return;
    const formattedPhone = phone.replace(/\D/g, "");
    const message = `Olá ${name}, tudo bem? Entrando em contato sobre sua inscrição.`;
    const whatsappUrl = `https://wa.me/55${formattedPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const formatPhone = (phone: string | undefined | null) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
        7
      )}`;
    }
    return phone;
  };

  const formatCPF = (cpf: string | undefined | null) => {
    if (!cpf) return "";
    const cleaned = cpf.replace(/\D/g, "");
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "default",
      aprovado: "secondary",
      matriculado: "default",
      cancelado: "destructive",
    } as const;

    const colors = {
      pendente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      aprovado: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      matriculado: "bg-green-100 text-green-800 hover:bg-green-100",
      cancelado: "bg-red-100 text-red-800 hover:bg-red-100",
    } as const;

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || "default"}
        className={colors[status as keyof typeof colors] || ""}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const InfoField = ({
    icon: Icon,
    label,
    value,
    copyable = false,
    whatsapp = false,
    className = "",
  }: {
    icon: any;
    label: string;
    value: string;
    copyable?: boolean;
    whatsapp?: boolean;
    className?: string;
  }) => (
    <div
      className={`group p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-gray-500" />
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {label}
            </p>
          </div>
          <p className="text-gray-900 font-medium">{value}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {copyable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(value, label)}
              className="h-7 w-7 p-0 hover:bg-gray-100"
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
          {whatsapp && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openWhatsApp(value, inscricao?.nome || "")}
              className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
              disabled={!value}
            >
              <MessageCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Componente de upload com drag & drop
  const DocumentUpload = ({
    type,
    currentFile,
    onUpload,
  }: {
    type: "rg_cpf" | "declaracao" | "termo";
    currentFile: string | null;
    onUpload: (file: File) => void;
  }) => {
    const isDragging = draggedFiles[type] || false;

    const getDocumentLabel = (type: string) => {
      switch (type) {
        case "rg_cpf":
          return "RG/CPF";
        case "declaracao":
          return "Declaração Escolar";
        case "termo":
          return "Termo de Responsabilidade";
        default:
          return type;
      }
    };

    const getDocumentDescription = (type: string) => {
      switch (type) {
        case "rg_cpf":
          return "Documento de identidade";
        case "declaracao":
          return "Declaração de matrícula/frequência escolar";
        case "termo":
          return "Termo de responsabilidade assinado";
        default:
          return "Documento";
      }
    };

    if (currentFile) {
      return (
        <div className="border border-gray-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {getDocumentLabel(type)}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {getDocumentDescription(type)}
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(currentFile, "_blank")}
                className="h-7 md:h-8 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Visualizar anexo</span>
                <span className="sm:hidden">Ver</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteFile(type)}
                className="h-7 md:h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`border-2 border-dashed rounded-lg p-4 md:p-6 transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragEnter={(e) => handleDragEnter(e, type)}
        onDragLeave={(e) => handleDragLeave(e, type)}
        onDrop={(e) => handleDrop(e, type)}
      >
        <div className="text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900 text-sm mb-1">
            {getDocumentLabel(type)}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {getDocumentDescription(type)}
          </p>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFileAttach(type)}
              className="h-8 w-full text-xs"
            >
              <Upload className="w-3 h-3 mr-1" />
              Anexar arquivo
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Ou arraste o arquivo aqui
          </p>
        </div>
      </div>
    );
  };

  const loadInscricao = async () => {
    try {
      const response = await fetch(`/api/monitor/inscricoes/${inscricaoId}`);
      if (response.ok) {
        const data = await response.json();
        setInscricao(data);
      } else {
        toast({
          title: "Erro",
          description: "Inscrição não encontrada.",
          variant: "destructive",
        });
        router.push(
          `/monitor${
            monitorEmail ? `?email=${encodeURIComponent(monitorEmail)}` : ""
          }`
        );
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar a inscrição.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInscricao();
  }, [inscricaoId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!inscricao) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Inscrição não encontrada
          </h1>
          <Button
            onClick={() =>
              router.push(
                `/monitor${
                  monitorEmail
                    ? `?email=${encodeURIComponent(monitorEmail)}`
                    : ""
                }`
              )
            }
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                `/monitor${
                  monitorEmail
                    ? `?email=${encodeURIComponent(monitorEmail)}`
                    : ""
                }`
              )
            }
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {inscricao.nome}
            </h1>
            <p className="text-gray-600 text-sm">Detalhes da inscrição</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {getStatusBadge(inscricao.status)}
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:gap-4 sm:grid-cols-2">
              <InfoField
                icon={User}
                label="Nome Completo"
                value={inscricao.nome || ""}
                copyable
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
              />
              <InfoField
                icon={Mail}
                label="E-mail"
                value={inscricao.email || ""}
                copyable
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              />
              <InfoField
                icon={Phone}
                label="WhatsApp do Responsável"
                value={formatPhone(inscricao.telefone_whatsapp)}
                copyable
                whatsapp
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              />
              <InfoField
                icon={User}
                label="Nome do Responsável"
                value={inscricao.nome_responsavel || ""}
                copyable
                className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200"
              />
              <InfoField
                icon={Calendar}
                label="Data de Nascimento"
                value={formatDate(inscricao.data_nascimento)}
                className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200"
              />
              <InfoField
                icon={FileText}
                label="CPF"
                value={formatCPF(inscricao.cpf)}
                copyable
                className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
              />
              <InfoField
                icon={MapPin}
                label="Endereço Completo"
                value={`${inscricao.logradouro}, ${inscricao.numero}${
                  inscricao.complemento ? `, ${inscricao.complemento}` : ""
                } - ${inscricao.bairro}, ${inscricao.cidade}/${
                  inscricao.estado
                } - CEP: ${inscricao.cep}`}
                copyable
                className="md:col-span-2 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"
              />
            </CardContent>
          </Card>

          {/* Informações Acadêmicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Acadêmicas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoField
                icon={GraduationCap}
                label="Escola"
                value={inscricao.escola || ""}
                copyable
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
              />
              <InfoField
                icon={BookOpen}
                label="Escolaridade"
                value={inscricao.escolaridade || ""}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              />
              <InfoField
                icon={Calendar}
                label="Ano Escolar"
                value={inscricao.ano_escolar || ""}
                className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200"
              />
              <InfoField
                icon={Trophy}
                label="Curso Escolhido"
                value={inscricao.curso || ""}
                className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200"
              />
              <InfoField
                icon={Calendar}
                label="Data da Inscrição"
                value={formatDate(inscricao.created_at)}
                className="md:col-span-2 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
              />
            </CardContent>
          </Card>
        </div>

        {/* Documentos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos</CardTitle>
              <p className="text-sm text-gray-600">
                Todos os documentos são obrigatórios para confirmação da
                matrícula
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUpload
                type="rg_cpf"
                currentFile={inscricao.documento_rg_cpf}
                onUpload={(file) => handleFileUpload("rg_cpf", file)}
              />

              <DocumentUpload
                type="declaracao"
                currentFile={inscricao.documento_declaracao}
                onUpload={(file) => handleFileUpload("declaracao", file)}
              />

              <DocumentUpload
                type="termo"
                currentFile={inscricao.documento_termo}
                onUpload={(file) => handleFileUpload("termo", file)}
              />
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Ações da Inscrição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inscricao.status === "pendente" && (
                <>
                  <Button
                    onClick={handleConfirmMatricula}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!allDocumentsPresent()}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Matrícula
                  </Button>
                  {!allDocumentsPresent() && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Anexe todos os documentos para habilitar a confirmação
                    </p>
                  )}
                </>
              )}

              {inscricao.status !== "cancelado" && (
                <Button
                  onClick={handleConfirmCancelar}
                  variant="destructive"
                  className="w-full"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Cancelar Inscrição
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogos de Confirmação */}
      <AlertDialog
        open={showConfirmDialog.show}
        onOpenChange={(open) =>
          setShowConfirmDialog((prev) => ({ ...prev, show: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{showConfirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {showConfirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showConfirmDialog.type === "matricula") {
                  executeStatusChange("matriculado");
                } else if (showConfirmDialog.type === "cancelar") {
                  executeStatusChange("cancelado");
                }
                setShowConfirmDialog({
                  show: false,
                  type: null,
                  title: "",
                  description: "",
                });
              }}
              className={
                showConfirmDialog.type === "cancelar"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog
        open={showDeleteConfirm.show}
        onOpenChange={(open) =>
          setShowDeleteConfirm((prev) => ({ ...prev, show: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este anexo? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFile}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Uploader */}
      <FileUploader
        isOpen={showScanner.show}
        onClose={handleScannerClose}
        onConfirm={handleScannerConfirm}
        documentType={
          showScanner.type === "rg_cpf"
            ? "RG/CPF"
            : showScanner.type === "declaracao"
            ? "Declaração Escolar"
            : showScanner.type === "termo"
            ? "Termo de Responsabilidade"
            : ""
        }
      />
    </div>
  );
}
