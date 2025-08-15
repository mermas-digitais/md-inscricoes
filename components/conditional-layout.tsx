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
  const [shouldHideHeader, setShouldHideHeader] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Função para verificar se é dashboard do monitor ou painel autenticado
  const checkIfHideHeader = () => {
    if (!isMounted) {
      return false;
    }

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        const { timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutos

        // Se há sessão válida e estamos em rotas que têm header próprio
        if (now - timestamp < sessionTimeout) {
          return (
            pathname === "/monitor" ||
            pathname === "/painel" ||
            pathname.startsWith("/matriculas") ||
            pathname.startsWith("/ensino")
          );
        }
      }
    } catch (error) {
      console.log("Erro ao verificar sessão:", error);
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

    const hideHeader = checkIfHideHeader();
    setShouldHideHeader(hideHeader);

    // Verificar periodicamente para mudanças no localStorage
    const interval = setInterval(() => {
      const hideHeader = checkIfHideHeader();
      setShouldHideHeader(hideHeader);
    }, 500); // Verificar a cada 500ms

    return () => clearInterval(interval);
  }, [pathname, isMounted]);

  // Listener para mudanças no localStorage (quando outra aba/janela modifica)
  useEffect(() => {
    if (!isMounted) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "monitorSession") {
        const hideHeader = checkIfHideHeader();
        setShouldHideHeader(hideHeader);
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
        const hideHeader = checkIfHideHeader();
        setShouldHideHeader(hideHeader);
      }
    };

    localStorage.removeItem = function (key) {
      originalRemoveItem.call(this, key);
      if (key === "monitorSession") {
        setShouldHideHeader(false);
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
      {/* Renderizar header exceto nas rotas que têm header próprio */}
      {!shouldHideHeader && <Header />}

      {/* Main com padding condicional */}
      <main className={shouldHideHeader ? "" : "pt-16"}>{children}</main>
    </>
  );
}
