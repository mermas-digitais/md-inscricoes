"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  X,
  Check,
  FileImage,
  FileText,
  Eye,
  RotateCw,
  Download,
  Settings,
} from "lucide-react";
import jsPDF from "jspdf";

interface FileUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
  documentType: string;
}

export function FileUploader({
  isOpen,
  onClose,
  onConfirm,
  documentType,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [useFilters, setUseFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processar imagem com controle de qualidade
  const processImage = useCallback(
    (file: File, applyFilters: boolean = false): Promise<File> => {
      return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
          // Manter dimensões originais ou redimensionar apenas se muito grande
          const maxWidth = 2400; // Aumentar resolução máxima
          const maxHeight = 2400;

          let { width, height } = img;

          // Redimensionar apenas se necessário
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            // Desenhar imagem com suavização
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);

            if (applyFilters) {
              // Aplicar filtros apenas se solicitado
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const data = imageData.data;

              // Melhorar contraste suavemente
              for (let i = 0; i < data.length; i += 4) {
                // Converter para escala de cinza com pesos mais naturais
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Aplicar contraste suave
                const factor = 1.2; // Fator de contraste mais suave
                data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                data[i + 1] = Math.min(
                  255,
                  Math.max(0, factor * (g - 128) + 128)
                );
                data[i + 2] = Math.min(
                  255,
                  Math.max(0, factor * (b - 128) + 128)
                );
              }

              ctx.putImageData(imageData, 0, 0);
            }

            // Converter para blob com qualidade máxima
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const processedFile = new File(
                    [blob],
                    `processed_${file.name}`,
                    { type: "image/jpeg" }
                  );
                  resolve(processedFile);
                } else {
                  resolve(file);
                }
              },
              "image/jpeg",
              1.0
            ); // Qualidade máxima (100%)
          } else {
            resolve(file);
          }
        };

        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  // Converter imagem para PDF mantendo máxima qualidade
  const convertToPDF = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Usar formato A4 mas com maior resolução
        const pdf = new jsPDF({
          orientation: img.width > img.height ? "landscape" : "portrait",
          unit: "pt",
          format: "a4",
          compress: false, // Desabilitar compressão
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Calcular dimensões mantendo proporção máxima
        const imgWidth = img.width;
        const imgHeight = img.height;

        // Usar 90% da página para manter margens mínimas
        const maxWidth = pageWidth * 0.9;
        const maxHeight = pageHeight * 0.9;

        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;

        // Centralizar na página
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        // Adicionar imagem ao PDF com máxima qualidade
        pdf.addImage(
          img,
          "JPEG",
          x,
          y,
          finalWidth,
          finalHeight,
          undefined,
          "SLOW" // Usar compressão lenta para melhor qualidade
        );

        // Converter para blob sem compressão adicional
        const pdfBlob = pdf.output("blob");
        const pdfFile = new File(
          [pdfBlob],
          file.name.replace(/\.[^/.]+$/, ".pdf"),
          { type: "application/pdf" }
        );

        resolve(pdfFile);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Selecionar arquivo
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Verificar tipo de arquivo
      if (!file.type.includes("image") && !file.type.includes("pdf")) {
        alert(
          "Por favor, selecione apenas imagens (JPG, PNG) ou arquivos PDF."
        );
        return;
      }

      setSelectedFile(file);
      setIsProcessing(true);

      try {
        let finalFile = file;

        if (file.type.includes("image")) {
          // Processar imagem
          const processedImageFile = await processImage(file, useFilters);

          // Converter para PDF
          finalFile = await convertToPDF(processedImageFile);
        }

        setProcessedFile(finalFile);

        // Criar URL para preview
        const url = URL.createObjectURL(finalFile);
        setPreviewUrl(url);
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        alert("Erro ao processar arquivo. Tente novamente.");
      } finally {
        setIsProcessing(false);
      }
    },
    [processImage, convertToPDF, useFilters]
  );

  // Confirmar upload
  const handleConfirm = useCallback(() => {
    if (processedFile) {
      onConfirm(processedFile);
      handleClose();
    }
  }, [processedFile, onConfirm]);

  // Fechar e limpar
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setProcessedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsProcessing(false);
    setUseFilters(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  }, [previewUrl, onClose]);

  // Abrir seletor de arquivo
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Download do arquivo processado
  const downloadFile = useCallback(() => {
    if (processedFile) {
      const url = URL.createObjectURL(processedFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = processedFile.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [processedFile]);

  // Reprocessar com filtros
  const handleReprocess = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUseFilters(!useFilters);

    try {
      let finalFile = selectedFile;

      if (selectedFile.type.includes("image")) {
        // Processar imagem com novo setting de filtros
        const processedImageFile = await processImage(
          selectedFile,
          !useFilters
        );

        // Converter para PDF
        finalFile = await convertToPDF(processedImageFile);
      }

      setProcessedFile(finalFile);

      // Atualizar preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(finalFile);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Erro ao reprocessar arquivo:", error);
      alert("Erro ao reprocessar arquivo. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, useFilters, processImage, convertToPDF, previewUrl]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Anexar {documentType}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Área de upload */}
            {!selectedFile && (
              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed border-2"
                onClick={openFileSelector}
              >
                <CardContent className="p-4 sm:p-8 text-center">
                  <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">
                    Toque para selecionar arquivo
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 sm:mb-4 px-2">
                    Imagens serão automaticamente processadas e convertidas para
                    PDF
                  </p>
                  <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileImage className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Imagens</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>PDF</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Controles de processamento */}
            {selectedFile?.type.includes("image") && !isProcessing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Settings className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Qualidade da Digitalização
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="flex items-center gap-2 text-xs sm:text-sm text-blue-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useFilters}
                          onChange={(e) => setUseFilters(e.target.checked)}
                          className="rounded"
                        />
                        Aplicar filtros para melhorar texto
                      </label>
                      {processedFile && (
                        <Button
                          onClick={handleReprocess}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                        >
                          Reaplicar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processamento */}
            {isProcessing && (
              <Card>
                <CardContent className="p-4 sm:p-6 text-center">
                  <RotateCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-blue-500" />
                  <p className="text-sm sm:text-base text-gray-600">
                    {selectedFile?.type.includes("image")
                      ? "Processando imagem e convertendo para PDF..."
                      : "Processando arquivo..."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Preview do arquivo processado */}
            {processedFile && previewUrl && !isProcessing && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      Preview do Arquivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-4 max-h-[40vh] overflow-hidden">
                      {processedFile.type.includes("pdf") &&
                      !selectedFile?.type.includes("image") ? (
                        // Mostrar ícone apenas para PDFs originais
                        <div className="text-center py-4 sm:py-8">
                          <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-red-500" />
                          <p className="font-medium text-sm sm:text-base">
                            {processedFile.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Arquivo PDF (
                            {(processedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      ) : selectedFile?.type.includes("image") ? (
                        // Mostrar preview da imagem original para imagens convertidas para PDF
                        <div className="text-center">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview da imagem"
                            className="max-w-full max-h-60 sm:max-h-96 mx-auto rounded object-contain mb-3"
                          />
                          <div className="text-center">
                            <p className="font-medium text-sm sm:text-base">
                              {processedFile.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              Arquivo PDF (
                              {(processedFile.size / 1024 / 1024).toFixed(2)}{" "}
                              MB)
                            </p>
                            <p className="text-xs text-green-600 mt-2">
                              ✓ Imagem{" "}
                              {useFilters
                                ? "digitalizada com filtros"
                                : "processada"}{" "}
                              e convertida para PDF
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Preview padrão para outros tipos
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full max-h-60 sm:max-h-96 mx-auto rounded object-contain"
                        />
                      )}
                    </div>

                    <div className="flex justify-center gap-2 mt-3 sm:mt-4">
                      <Button
                        onClick={downloadFile}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-7 sm:h-8"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Botões de ação fixos no rodapé */}
        {(selectedFile || processedFile) && (
          <div className="border-t p-4 bg-white">
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <Button
                onClick={openFileSelector}
                variant="outline"
                className="text-sm h-9 sm:h-10"
              >
                <X className="w-4 h-4 mr-2" />
                Trocar Arquivo
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700 text-sm h-9 sm:h-10"
                disabled={!processedFile}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar Anexo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
