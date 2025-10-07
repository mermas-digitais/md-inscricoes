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
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/10 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-100/50 pb-4 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 -m-6 mb-0 px-6 pt-6">
          <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <Upload className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Anexar {documentType}
              </span>
              <p className="text-xs md:text-sm font-normal text-gray-600 mt-1">
                Processe e anexe o documento necessário
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            {/* Área de upload */}
            {!selectedFile && (
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gradient-to-br from-white to-gray-50/50 hover:from-blue-50/30 hover:to-indigo-50/30"
                onClick={openFileSelector}
              >
                <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300">
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Toque para selecionar arquivo
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 md:mb-6 px-2 leading-relaxed">
                    Imagens serão automaticamente processadas e convertidas para
                    PDF com alta qualidade
                  </p>
                  <div className="flex items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <FileImage className="w-4 h-4 text-blue-500" />
                      <span>Imagens</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <FileText className="w-4 h-4 text-red-500" />
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
              <Card className="border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm md:text-base font-semibold text-gray-800">
                        Qualidade da Digitalização
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-white/80 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={useFilters}
                          onChange={(e) => setUseFilters(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium">
                          Aplicar filtros para melhorar texto
                        </span>
                      </label>
                      {processedFile && (
                        <Button
                          onClick={handleReprocess}
                          size="sm"
                          variant="outline"
                          className="bg-white/80 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:shadow-md"
                        >
                          <RotateCw className="w-3 h-3 mr-2" />
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
              <Card className="border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-lg">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <RotateCw className="w-8 h-8 md:w-10 md:h-10 animate-spin text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-800">
                    {selectedFile?.type.includes("image")
                      ? "Processando Imagem"
                      : "Processando Arquivo"}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {selectedFile?.type.includes("image")
                      ? "Otimizando qualidade da imagem e convertendo para PDF..."
                      : "Validando e preparando arquivo..."}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview do arquivo processado */}
            {processedFile && previewUrl && !isProcessing && (
              <div className="space-y-4 md:space-y-6">
                <Card className="border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                        <Eye className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Preview do Arquivo
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 max-h-[60vh] overflow-y-auto border border-gray-200 shadow-inner">
                      {processedFile.type.includes("pdf") &&
                      !selectedFile?.type.includes("image") ? (
                        // Mostrar ícone apenas para PDFs originais
                        <div className="text-center py-6 md:py-10">
                          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <FileText className="w-8 h-8 md:w-10 md:h-10 text-white" />
                          </div>
                          <h4 className="font-bold text-base md:text-lg text-gray-800 mb-2">
                            {processedFile.name}
                          </h4>
                          <p className="text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-lg inline-block border border-gray-200">
                            Arquivo PDF •{" "}
                            {(processedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : selectedFile?.type.includes("image") ? (
                        // Mostrar preview da imagem original para imagens convertidas para PDF
                        <div className="text-center space-y-4">
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Preview da imagem"
                              className="max-w-full max-h-72 md:max-h-96 mx-auto rounded-lg object-contain shadow-lg border border-white"
                            />
                          </div>
                          <div className="bg-white/90 rounded-lg p-4 border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-base md:text-lg text-gray-800 mb-2">
                              {processedFile.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                              Arquivo PDF •{" "}
                              {(processedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Imagem{" "}
                                {useFilters
                                  ? "digitalizada com filtros"
                                  : "processada"}{" "}
                                e convertida para PDF
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Preview padrão para outros tipos
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full max-h-72 md:max-h-96 mx-auto rounded-lg object-contain shadow-lg border border-white"
                        />
                      )}
                    </div>

                    <div className="flex justify-center gap-3 mt-4 md:mt-6">
                      <Button
                        onClick={downloadFile}
                        variant="outline"
                        size="sm"
                        className="bg-white/80 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:shadow-md"
                      >
                        <Download className="w-4 h-4 mr-2" />
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
          <div className="flex-shrink-0 border-t border-gray-100 p-4 md:p-6 bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <Button
                onClick={openFileSelector}
                variant="outline"
                className="h-10 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium bg-white border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md rounded-lg"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Trocar Arquivo
              </Button>
              <Button
                onClick={handleConfirm}
                className="h-10 md:h-12 px-6 md:px-8 text-sm md:text-base font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] rounded-lg"
                disabled={!processedFile}
              >
                <Check className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Confirmar Anexo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
