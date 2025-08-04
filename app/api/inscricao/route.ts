import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Check if registration is still open
    const deadline = process.env.REGISTRATION_DEADLINE
    if (deadline && new Date() > new Date(deadline)) {
      return NextResponse.json({ error: "Inscrições encerradas" }, { status: 400 })
    }

    // Determine course based on escolaridade
    const curso = data.escolaridade === "Ensino Fundamental 2" ? "Jogos" : "Robótica"

    // Insert into database
    const { data: inscricao, error } = await supabase
      .from("inscricoes")
      .insert([
        {
          ...data,
          curso,
          status: "INSCRITA",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Erro ao salvar inscrição" }, { status: 500 })
    }

    return NextResponse.json({ success: true, curso })
  } catch (error) {
    console.error("Error creating inscription:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
