"use client";

import { useSearchParams } from "next/navigation";
import { CustomButton } from "@/components/ui/custom-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Instagram } from "lucide-react";
import { Header } from "@/components/header";

export default function ConfirmacaoPage() {
  const searchParams = useSearchParams();
  const curso = searchParams.get("curso");
  const email = searchParams.get("email");

  return (
    <>
      <Header />
      {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Camada 1: Fundo roxo - sempre cobre todo o espaço incluindo scroll */}
        <div className="absolute inset-0 w-full min-h-[200vh] bg-[#9854CB]"></div>

        {/* Camada 2: Imagem de fundo fixa no topo respeitando o header - altura expandida */}
        <div className="absolute top-0 left-0 right-0 h-[200vh]">
          <img
            src={
              curso === "Jogos"
                ? "/assets/images/confirm_jogos_asset.svg"
                : "/assets/images/confirm_robotica_asset.svg"
            }
            alt="Fundo da confirmação"
            className="absolute top-0 left-0 w-full h-full object-contain object-top pointer-events-none select-none"
            style={{
              transform: "scale(1.0)",
              willChange: "transform",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Camada 3: Conteúdo scrollável - ocupa mesma altura que o fundo */}
        <div className="relative z-10 min-h-[200vh] flex flex-col">
          {/* Espaçamento superior maior para posicionar o card quase no final */}
          <div className="h-[120vh] sm:h-[110vh] lg:h-[120vh] flex-shrink-0"></div>

          {/* Container do conteúdo principal */}
          <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 pb-20">
            <div className="w-full max-w-2xl">
              {/* Card principal */}
              <Card className="rounded-2xl bg-white shadow-lg mt-12
               font-poppins">
                <CardHeader className="px-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider text-left font-poppins">
                        REDES SOCIAIS
                      </CardTitle>
                      <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-0 text-left font-poppins">
                        Segue a gente aí,
                        <br />
                        mermã
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-2">
                  <div className="text-center space-y-4">
                    <div className="">
                      <CustomButton
                        type="button"
                        onClick={() =>
                          window.open(
                            "https://instagram.com/mermasdigitais",
                            "_blank"
                          )
                        }
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      >
                        <Instagram className="w-6 h-6 mr-2" />
                        INSTAGRAM (@mermasdigitais)
                      </CustomButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer fixo no final da página */}
          <div className="flex-shrink-0 mt-auto pb-8 pt-8">
            <div className="flex justify-center px-4">
              <div className="w-full max-w-md">
                <img
                  src="/assets/images/footer.svg"
                  alt="Footer com logos"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
