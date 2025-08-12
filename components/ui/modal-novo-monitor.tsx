"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Mail, User, Shield, Users, Loader2 } from "lucide-react";

interface ModalNovoMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  nome: string;
  email: string;
  role: "MONITOR" | "ADM" | "";
}

const initialFormData: FormData = {
  nome: "",
  email: "",
  role: "",
};

export function ModalNovoMonitor({
  isOpen,
  onClose,
  onSuccess,
}: ModalNovoMonitorProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações obrigatórias
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.role) {
      newErrors.role = "Nível de acesso é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/monitor/monitores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Monitor criado com sucesso!",
          description: `${formData.nome} foi adicionado ao sistema como ${
            formData.role === "ADM" ? "Administrador" : "Monitor"
          }.`,
          variant: "success",
        });
        handleClose();
        onSuccess();
      } else {
        const data = await response.json();

        // Verificar se é erro de email duplicado
        if (
          response.status === 409 ||
          data.error?.includes("já existe") ||
          data.error?.includes("duplicate")
        ) {
          setErrors({ email: "Este email já está cadastrado no sistema" });
          toast({
            title: "Email já cadastrado",
            description: "Este email já está sendo usado por outro monitor",
            variant: "warning",
          });
        } else {
          toast({
            title: "Erro ao criar monitor",
            description: data.error || "Ocorreu um erro inesperado",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            Novo Monitor
          </DialogTitle>
          <DialogDescription>
            Adicione um novo monitor ou administrador ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome Completo *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                className={`pl-10 ${errors.nome ? "border-red-500" : ""}`}
                placeholder="Digite o nome completo"
                disabled={isLoading}
              />
            </div>
            {errors.nome && (
              <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  handleInputChange("email", e.target.value.toLowerCase())
                }
                className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                placeholder="monitor@exemplo.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role" className="text-sm font-medium">
              Nível de Acesso *
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o nível de acesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONITOR">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Monitor</p>
                      <p className="text-xs text-gray-500">
                        Acesso de visualização e edição básica
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="ADM">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-medium">Administrador</p>
                      <p className="text-xs text-gray-500">
                        Acesso completo ao sistema
                      </p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role}</p>
            )}
          </div>

          {/* Informações sobre permissões */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Sobre os níveis de acesso:</p>
                <ul className="space-y-1">
                  <li>
                    <strong>Monitor:</strong> Pode visualizar e gerenciar
                    inscrições
                  </li>
                  <li>
                    <strong>Administrador:</strong> Acesso completo + criação de
                    novos monitores
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Informação sobre códigos de acesso */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium mb-1">Como funciona o acesso:</p>
                <p>
                  Um código de verificação será enviado por email sempre que o
                  monitor tentar fazer login no sistema.
                </p>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Monitor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
