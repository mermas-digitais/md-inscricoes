import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const inscricaoId = formData.get("inscricaoId") as string;
    const fileType = formData.get("fileType") as string;

    if (!file || !inscricaoId || !fileType) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const fileName = `${inscricaoId}_${fileType}_${Date.now()}.${file.name
      .split(".")
      .pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Erro ao fazer upload" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documentos").getPublicUrl(fileName);

    // Update database with file URL
    const columnName = `documento_${fileType}`;
    const { error: updateError } = await supabase
      .from("inscricoes")
      .update({ [columnName]: publicUrl })
      .eq("id", inscricaoId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar banco de dados" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { inscricaoId, fileType } = await request.json();

    if (!inscricaoId || !fileType) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Update database to remove file URL
    const columnName = `documento_${fileType}`;
    const { error: updateError } = await supabase
      .from("inscricoes")
      .update({ [columnName]: null })
      .eq("id", inscricaoId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar banco de dados" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
