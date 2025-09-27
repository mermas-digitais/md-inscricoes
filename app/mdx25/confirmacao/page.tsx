"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Mail,
  Calendar,
  MapPin,
  Users,
  Sparkles,
} from "lucide-react";

function ConfirmacaoMDX25Content() {
  const searchParams = useSearchParams();
  const curso = searchParams.get("curso") || "MDX25";
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎉 Inscrição Confirmada!
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Bem-vinda ao <strong>MDX25</strong> - Mermãs Digitais!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Success Card */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 rounded-full p-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-800">
                Inscrição Realizada com Sucesso!
              </CardTitle>
              <CardDescription className="text-green-700">
                Sua participação no MDX25 está confirmada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Email:</span>
                </div>
                <p className="text-green-700">{email}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Curso:</span>
                </div>
                <p className="text-green-700 font-medium">{curso}</p>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-800 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Detalhes do MDX25
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">Data:</span>
                </div>
                <p className="text-purple-700">A ser definida - 2025</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">Local:</span>
                </div>
                <p className="text-purple-700">A ser definido</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">Vagas:</span>
                </div>
                <p className="text-purple-700">100 vagas disponíveis</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="mt-8 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-blue-800">
                    Confirmação por Email
                  </p>
                  <p className="text-blue-700">
                    Você receberá um email de confirmação em breve com todos os
                    detalhes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-blue-800">
                    Aguardar Informações
                  </p>
                  <p className="text-blue-700">
                    Fique atenta ao seu email para receber informações sobre
                    data, local e horário.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-blue-800">
                    Preparar-se para o Evento
                  </p>
                  <p className="text-blue-700">
                    Prepare-se para uma experiência incrível de aprendizado e
                    networking!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="mt-8 border-2 border-pink-200 bg-pink-50">
          <CardHeader>
            <CardTitle className="text-2xl text-pink-800">
              Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-pink-700 mb-4">
              Se você tiver alguma dúvida sobre sua inscrição no MDX25, entre em
              contato conosco:
            </p>
            <div className="space-y-2">
              <p className="text-pink-700">
                <strong>Email:</strong> contato@mermasdigitais.com.br
              </p>
              <p className="text-pink-700">
                <strong>WhatsApp:</strong> (99) 99999-9999
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg font-semibold mb-2">MDX25 - Mermãs Digitais</p>
          <p className="text-gray-300">Construindo o futuro digital feminino</p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacaoMDX25Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmacaoMDX25Content />
    </Suspense>
  );
}
