declare module "jscanify" {
  interface JScanify {
    highlightPaper(
      canvas: HTMLCanvasElement | HTMLImageElement
    ): HTMLCanvasElement;
    extractPaper(
      canvas: HTMLCanvasElement | HTMLImageElement,
      resultWidth: number,
      resultHeight: number
    ): HTMLCanvasElement;
  }

  const jscanify: {
    new (): JScanify;
  };

  export default jscanify;
}

// Declaração global para OpenCV
declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}
