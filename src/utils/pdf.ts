import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - pdfjs-dist doesn't have types for the worker entry
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set the workerSrc using Vite's asset loading
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      throw new Error("No text content found in PDF. It might be an image-based PDF.");
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw error;
  }
};
