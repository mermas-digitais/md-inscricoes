import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthResult {
  success?: boolean;
  error?: string;
  status?: number;
  monitor?: {
    id: string;
    nome: string;
    email: string;
    role: "MONITOR" | "ADM";
  };
}

/**
 * Verifica autenticação baseada no email do monitor no banco de dados
 * @param request - Request object do Next.js
 * @param requiredRole - Role mínimo necessário ('MONITOR' ou 'ADM')
 * @returns Resultado da autenticação com dados do monitor ou erro
 */
export async function verifyMonitorAuth(
  request: NextRequest,
  requiredRole: "MONITOR" | "ADM" = "MONITOR"
): Promise<AuthResult> {
  try {
    // Verificar se o header Authorization existe
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return {
        error:
          "Token de autorização não fornecido. Use: Authorization: Bearer email@exemplo.com",
        status: 401,
      };
    }

    // Extrair email do Bearer token
    const email = authHeader.replace("Bearer ", "").trim();

    if (!email || !email.includes("@")) {
      return {
        error: "Email inválido no token de autorização",
        status: 401,
      };
    }

    // Buscar monitor no banco de dados
    const { data: monitor, error: dbError } = await supabase
      .from("monitores")
      .select("id, nome, email, role")
      .eq("email", email.toLowerCase())
      .single();

    if (dbError || !monitor) {
      return {
        error: "Monitor não encontrado ou não autorizado",
        status: 403,
      };
    }

    // Verificar se o role do monitor atende o requisito mínimo
    if (requiredRole === "ADM" && monitor.role !== "ADM") {
      return {
        error:
          "Acesso negado. Esta operação requer privilégios de administrador",
        status: 403,
      };
    }

    // Se chegou até aqui, a autenticação foi bem-sucedida
    return {
      success: true,
      monitor: {
        id: monitor.id,
        nome: monitor.nome,
        email: monitor.email,
        role: monitor.role as "MONITOR" | "ADM",
      },
    };
  } catch (error) {
    console.error("Erro na verificação de autenticação:", error);
    return {
      error: "Erro interno na verificação de autenticação",
      status: 500,
    };
  }
}

/**
 * Middleware de autenticação que retorna resposta de erro se a autenticação falhar
 * @param request - Request object do Next.js
 * @param requiredRole - Role mínimo necessário
 * @returns null se autenticado ou NextResponse com erro
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole: "MONITOR" | "ADM" = "MONITOR"
): Promise<{ response: NextResponse | null; monitor?: AuthResult["monitor"] }> {
  const authResult = await verifyMonitorAuth(request, requiredRole);

  if (!authResult.success) {
    return {
      response: NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      ),
    };
  }

  return { response: null, monitor: authResult.monitor };
}
