import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

export default function MonitorLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
