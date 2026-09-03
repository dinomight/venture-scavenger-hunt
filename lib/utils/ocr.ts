import { createWorker } from 'tesseract.js';

export interface OcrProgressInfo {
  status: string;
  progress: number; // 0 to 100
}

export interface CleanOcrOptions {
  stripCheckboxes?: boolean;
  stripLineNumbers?: boolean;
  removeEmptyLines?: boolean;
}

/**
 * Performs client-side or server-side OCR on an image file, blob, or URL using Tesseract.js
 */
export async function performOcr(
  imageSource: File | Blob | string,
  onProgress?: (info: OcrProgressInfo) => void
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message && onProgress) {
        let progressPercent = 0;
        if (typeof message.progress === 'number') {
          progressPercent = Math.round(message.progress * 100);
        }
        onProgress({
          status: message.status || 'processing',
          progress: progressPercent,
        });
      }
    },
  });

  try {
    const ret = await worker.recognize(imageSource);
    return ret.data.text || '';
  } finally {
    await worker.terminate();
  }
}

/**
 * Cleans up common OCR checklist artifacts like leading checkboxes, bullet points, and numbered lists.
 */
export function cleanOcrText(
  rawText: string,
  options: CleanOcrOptions = {
    stripCheckboxes: true,
    stripLineNumbers: true,
    removeEmptyLines: true,
  }
): string {
  if (!rawText) return '';

  const lines = rawText.split(/\r?\n/);

  const cleanedLines = lines.map((line) => {
    let cleaned = line.trim();

    // 1. Strip checkboxes: [ ], [x], [X], [v], [], ( ), (x), □, ■, ▢, ▣, ◯, etc.
    if (options.stripCheckboxes) {
      cleaned = cleaned.replace(/^[\[\(\{][\s_xXvV\-\*\.]*[\]\)\}]\s*/, '');
      cleaned = cleaned.replace(/^[□■▢▣◯○●✓✔︎☒☑]\s*/, '');
    }

    // 2. Strip bullet markers: •, -, *, +, >, ~, etc.
    cleaned = cleaned.replace(/^[\u2022\u2023\u25E6\u2043\u2219\*\-\+\>~]\s*/, '');

    // 3. Strip line numbers: "1.", "1)", "1 -", "1:", "#1", "01.", etc.
    if (options.stripLineNumbers) {
      cleaned = cleaned.replace(/^(?:#|\b)\d+[\.\)\:\-]\s*/, '');
    }

    return cleaned.trim();
  });

  if (options.removeEmptyLines) {
    return cleanedLines.filter((line) => line.length > 0).join('\n');
  }

  return cleanedLines.join('\n');
}
