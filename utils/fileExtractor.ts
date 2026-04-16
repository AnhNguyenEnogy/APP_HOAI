
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'txt':
    case 'md':
      return await file.text();

    case 'docx':
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (!result.value.trim()) {
        throw new Error("File Word không chứa văn bản hoặc không đọc được.");
      }
      return result.value;

    case 'pdf':
      return await extractTextFromPdf(file);

    default:
      throw new Error(`Định dạng file .${extension} không được hỗ trợ. Vui lòng sử dụng .docx, .pdf, .txt, hoặc .md.`);
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  if (!fullText.trim()) {
    throw new Error("File PDF là dạng ảnh scan hoặc không có văn bản có thể trích xuất. Vui lòng chuyển sang bản Word hoặc copy văn bản trực tiếp.");
  }

  return fullText;
}
