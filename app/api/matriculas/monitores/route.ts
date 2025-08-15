import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calcular offset
    const offset = (page - 1) * limit;

    // Buscar total de registros para paginação
    const { count, error: countError } = await supabase
      .from("monitores")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { error: "Erro ao contar monitores" },
        { status: 500 }
      );
    }

    // Buscar todos os monitores paginados
    const { data: monitores, error } = await supabase
      .from("monitores")
      .select("id, nome, email, role, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching monitores:", error);
      return NextResponse.json(
        { error: "Erro ao buscar monitores" },
        { status: 500 }
      );
    }

    // Calcular informações de paginação
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: monitores,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error in monitores API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, role } = await request.json();

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const { data: existingMonitor } = await supabase
      .from("monitores")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (existingMonitor) {
      return NextResponse.json(
        { error: "Email já está cadastrado" },
        { status: 400 }
      );
    }

    // Criar novo monitor
    const { data: monitor, error } = await supabase
      .from("monitores")
      .insert([
        {
          nome,
          email: email.toLowerCase(),
          role: role || "MONITOR",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating monitor:", error);
      return NextResponse.json(
        { error: "Erro ao criar monitor" },
        { status: 500 }
      );
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error("Error in monitor creation:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
