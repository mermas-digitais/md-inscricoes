import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { data: inscricoes, error } = await supabase
      .from("inscricoes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Erro ao buscar inscrições" }, { status: 500 })
    }

    return NextResponse.json(inscricoes)
  } catch (error) {
    console.error("Error fetching inscriptions:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
