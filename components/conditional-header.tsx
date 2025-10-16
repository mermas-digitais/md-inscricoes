"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";

export function ConditionalHeader() {
  const pathname = usePathname();

  // Não exibir header nas páginas do monitor e módulos
  if (
    pathname.startsWith("/matriculas") ||
    pathname.startsWith("/ensino") ||
    pathname.startsWith("/eventos")
  ) {
    return null;
  }

  return <Header />;
}
