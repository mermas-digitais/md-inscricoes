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
  CreditCard,
  Building2,
  Clock,
  Target,
  Edit,
  RotateCcw,
  Settings,
  Save,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/ui/file-uploader";
import EscolaSelector from "@/components/ui/escola-selector";

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
    type: "matricula" | "cancelar" | "cancelar_matricula" | "reativar" | null;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Inscricao>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>(
    {}
  );
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleConfirmCancelarMatricula = () => {
    setShowConfirmDialog({
      show: true,
      type: "cancelar_matricula",
      title: "Cancelar Matrícula",
      description:
        "Tem certeza que deseja cancelar esta matrícula? A aluna voltará para o status 'Inscrita'.",
    });
  };

  const handleConfirmReativar = () => {
    setShowConfirmDialog({
      show: true,
      type: "reativar",
      title: "Reativar Inscrição",
      description:
        "Tem certeza que deseja reativar esta inscrição? O status será alterado para 'Inscrita'.",
    });
  };

  const handleEditarDados = () => {
    if (inscricao) {
      setEditFormData({ ...inscricao });
      setEditFormErrors({});
      setShowEditModal(true);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (editFormErrors[field]) {
      setEditFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    const requiredFields = {
      nome: "Nome completo",
      email: "Email",
      telefone_whatsapp: "WhatsApp do responsável",
      data_nascimento: "Data de nascimento",
      cpf: "CPF",
      cep: "CEP",
      logradouro: "Logradouro",
      numero: "Número",
      bairro: "Bairro",
      cidade: "Cidade",
      estado: "Estado",
      nome_responsavel: "Nome do responsável",
      escolaridade: "Escolaridade",
      ano_escolar: "Ano escolar",
      escola: "Escola",
      curso: "Curso",
    };

    // Validar campos obrigatórios
    for (const [field, label] of Object.entries(requiredFields)) {
      const value = editFormData[field as keyof Inscricao];
      if (!value || value.toString().trim() === "") {
        errors[field] = `${label} é obrigatório`;
      }
    }

    // Validar email
    if (editFormData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editFormData.email)) {
        errors.email = "Email inválido";
      }
    }

    // Validar CPF
    if (editFormData.cpf) {
      const cpfClean = editFormData.cpf.replace(/\D/g, "");
      if (cpfClean.length !== 11) {
        errors.cpf = "CPF deve ter 11 dígitos";
      }
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateInscricao = async () => {
    if (!validateEditForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos marcados em vermelho.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matriculas/inscricoes/${inscricaoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const { data } = await response.json();
        setInscricao(data);
        setShowEditModal(false);
        toast({
          title: "Sucesso",
          description: "Dados da inscrição atualizados com sucesso!",
          variant: "success",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar dados");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar os dados da inscrição.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getEscolaridadeOptions = () => {
    return ["Ensino Fundamental 2", "Ensino Médio"];
  };

  const getAnoEscolarOptions = () => {
    if (editFormData.escolaridade === "Ensino Fundamental 2") {
      return ["6º ano", "7º ano", "8º ano", "9º ano"];
    } else if (editFormData.escolaridade === "Ensino Médio") {
      return ["1º ano", "2º ano", "3º ano"];
    }
    return [];
  };

  const getCursoOptions = () => {
    if (editFormData.escolaridade === "Ensino Fundamental 2") {
      return ["Robótica"];
    } else if (editFormData.escolaridade === "Ensino Médio") {
      return ["Jogos Digitais"];
    }
    return [];
  };

  const executeStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/matriculas/inscricoes/${inscricaoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setInscricao((prev) => (prev ? { ...prev, status: newStatus } : null));

        const statusMessages = {
          MATRICULADA: "Matriculada",
          CANCELADA: "Cancelada",
          INSCRITA: "Inscrita",
          EXCEDENTE: "Excedente",
        };

        toast({
          title: "Sucesso",
          description: `Status alterado para ${
            statusMessages[newStatus as keyof typeof statusMessages]
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
        const response = await fetch(`/api/matriculas/upload`, {
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
      const response = await fetch("/api/matriculas/upload", {
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

    console.log("formatDate - Input:", dateString);

    try {
      // Método mais direto: forçar apenas a parte da data
      const dateOnly = dateString.split("T")[0]; // Remove hora se existir
      console.log("formatDate - Date only:", dateOnly);

      // Verificar se está no formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        console.log(
          "formatDate - Not in YYYY-MM-DD format, returning original"
        );
        return dateString;
      }

      // Split manual e reconstrução como string brasileira
      const [year, month, day] = dateOnly.split("-");
      const brazilianFormat = `${day}/${month}/${year}`;

      console.log("formatDate - Manual format result:", brazilianFormat);

      return brazilianFormat;
    } catch (error) {
      console.error("Erro ao formatar data:", error, "Input:", dateString);
      return dateString; // Retorna original em caso de erro
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      INSCRITA: {
        label: "Inscrita",
        gradient: "from-blue-400 to-indigo-500",
        textColor: "text-white",
        borderColor: "border-blue-300",
      },
      MATRICULADA: {
        label: "Matriculada",
        gradient: "from-green-400 to-emerald-500",
        textColor: "text-white",
        borderColor: "border-green-300",
      },
      CANCELADA: {
        label: "Cancelada",
        gradient: "from-red-400 to-rose-500",
        textColor: "text-white",
        borderColor: "border-red-300",
      },
      EXCEDENTE: {
        label: "Excedente",
        gradient: "from-orange-400 to-amber-500",
        textColor: "text-white",
        borderColor: "border-orange-300",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.INSCRITA;

    return (
      <div
        className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${config.gradient} ${config.textColor} border ${config.borderColor} shadow-lg font-bold text-sm transition-all duration-200 hover:scale-105`}
      >
        {config.label}
      </div>
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
      className={`group p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider truncate">
              {label}
            </p>
          </div>
          <p className="text-gray-900 font-semibold text-sm sm:text-base ml-8 sm:ml-11 break-words">
            {value}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {copyable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(value, label)}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-gray-100"
            >
              <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Button>
          )}
          {whatsapp && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openWhatsApp(value, inscricao?.nome || "")}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-50 hover:text-green-600"
              disabled={!value}
            >
              <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
        <div className="border border-green-200 rounded-xl p-4 md:p-5 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 text-base truncate">
                  {getDocumentLabel(type)}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {getDocumentDescription(type)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(currentFile, "_blank")}
                className="h-8 md:h-9 text-xs bg-white hover:bg-green-50 border-green-300 text-green-700 hover:text-green-800 rounded-lg font-medium"
              >
                <Eye className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Visualizar anexo</span>
                <span className="sm:hidden">Ver</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteFile(type)}
                className="h-8 md:h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 rounded-lg font-medium"
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
        className={`border border-dashed rounded-xl p-6 md:p-8 transition-all duration-200 ${
          isDragging
            ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg scale-[1.02]"
            : "border-gray-300 hover:border-gray-400 hover:shadow-md"
        }`}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragEnter={(e) => handleDragEnter(e, type)}
        onDragLeave={(e) => handleDragLeave(e, type)}
        onDrop={(e) => handleDrop(e, type)}
      >
        <div className="text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Upload className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
          </div>
          <p className="font-bold text-gray-900 text-base mb-2">
            {getDocumentLabel(type)}
          </p>
          <p className="text-sm text-gray-600 mb-6">
            {getDocumentDescription(type)}
          </p>

          <div className="flex flex-col gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFileAttach(type)}
              className="h-10 w-full text-sm bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 text-blue-700 hover:text-blue-800 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Upload className="w-4 h-4 mr-2" />
              Anexar arquivo
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4 font-medium">
            Ou arraste o arquivo aqui
          </p>
        </div>
      </div>
    );
  };

  const loadInscricao = async () => {
    try {
      const response = await fetch(`/api/matriculas/inscricoes/${inscricaoId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Data de nascimento raw do banco:", data.data_nascimento);
        setInscricao(data);
      } else {
        toast({
          title: "Erro",
          description: "Inscrição não encontrada.",
          variant: "destructive",
        });
        router.push(
          `/matriculas${
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
                `/matriculas${
                  monitorEmail
                    ? `?email=${encodeURIComponent(monitorEmail)}`
                    : ""
                }`
              )
            }
            size="icon"
            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 p-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                onClick={() =>
                  router.push(
                    `/matriculas${
                      monitorEmail
                        ? `?email=${encodeURIComponent(monitorEmail)}`
                        : ""
                    }`
                  )
                }
                className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 p-2 sm:p-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                size="icon"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#FF4A97] to-[#FFCD34] bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
                  {inscricao.nome}
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">
                  Detalhes da inscrição
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
              {getStatusBadge(inscricao.status)}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 xl:grid-cols-3">
          {/* Informações Pessoais e Acadêmicas */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 px-4 sm:px-6 py-4">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <InfoField
                    label="Nome Completo"
                    value={inscricao.nome}
                    icon={User}
                    copyable={true}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300"
                  />
                  <InfoField
                    label="CPF"
                    value={formatCPF(inscricao.cpf)}
                    icon={CreditCard}
                    copyable={true}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300"
                  />
                  <InfoField
                    label="Data de Nascimento"
                    value={formatDate(inscricao.data_nascimento)}
                    icon={Calendar}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300"
                  />
                  <InfoField
                    label="Email"
                    value={inscricao.email}
                    icon={Mail}
                    copyable={true}
                    className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 hover:border-pink-300"
                  />
                  <InfoField
                    label="WhatsApp do Responsável"
                    value={formatPhone(inscricao.telefone_whatsapp)}
                    icon={Phone}
                    copyable={true}
                    whatsapp={true}
                    className="bg-gradient-to-r from-rose-50 to-red-50 border-rose-200 hover:border-rose-300"
                  />
                  <InfoField
                    label="Endereço"
                    value={`${inscricao.logradouro}, ${inscricao.numero}${
                      inscricao.complemento ? `, ${inscricao.complemento}` : ""
                    } - ${inscricao.bairro}, ${inscricao.cidade}/${
                      inscricao.estado
                    } - CEP: ${inscricao.cep}`}
                    icon={MapPin}
                    copyable={true}
                    className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:border-red-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Acadêmicas */}
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 px-4 sm:px-6 py-4">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  <span className="truncate">Informações Acadêmicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <InfoField
                    label="Escola"
                    value={inscricao.escola}
                    icon={Building2}
                    copyable={true}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300"
                  />
                  <InfoField
                    label="Escolaridade"
                    value={inscricao.escolaridade}
                    icon={BookOpen}
                    copyable={true}
                    className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300"
                  />
                  <InfoField
                    label="Ano Escolar"
                    value={inscricao.ano_escolar}
                    icon={Clock}
                    copyable={true}
                    className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 hover:border-teal-300"
                  />
                  <InfoField
                    label="Curso"
                    value={inscricao.curso}
                    icon={Target}
                    copyable={true}
                    className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-300"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documentos e Ações */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-purple-50/50 to-pink-50/50 px-4 sm:px-6 py-4">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  <span className="truncate">Documentos</span>
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                  Todos os documentos são obrigatórios para confirmação da
                  matrícula
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
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
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-orange-50/50 to-amber-50/50 px-4 sm:px-6 py-4">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                  <span className="truncate">Ações da Inscrição</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Ações para status INSCRITA */}
                {inscricao.status === "INSCRITA" && (
                  <>
                    <Button
                      onClick={handleConfirmMatricula}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                      disabled={!allDocumentsPresent()}
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="truncate">Confirmar Matrícula</span>
                    </Button>
                    {!allDocumentsPresent() && (
                      <div className="text-xs sm:text-sm text-amber-600 flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          Anexe todos os documentos para habilitar a confirmação
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        onClick={handleEditarDados}
                        variant="outline"
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-sm sm:text-base"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">Editar Dados</span>
                      </Button>

                      <Button
                        onClick={handleConfirmCancelar}
                        variant="outline"
                        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 font-medium py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-sm sm:text-base"
                      >
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">Cancelar</span>
                      </Button>
                    </div>
                  </>
                )}

                {/* Ações para status MATRICULADA */}
                {inscricao.status === "MATRICULADA" && (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          Matrícula Confirmada
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-green-700 mt-1 leading-relaxed">
                        Esta aluna está oficialmente matriculada no curso.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        onClick={handleEditarDados}
                        variant="outline"
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-sm sm:text-base"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">Editar Dados</span>
                      </Button>

                      <Button
                        onClick={handleConfirmCancelarMatricula}
                        variant="outline"
                        className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 font-medium py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-sm sm:text-base"
                      >
                        <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">Cancelar Matrícula</span>
                      </Button>
                    </div>
                  </>
                )}

                {/* Ações para status CANCELADA */}
                {inscricao.status === "CANCELADA" && (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          Inscrição Cancelada
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-red-700 mt-1 leading-relaxed">
                        Esta inscrição foi cancelada e pode ser reativada se
                        necessário.
                      </p>
                    </div>

                    <Button
                      onClick={handleConfirmReativar}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="truncate">Reativar Inscrição</span>
                    </Button>
                  </>
                )}

                {/* Ações para status EXCEDENTE */}
                {inscricao.status === "EXCEDENTE" && (
                  <>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-orange-800">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          Lista de Excedentes
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-orange-700 mt-1 leading-relaxed">
                        Esta aluna está na lista de excedentes e pode ser
                        reativada quando houver vaga.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        onClick={handleConfirmReativar}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                      >
                        <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">Reativar</span>
                      </Button>

                      <Button
                        onClick={handleEditarDados}
                        variant="outline"
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">Editar</span>
                      </Button>
                    </div>
                  </>
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
          <AlertDialogContent className="max-w-md w-[95vw] bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 border-0 shadow-2xl">
            <AlertDialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                {showConfirmDialog.type === "matricula" && (
                  <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                )}
                {showConfirmDialog.type === "cancelar" && (
                  <div className="w-full h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                )}
                {showConfirmDialog.type === "cancelar_matricula" && (
                  <div className="w-full h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center">
                    <RotateCcw className="w-8 h-8 text-white" />
                  </div>
                )}
                {showConfirmDialog.type === "reativar" && (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <RotateCcw className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-xl font-bold text-gray-800">
                  {showConfirmDialog.title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed px-2">
                  {showConfirmDialog.description}
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-6">
              <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 rounded-lg font-medium transition-all duration-200">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (showConfirmDialog.type === "matricula") {
                    executeStatusChange("MATRICULADA");
                  } else if (showConfirmDialog.type === "cancelar") {
                    executeStatusChange("CANCELADA");
                  } else if (showConfirmDialog.type === "cancelar_matricula") {
                    executeStatusChange("INSCRITA");
                  } else if (showConfirmDialog.type === "reativar") {
                    executeStatusChange("INSCRITA");
                  }
                  setShowConfirmDialog({
                    show: false,
                    type: null,
                    title: "",
                    description: "",
                  });
                }}
                className={`w-full sm:w-auto font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${
                  showConfirmDialog.type === "cancelar"
                    ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                    : showConfirmDialog.type === "cancelar_matricula"
                    ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                    : showConfirmDialog.type === "reativar"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                }`}
              >
                {showConfirmDialog.type === "reativar"
                  ? "Reativar"
                  : showConfirmDialog.type === "cancelar_matricula"
                  ? "Cancelar Matrícula"
                  : "Confirmar"}
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
          <AlertDialogContent className="max-w-md w-[95vw] bg-gradient-to-br from-white via-red-50/20 to-rose-50/30 border-0 shadow-2xl">
            <AlertDialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-full h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-xl font-bold text-gray-800">
                  Confirmar Exclusão
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed px-2">
                  Tem certeza que deseja excluir este anexo? Esta ação não pode
                  ser desfeita.
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-6">
              <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 rounded-lg font-medium transition-all duration-200">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteFile}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
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

        {/* Modal de Edição */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/10 border-0 shadow-2xl">
            <DialogHeader className="border-b border-gray-100/50 pb-4 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 -m-6 mb-0 px-6 pt-6">
              <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <Edit className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Editar Dados da Inscrição
                  </span>
                  <p className="text-xs md:text-sm font-normal text-gray-600 mt-1">
                    Atualize as informações da aluna {editFormData.nome}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="p-4 md:p-6 space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nome" className="text-sm font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="edit-nome"
                      value={editFormData.nome || ""}
                      onChange={(e) =>
                        handleEditFormChange("nome", e.target.value)
                      }
                      className={editFormErrors.nome ? "border-red-500" : ""}
                      placeholder="Digite o nome completo"
                    />
                    {editFormErrors.nome && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.nome}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-cpf" className="text-sm font-medium">
                      CPF *
                    </Label>
                    <Input
                      id="edit-cpf"
                      value={editFormData.cpf || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 11) {
                          value = value.replace(
                            /(\d{3})(\d{3})(\d{3})(\d{2})/,
                            "$1.$2.$3-$4"
                          );
                          handleEditFormChange("cpf", value);
                        }
                      }}
                      className={editFormErrors.cpf ? "border-red-500" : ""}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {editFormErrors.cpf && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.cpf}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-data-nascimento"
                      className="text-sm font-medium"
                    >
                      Data de Nascimento *
                    </Label>
                    <Input
                      id="edit-data-nascimento"
                      type="date"
                      value={editFormData.data_nascimento || ""}
                      onChange={(e) =>
                        handleEditFormChange("data_nascimento", e.target.value)
                      }
                      className={
                        editFormErrors.data_nascimento ? "border-red-500" : ""
                      }
                    />
                    {editFormErrors.data_nascimento && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.data_nascimento}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) =>
                        handleEditFormChange("email", e.target.value)
                      }
                      className={editFormErrors.email ? "border-red-500" : ""}
                      placeholder="email@exemplo.com"
                    />
                    {editFormErrors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-telefone"
                      className="text-sm font-medium"
                    >
                      WhatsApp do Responsável *
                    </Label>
                    <Input
                      id="edit-telefone"
                      value={editFormData.telefone_whatsapp || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 11) {
                          value = value.replace(
                            /(\d{2})(\d{5})(\d{4})/,
                            "($1) $2-$3"
                          );
                          handleEditFormChange("telefone_whatsapp", value);
                        }
                      }}
                      className={
                        editFormErrors.telefone_whatsapp ? "border-red-500" : ""
                      }
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                    />
                    {editFormErrors.telefone_whatsapp && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.telefone_whatsapp}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-nome-responsavel"
                      className="text-sm font-medium"
                    >
                      Nome do Responsável *
                    </Label>
                    <Input
                      id="edit-nome-responsavel"
                      value={editFormData.nome_responsavel || ""}
                      onChange={(e) =>
                        handleEditFormChange("nome_responsavel", e.target.value)
                      }
                      className={
                        editFormErrors.nome_responsavel ? "border-red-500" : ""
                      }
                      placeholder="Digite o nome do responsável"
                    />
                    {editFormErrors.nome_responsavel && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.nome_responsavel}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-cep" className="text-sm font-medium">
                      CEP *
                    </Label>
                    <Input
                      id="edit-cep"
                      value={editFormData.cep || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 8) {
                          value = value.replace(/(\d{5})(\d{3})/, "$1-$2");
                          handleEditFormChange("cep", value);
                        }
                      }}
                      className={editFormErrors.cep ? "border-red-500" : ""}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {editFormErrors.cep && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.cep}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label
                      htmlFor="edit-logradouro"
                      className="text-sm font-medium"
                    >
                      Logradouro *
                    </Label>
                    <Input
                      id="edit-logradouro"
                      value={editFormData.logradouro || ""}
                      onChange={(e) =>
                        handleEditFormChange("logradouro", e.target.value)
                      }
                      className={
                        editFormErrors.logradouro ? "border-red-500" : ""
                      }
                      placeholder="Rua, Avenida, etc."
                    />
                    {editFormErrors.logradouro && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.logradouro}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-numero"
                      className="text-sm font-medium"
                    >
                      Número *
                    </Label>
                    <Input
                      id="edit-numero"
                      value={editFormData.numero || ""}
                      onChange={(e) =>
                        handleEditFormChange("numero", e.target.value)
                      }
                      className={editFormErrors.numero ? "border-red-500" : ""}
                      placeholder="123"
                    />
                    {editFormErrors.numero && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.numero}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-complemento"
                      className="text-sm font-medium"
                    >
                      Complemento
                    </Label>
                    <Input
                      id="edit-complemento"
                      value={editFormData.complemento || ""}
                      onChange={(e) =>
                        handleEditFormChange("complemento", e.target.value)
                      }
                      placeholder="Apt, Bloco, etc."
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-bairro"
                      className="text-sm font-medium"
                    >
                      Bairro *
                    </Label>
                    <Input
                      id="edit-bairro"
                      value={editFormData.bairro || ""}
                      onChange={(e) =>
                        handleEditFormChange("bairro", e.target.value)
                      }
                      className={editFormErrors.bairro ? "border-red-500" : ""}
                      placeholder="Digite o bairro"
                    />
                    {editFormErrors.bairro && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.bairro}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-cidade"
                      className="text-sm font-medium"
                    >
                      Cidade *
                    </Label>
                    <Input
                      id="edit-cidade"
                      value={editFormData.cidade || ""}
                      onChange={(e) =>
                        handleEditFormChange("cidade", e.target.value)
                      }
                      className={editFormErrors.cidade ? "border-red-500" : ""}
                      placeholder="Digite a cidade"
                    />
                    {editFormErrors.cidade && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.cidade}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-estado"
                      className="text-sm font-medium"
                    >
                      Estado *
                    </Label>
                    <Input
                      id="edit-estado"
                      value={editFormData.estado || ""}
                      onChange={(e) =>
                        handleEditFormChange("estado", e.target.value)
                      }
                      className={editFormErrors.estado ? "border-red-500" : ""}
                      placeholder="Ex: MA"
                      maxLength={2}
                    />
                    {editFormErrors.estado && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.estado}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações Acadêmicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  Informações Acadêmicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="edit-escolaridade"
                      className="text-sm font-medium"
                    >
                      Escolaridade *
                    </Label>
                    <Select
                      value={editFormData.escolaridade || ""}
                      onValueChange={(value) => {
                        handleEditFormChange("escolaridade", value);
                        // Limpar campos dependentes
                        handleEditFormChange("ano_escolar", "");
                        handleEditFormChange("curso", "");
                      }}
                    >
                      <SelectTrigger
                        className={
                          editFormErrors.escolaridade ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Selecione a escolaridade" />
                      </SelectTrigger>
                      <SelectContent>
                        {getEscolaridadeOptions().map((escolaridade) => (
                          <SelectItem key={escolaridade} value={escolaridade}>
                            {escolaridade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editFormErrors.escolaridade && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.escolaridade}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-ano-escolar"
                      className="text-sm font-medium"
                    >
                      Ano Escolar *
                    </Label>
                    <Select
                      value={editFormData.ano_escolar || ""}
                      onValueChange={(value) =>
                        handleEditFormChange("ano_escolar", value)
                      }
                      disabled={!editFormData.escolaridade}
                    >
                      <SelectTrigger
                        className={
                          editFormErrors.ano_escolar ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Selecione o ano escolar" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAnoEscolarOptions().map((ano) => (
                          <SelectItem key={ano} value={ano}>
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editFormErrors.ano_escolar && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.ano_escolar}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label
                      htmlFor="edit-escola"
                      className="text-sm font-medium"
                    >
                      Escola *
                    </Label>
                    <EscolaSelector
                      value={editFormData.escola || ""}
                      onChange={(escola) =>
                        handleEditFormChange("escola", escola)
                      }
                      placeholder="Digite o nome da escola..."
                      escolaridade={editFormData.escolaridade}
                      error={editFormErrors.escola}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="edit-curso" className="text-sm font-medium">
                      Curso *
                    </Label>
                    <Select
                      value={editFormData.curso || ""}
                      onValueChange={(value) =>
                        handleEditFormChange("curso", value)
                      }
                      disabled={!editFormData.escolaridade}
                    >
                      <SelectTrigger
                        className={editFormErrors.curso ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCursoOptions().map((curso) => (
                          <SelectItem key={curso} value={curso}>
                            {curso}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editFormErrors.curso && (
                      <p className="text-red-500 text-xs mt-1">
                        {editFormErrors.curso}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex-shrink-0 border-t border-gray-100 p-4 md:p-6 bg-gradient-to-r from-gray-50/50 to-white">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 rounded-lg font-medium transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateInscricao}
                  disabled={isUpdating}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
