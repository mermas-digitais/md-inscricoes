"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Gamepad2, Bot, Clock, BookOpen, Instagram } from "lucide-react"

export default function ConfirmacaoPage() {
  const searchParams = useSearchParams()
  const curso = searchParams.get("curso")
  const email = searchParams.get("email")

  const cursoInfo = {
    Jogos: {
      icon: <Gamepad2 className="w-8 h-8 text-white" />,
      title: "Curso de Jogos",
      description: "Aprenda a criar seus próprios jogos!",
      schedule: "Terças e Quintas, 14h às 16h",
      topics: [
        "Lógica de Programação",
        "Criação de Personagens",
        "Desenvolvimento em Scratch",
        "Design de Jogos",
        "Storytelling Digital",
      ],
      gradient: "from-pink-500 to-purple-600",
    },
    Robótica: {
      icon: <Bot className="w-8 h-8 text-white" />,
      title: "Curso de Robótica",
      description: "Construa e programe robôs incríveis!",
      schedule: "Segundas e Quartas, 14h às 16h",
      topics: [
        "Montagem com Arduino",
        "Programação de Sensores",
        "Projetos Práticos",
        "Eletrônica Básica",
        "Automação Residencial",
      ],
      gradient: "from-purple-500 to-indigo-600",
    },
  }

  const info = cursoInfo[curso as keyof typeof cursoInfo]

  if (!info) {
    return <div>Curso não encontrado</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Inscrição Confirmada! 🎉
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Message */}
        <Card className="mb-8 border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Parabéns! Você está inscrita! ✨</h2>
              <p className="text-green-700">Sua inscrição foi realizada com sucesso e você está na nossa lista!</p>
            </div>
          </CardContent>
        </Card>

        {/* Course Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${info.gradient} rounded-xl flex items-center justify-center`}
              >
                {info.icon}
              </div>
              <div>
                <CardTitle className="text-2xl">{info.title}</CardTitle>
                <CardDescription className="text-lg">{info.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Schedule */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-800">Horário das aulas</p>
                <p className="text-gray-600">{info.schedule}</p>
              </div>
            </div>

            {/* Topics */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">O que você vai aprender:</h3>
              </div>
              <div className="grid gap-2">
                {info.topics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
                    <span className="text-gray-700">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Próximos passos 📋</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Fique de olho no seu email</p>
                  <p className="text-gray-600 text-sm">
                    Enviaremos mais informações para <strong>{email}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Siga nosso Instagram</p>
                  <p className="text-gray-600 text-sm">Todas as novidades e datas importantes serão divulgadas lá!</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Aguarde a confirmação da matrícula</p>
                  <p className="text-gray-600 text-sm">Nossa equipe entrará em contato para confirmar sua vaga</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                onClick={() => window.open("https://instagram.com/mermasdigitais", "_blank")}
              >
                <Instagram className="w-4 h-4 mr-2" />
                Seguir @mermasdigitais
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            Dúvidas? Entre em contato conosco pelo Instagram{" "}
            <a href="https://instagram.com/mermasdigitais" className="text-pink-600 font-semibold">
              @mermasdigitais
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
