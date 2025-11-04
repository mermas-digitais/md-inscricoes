import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

// POST - Upload de template de certificado
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("template") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo de template é obrigatório" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use JPG, PNG ou WebP" },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 10MB" },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `template_${timestamp}.${fileExtension}`;

    // Caminho para salvar o arquivo
    const uploadDir = join(process.cwd(), "public", "assets", "certificados");
    const filePath = join(uploadDir, fileName);

    // Criar diretório se não existir
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Diretório já existe, continuar
    }

    // Converter arquivo para buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL pública do arquivo
    const publicUrl = `/assets/certificados/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        filePath: publicUrl,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
      message: "Template enviado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao fazer upload do template:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
