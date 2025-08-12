"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se é admin (você pode implementar uma verificação mais robusta)
    const checkAdminAccess = async () => {
      try {
        // Por enquanto, vamos simular uma verificação
        // Em um caso real, você faria uma chamada para API para verificar o role
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        router.push("/monitor");
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
