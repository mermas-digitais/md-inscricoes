"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Camera,
  RotateCw,
  X,
  Check,
  FileImage,
  Contrast,
  Sun,
  CameraOff,
  RefreshCw,
  Upload,
  AlertTriangle,
} from "lucide-react";

interface DocumentScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onImageProcessed: (imageBlob: Blob, fileName: string) => void;
  onConfirm: (file: File) => void;
  documentType: string;
}

export function DocumentScanner({
  isOpen,
  onClose,
  onImageProcessed,
  onConfirm,
  documentType,
}: DocumentScannerProps) {
  const [step, setStep] = useState<"select" | "camera" | "process">("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useGrayscale, setUseGrayscale] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset estado quando dialog abre/fecha
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = useCallback(() => {
    setStep("select");
    setCapturedImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setCameraError(null);

    // Parar stream da câmera se estiver ativo
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStep("camera");
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      setCameraError(
        "Não foi possível acessar a câmera. Verifique as permissões."
      );
    }
  }, []);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar canvas com dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame do vídeo no canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);

    // Parar stream da câmera
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;

    setStep("process");
  }, []);

  // Upload de arquivo
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        setStep("process");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Processar imagem com filtros básicos
  const processImage = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Configurar canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Aplicar filtros de melhoria
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calcular brilho médio
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        brightness += gray;
      }
      brightness = brightness / (data.length / 4);

      // Aplicar filtros
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (useGrayscale) {
          // Converter para grayscale com contraste aprimorado
          const gray = r * 0.299 + g * 0.587 + b * 0.114;
          let enhanced = gray;

          // Ajustar baseado no brilho
          if (brightness < 100) {
            enhanced = Math.min(255, enhanced * 1.3 + 30);
          } else if (brightness > 180) {
            enhanced = Math.min(255, Math.max(0, (enhanced - 128) * 1.2 + 128));
          } else {
            enhanced = Math.min(255, Math.max(0, (enhanced - 128) * 1.1 + 128));
          }

          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        } else {
          // Modo colorido - ajustar contraste
          const factor = brightness < 120 ? 1.2 : 1.1;
          data[i] = Math.min(255, Math.max(0, (r - 128) * factor + 128));
          data[i + 1] = Math.min(255, Math.max(0, (g - 128) * factor + 128));
          data[i + 2] = Math.min(255, Math.max(0, (b - 128) * factor + 128));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const processedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setProcessedImage(processedDataUrl);
      setIsProcessing(false);
    };

    img.src = capturedImage;
  }, [capturedImage, useGrayscale]);

  // Processar automaticamente quando capturar imagem
  useEffect(() => {
    if (capturedImage && step === "process") {
      processImage();
    }
  }, [capturedImage, step, processImage]);

  // Rotacionar imagem
  const rotateImage = useCallback(() => {
    if (!processedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Trocar dimensões para rotação 90°
      const newWidth = canvas.height;
      const newHeight = canvas.width;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Limpar canvas
      ctx.clearRect(0, 0, newWidth, newHeight);

      // Salvar estado, mover para centro e rotacionar
      ctx.save();
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Atualizar imagem processada
      const rotatedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setProcessedImage(rotatedDataUrl);
    };

    img.src = processedImage;
  }, [processedImage]);

  // Confirmar e converter para arquivo
  const handleConfirm = useCallback(() => {
    if (!processedImage) return;

    fetch(processedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const fileName = `documento_${Date.now()}.jpg`;
        onImageProcessed(blob, fileName);
        onClose();
        handleReset();
      })
      .catch((error) => {
        console.error("Erro ao processar imagem:", error);
      });
  }, [processedImage, onImageProcessed, onClose, handleReset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Digitalizar Documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === "select" && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={startCamera}
                className="h-24 flex-col gap-2"
                variant="outline"
              >
                <Camera className="h-8 w-8" />
                Câmera
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-24 flex-col gap-2"
                variant="outline"
              >
                <Upload className="h-8 w-8" />
                Upload
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {step === "camera" && (
            <div className="space-y-4">
              {cameraError ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>{cameraError}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="rounded-full"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "process" && (
            <div className="space-y-4">
              {isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Processando imagem...
                </div>
              ) : processedImage ? (
                <div className="space-y-4">
                  <img
                    src={processedImage}
                    alt="Documento processado"
                    className="w-full rounded-lg border"
                  />

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setUseGrayscale(!useGrayscale)}
                      variant="outline"
                      size="sm"
                    >
                      {useGrayscale ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Contrast className="h-4 w-4" />
                      )}
                      {useGrayscale ? "Cor" : "P&B"}
                    </Button>

                    <Button onClick={rotateImage} variant="outline" size="sm">
                      <RotateCw className="h-4 w-4" />
                      Girar
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>

          {step === "process" && processedImage && !isProcessing && (
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          )}

          {step !== "select" && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recomeçar
            </Button>
          )}
        </DialogFooter>

        {/* Canvas oculto para processamento */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}