"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const [isMonitorDashboard, setIsMonitorDashboard] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Função para verificar se é dashboard do monitor
  const checkIfMonitorDashboard = () => {
    if (!isMounted || pathname !== "/monitor") {
      return false;
    }

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        const { timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutos

        // Se há sessão válida, é o dashboard
        return now - timestamp < sessionTimeout;
      }
    } catch (error) {
      console.log("Erro ao verificar sessão do monitor:", error);
    }

    return false;
  };

  // Hook para garantir que o componente está montado no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verificar sessão quando o componente monta e quando o pathname muda
  useEffect(() => {
    if (!isMounted) return;

    const isDashboard = checkIfMonitorDashboard();
    setIsMonitorDashboard(isDashboard);

    // Verificar periodicamente para mudanças no localStorage
    const interval = setInterval(() => {
      const isDashboard = checkIfMonitorDashboard();
      setIsMonitorDashboard(isDashboard);
    }, 500); // Verificar a cada 500ms

    return () => clearInterval(interval);
  }, [pathname, isMounted]);

  // Listener para mudanças no localStorage (quando outra aba/janela modifica)
  useEffect(() => {
    if (!isMounted) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "monitorSession") {
        const isDashboard = checkIfMonitorDashboard();
        setIsMonitorDashboard(isDashboard);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname, isMounted]);

  // Listener para mudanças no localStorage da mesma aba
  useEffect(() => {
    if (!isMounted) return;

    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;

    localStorage.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (key === "monitorSession") {
        const isDashboard = checkIfMonitorDashboard();
        setIsMonitorDashboard(isDashboard);
      }
    };

    localStorage.removeItem = function (key) {
      originalRemoveItem.call(this, key);
      if (key === "monitorSession") {
        setIsMonitorDashboard(false);
      }
    };

    return () => {
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    };
  }, [pathname, isMounted]);

  // Durante a montagem inicial, sempre mostrar header para evitar hidratação inconsistente
  if (!isMounted) {
    return (
      <>
        <Header />
        <main className="pt-16">{children}</main>
      </>
    );
  }

  return (
    <>
      {/* Renderizar header exceto no dashboard autenticado do monitor */}
      {!isMonitorDashboard && <Header />}

      {/* Main com padding condicional */}
      <main className={isMonitorDashboard ? "" : "pt-16"}>{children}</main>
    </>
  );
}
