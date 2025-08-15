"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";

export function ConditionalHeader() {
  const pathname = usePathname();

  // Não exibir header nas páginas do monitor
  if (pathname.startsWith("/matriculas")) {
    return null;
  }

  return <Header />;
}
