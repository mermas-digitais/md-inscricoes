"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  CheckCircle,
  Loader2,
  AlertCircle,
  Send,
  X,
} from "lucide-react";

interface ModalConfirmEmailProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  onSkip: () => void;
  studentName: string;
  studentEmail: string;
  courseName: string;
}

export function ModalConfirmEmail({
  isOpen,
  onClose,
  onSend,
  onSkip,
  studentName,
  studentEmail,
  courseName,
}: ModalConfirmEmailProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      await onSend();
      toast({
        title: "Email enviado com sucesso!",
        description: `Email de confirmação enviado para ${studentEmail}`,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de confirmação, mas a inscrição foi criada com sucesso.",
        variant: "destructive",
      });
      // Mesmo com erro no email, fechar o modal
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] bg-white border-0 shadow-2xl">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Notificar Aluna por Email?
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Deseja enviar um email de confirmação da inscrição para a aluna?
          </p>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Aluna: {studentName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Email: {studentEmail}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Curso: {courseName}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">O email incluirá:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Confirmação da inscrição</li>
                  <li>Dados do curso selecionado</li>
                  <li>Informações de contato</li>
                  <li>Próximos passos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={isSending}
            className="w-full sm:w-auto px-6 py-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          >
            <X className="w-4 h-4 mr-2" />
            Pular Email
          </Button>
          <Button
            type="button"
            onClick={handleSendEmail}
            disabled={isSending}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Enviando...</span>
                <span className="sm:hidden">Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Enviar Email</span>
                <span className="sm:hidden">Enviar</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
