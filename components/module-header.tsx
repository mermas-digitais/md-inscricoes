"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  GraduationCap,
  Clock,
  LogOut,
  Menu,
  ChevronDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ModuleHeaderProps {
  moduleName: string;
  moduleDescription: string;
  moduleIcon: React.ComponentType<{ className?: string }>;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
}

export function ModuleHeader({
  moduleName,
  moduleDescription,
  moduleIcon: ModuleIcon,
  gradientFrom,
  gradientTo,
  iconColor,
}: ModuleHeaderProps) {
  const router = useRouter();
  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);

  const formatTimeLeft = (timeInMs: number): string => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Verificar sessão e atualizar timer
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const { email, nome, role, timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const SESSION_DURATION = 30 * 60 * 1000; // 30 minutos
          const timeLeft = SESSION_DURATION - (now - timestamp);

          if (timeLeft <= 0) {
            handleLogout();
          } else {
            setMonitorName(nome || email.split("@")[0]);
            setMonitorRole(role || "MONITOR");
            setSessionTimeLeft(timeLeft);
          }
        } catch {
          handleLogout();
        }
      } else {
        router.push("/painel");
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("monitorSession");

    toast({
      title: "Sessão encerrada",
      description: "Você foi desconectado com sucesso.",
    });

    router.push("/painel");
  };

  const handleNavigateToModule = (module: string) => {
    router.push(`/${module}`);
  };

  const handleNavigateToPanel = () => {
    router.push("/painel");
  };

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome do Módulo */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleNavigateToPanel}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">MD</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 font-poppins">
                  Plataforma de Gestão
                </h1>
              </div>
            </button>

            {/* Separador e Módulo Atual */}
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gray-300 rounded-full hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-sm`}
                >
                  <ModuleIcon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {moduleName}
                  </h2>
                  <p className="text-xs text-gray-500">{moduleDescription}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info do usuário e menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {monitorName}
              </div>
              <div className="text-xs text-gray-500">
                {monitorRole === "ADM" ? "Administrador" : "Monitor"}
              </div>
            </div>

            {/* Badge do usuário com timer integrado */}
            <div className="relative group cursor-help">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
                <span className="font-bold text-xs text-pink-700">
                  {monitorName ? monitorName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              {/* Timer como badge no canto do avatar */}
              <div
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white transition-all duration-200 ${
                  sessionTimeLeft <= 300000
                    ? "bg-red-500 shadow-red-200"
                    : sessionTimeLeft <= 900000
                    ? "bg-yellow-500 shadow-yellow-200"
                    : "bg-green-500 shadow-green-200"
                } shadow-lg`}
              >
                <Clock className="w-2 h-2 text-white" />
              </div>

              {/* Tooltip melhorado no hover */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50">
                <div className="text-center">
                  <div className="font-medium">Sessão expira em</div>
                  <div
                    className={`font-mono text-sm ${
                      sessionTimeLeft <= 300000
                        ? "text-red-300"
                        : sessionTimeLeft <= 900000
                        ? "text-yellow-300"
                        : "text-green-300"
                    }`}
                  >
                    {formatTimeLeft(sessionTimeLeft)}
                  </div>
                </div>
                {/* Seta do tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>

            {/* Menu suspenso elegante com badge */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Menu className="w-4 h-4 text-purple-700 group-hover:text-purple-800 transition-colors" />
                  </Button>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 border-gray-200 shadow-xl bg-white"
              >
                <DropdownMenuLabel className="font-semibold text-gray-900 px-4 py-3">
                  Módulos da Plataforma
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100" />

                <DropdownMenuItem
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-blue-50 transition-colors border-0 focus:bg-blue-50"
                  onClick={() => handleNavigateToModule("matriculas")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 shadow-sm">
                    <Users className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Matrículas
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Gestão de inscrições e monitores
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-green-50 transition-colors border-0 focus:bg-green-50"
                  onClick={() => handleNavigateToModule("ensino")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-100 to-green-200 shadow-sm">
                    <GraduationCap className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Ensino
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Cursos, turmas, aulas e frequência
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-gray-100" />

                <DropdownMenuLabel className="font-semibold text-gray-900 px-4 py-2">
                  Painel Principal
                </DropdownMenuLabel>

                <DropdownMenuItem
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-purple-50 transition-colors border-0 focus:bg-purple-50"
                  onClick={handleNavigateToPanel}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
                    <span className="text-purple-700 font-bold text-xs">
                      MD
                    </span>
                  </div>
                  <span className="text-sm font-medium">Voltar ao Painel</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-gray-100" />

                <DropdownMenuLabel className="font-semibold text-gray-900 px-4 py-2">
                  Conta
                </DropdownMenuLabel>

                <DropdownMenuItem
                  className="flex items-center gap-3 p-4 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border-0 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                    <LogOut className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium">Sair da Conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
