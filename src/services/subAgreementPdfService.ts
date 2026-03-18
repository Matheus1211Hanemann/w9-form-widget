import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ─── DEAL CONFIG ────────────────────────────────────────────────────────────
// Update these values when a new deal launches.
// PDF must be committed to /public/sub-agreement.pdf (flat PDF, not a form).
// Coordinates are in PDF points from bottom-left of the page.
// To find coordinates: open PDF in Adobe, hover over the field area and read x/y.

const SUB_AGREEMENT_PDF_URL = './sub-agreement.pdf';

const FIELD_COORDS = {
  // Signature page fields — update per deal
  investorName:      { x: 130, y: 185, size: 11 },
  investmentAmount:  { x: 130, y: 160, size: 11 },
  date:              { x: 400, y: 185, size: 11 },
  signatureImage:    { x: 130, y: 120, width: 200, height: 30 },
};
// ────────────────────────────────────────────────────────────────────────────

export interface SubAgreementFormData {
  investorName: string;
  investmentAmount: string;
  signatureDataUrl: string; // base64 PNG from canvas
  signedAt: string;         // ISO timestamp
}

export async function generateSubAgreementPDF(data: SubAgreementFormData): Promise<Uint8Array> {
  const existingBytes = await fetch(SUB_AGREEMENT_PDF_URL).then(res => {
    if (!res.ok) throw new Error('Failed to load subscription agreement template');
    return res.arrayBuffer();
  });

  const pdfDoc = await PDFDocument.load(existingBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Find the last page (signature page is always last)
  const pages = pdfDoc.getPages();
  const sigPage = pages[pages.length - 1];

  // Draw investor name
  sigPage.drawText(data.investorName, {
    x: FIELD_COORDS.investorName.x,
    y: FIELD_COORDS.investorName.y,
    size: FIELD_COORDS.investorName.size,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Draw investment amount
  const amountFormatted = formatCurrency(data.investmentAmount);
  sigPage.drawText(amountFormatted, {
    x: FIELD_COORDS.investmentAmount.x,
    y: FIELD_COORDS.investmentAmount.y,
    size: FIELD_COORDS.investmentAmount.size,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Draw date
  const dateStr = new Date(data.signedAt).toLocaleDateString('en-US');
  sigPage.drawText(dateStr, {
    x: FIELD_COORDS.date.x,
    y: FIELD_COORDS.date.y,
    size: FIELD_COORDS.date.size,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Embed signature image
  if (data.signatureDataUrl) {
    const sigBase64 = data.signatureDataUrl.split(',')[1];
    const sigBytes = Uint8Array.from(atob(sigBase64), c => c.charCodeAt(0));
    const sigImage = await pdfDoc.embedPng(sigBytes);

    const { width, height } = FIELD_COORDS.signatureImage;
    const aspectRatio = sigImage.width / sigImage.height;
    let drawW = width;
    let drawH = drawW / aspectRatio;
    if (drawH > height) { drawH = height; drawW = drawH * aspectRatio; }

    sigPage.drawImage(sigImage, {
      x: FIELD_COORDS.signatureImage.x,
      y: FIELD_COORDS.signatureImage.y,
      width: drawW,
      height: drawH,
    });
  }

  return pdfDoc.save();
}

export async function hashPDF(pdfBytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBytes.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatCurrency(value: string): string {
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}
