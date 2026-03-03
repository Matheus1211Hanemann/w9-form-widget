import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { W9FormData, custodianData } from '../types';

// W9 PDF template URL
const W9_PDF_URL = './W9 Form Empty (1).pdf';

// Debug function to list all form fields in the PDF
export async function listPDFFormFields(): Promise<string[]> {
  const existingPdfBytes = await fetch(W9_PDF_URL).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  const fieldInfo = fields.map(field => {
    const type = field.constructor.name;
    const name = field.getName();
    return `${type}: "${name}"`;
  });
  
  console.log('=== PDF Form Fields ===');
  fieldInfo.forEach(f => console.log(f));
  console.log('======================');
  
  return fieldInfo;
}

// Helper to safely set a text field
function trySetTextField(form: ReturnType<typeof PDFDocument.prototype.getForm>, fieldNames: string[], value: string) {
  for (const fieldName of fieldNames) {
    try {
      const field = form.getTextField(fieldName);
      if (field) {
        field.setText(value);
        console.log(`Set field "${fieldName}" to "${value}"`);
        return true;
      }
    } catch {
      // Field not found, try next
    }
  }
  console.log(`Could not find any of these fields: ${fieldNames.join(', ')}`);
  return false;
}

// Helper to safely check a checkbox
function tryCheckCheckbox(form: ReturnType<typeof PDFDocument.prototype.getForm>, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    try {
      const field = form.getCheckBox(fieldName);
      if (field) {
        field.check();
        console.log(`Checked checkbox "${fieldName}"`);
        return true;
      }
    } catch {
      // Field not found, try next
    }
  }
  console.log(`Could not find any checkbox: ${fieldNames.join(', ')}`);
  return false;
}

export async function generateFilledW9PDF(formData: W9FormData): Promise<Uint8Array> {
  // Fetch the empty W9 PDF template
  const existingPdfBytes = await fetch(W9_PDF_URL).then(res => {
    if (!res.ok) throw new Error('Failed to load W9 PDF template');
    return res.arrayBuffer();
  });

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // Get the form from the PDF
  const form = pdfDoc.getForm();
  
  // Log available fields for debugging
  const fields = form.getFields();
  console.log('Available form fields:');
  fields.forEach(f => console.log(`  ${f.constructor.name}: "${f.getName()}"`));

  // ============================================
  // FILL FORM FIELDS BY NAME
  // Field names from actual W9 PDF (March 2024 revision)
  // ============================================

  // IRA Account Handling
  const isIRA = formData.accountType === 'ira';
  
  // Determine if this is an entity-only account type (entity name goes on Line 1, no personal name)
  const isEntityOnly = formData.accountType === 'trust' || formData.accountType === 'corporation' || formData.accountType === '401k' || 
    (formData.accountType === 'llc' && formData.llcType && formData.llcType !== 'disregarded');

  // Line 1: Name
  if (isIRA && formData.custodian) {
    let custodianName = '';
    if (formData.custodian === 'other') {
      custodianName = formData.custodianName;
    } else {
      custodianName = custodianData[formData.custodian].name;
    }
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_01[0]'
    ], custodianName);
  } else if (isEntityOnly && formData.businessName) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_01[0]'
    ], formData.businessName);
  } else if (formData.name) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_01[0]'
    ], formData.name);
  }

  // Line 2: Business name / DBA
  if (isIRA && formData.name) {
    const fboName = `FBO ${formData.name} IRA`;
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_02[0]'
    ], fboName);
  } else if (!isEntityOnly && formData.businessName) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_02[0]'
    ], formData.businessName);
  }

  // Line 3: Tax classification checkboxes
  const taxClassificationCheckboxes: Record<string, string[]> = {
    individual: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[0]'],
    cCorporation: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[1]'],
    sCorporation: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[2]'],
    partnership: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[3]'],
    trustEstate: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[4]'],
    llc: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[5]'],
    other: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[6]']
  };

  if (formData.taxClassification && taxClassificationCheckboxes[formData.taxClassification]) {
    tryCheckCheckbox(form, taxClassificationCheckboxes[formData.taxClassification]);
  }

  // LLC Classification letter
  if (formData.taxClassification === 'llc' && formData.llcClassification) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_03[0]'
    ], formData.llcClassification.toUpperCase());
  }

  // Other description
  if (formData.taxClassification === 'other' && formData.otherDescription) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_04[0]'
    ], formData.otherDescription);
  }

  // Exempt payee code
  if (formData.exemptPayeeCode) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_05[0]'
    ], formData.exemptPayeeCode);
  }

  // FATCA exemption code
  if (formData.fatcaExemptionCode) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_06[0]'
    ], formData.fatcaExemptionCode);
  }

  // Line 5: Address
  if (isIRA && formData.custodian) {
    let address = '';
    if (formData.custodian === 'other') {
      address = formData.custodianAddress;
    } else {
      address = custodianData[formData.custodian].address;
    }
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]'
    ], address);
  } else if (formData.address) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]'
    ], formData.address);
  }

  // Line 6: City, State, ZIP
  if (isIRA && formData.custodian) {
    let city = '', state = '', zip = '';
    if (formData.custodian === 'other') {
      city = formData.custodianCity;
      state = formData.custodianState;
      zip = formData.custodianZip;
    } else {
      const data = custodianData[formData.custodian];
      city = data.city;
      state = data.state;
      zip = data.zip;
    }
    const cityStateZip = [city, state, zip].filter(Boolean).join(', ');
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]'
    ], cityStateZip);
  } else {
    const cityStateZip = [formData.city, formData.state, formData.zipCode].filter(Boolean).join(', ');
    if (cityStateZip) {
      trySetTextField(form, [
        'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]'
      ], cityStateZip);
    }
  }

  // Line 7: Account numbers
  if (isIRA && formData.iraAccountNumber) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_10[0]'
    ], `IRA: ${formData.iraAccountNumber}`);
  } else if (formData.accountNumbers) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_10[0]'
    ], formData.accountNumbers);
  }

  // ============================================
  // SSN/EIN
  // ============================================
  
  if (isIRA && formData.iraEin) {
    const einDigits = formData.iraEin.replace(/\D/g, '');
    if (einDigits.length >= 9) {
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_14[0]'], einDigits.substring(0, 2));
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_15[0]'], einDigits.substring(2, 9));
    }
  } else if (formData.accountType === 'llc' && formData.llcType === 'disregarded') {
    if (formData.ssn) {
      const ssnDigits = formData.ssn.replace(/\D/g, '');
      if (ssnDigits.length >= 9) {
        trySetTextField(form, ['topmostSubform[0].Page1[0].f1_11[0]'], ssnDigits.substring(0, 3));
        trySetTextField(form, ['topmostSubform[0].Page1[0].f1_12[0]'], ssnDigits.substring(3, 5));
        trySetTextField(form, ['topmostSubform[0].Page1[0].f1_13[0]'], ssnDigits.substring(5, 9));
      }
    }
    if (formData.ein) {
      const einDigits = formData.ein.replace(/\D/g, '');
      if (einDigits.length >= 9) {
        trySetTextField(form, ['topmostSubform[0].Page1[0].f1_14[0]'], einDigits.substring(0, 2));
        trySetTextField(form, ['topmostSubform[0].Page1[0].f1_15[0]'], einDigits.substring(2, 9));
      }
    }
  } else if (formData.accountType === 'llc' && formData.llcType && formData.llcType !== 'disregarded') {
    if (formData.ein) {
      const einDigits = formData.ein.replace(/\D/g, '');
      if (einDigits.length >= 9) {
        trySetTextField(form, ['topmostSubform[0].Page1[0].f1_14[0]'], einDigits.substring(0, 2));
        trySetTextField(form, ['topmostSubform[0].Page1[0].f1_15[0]'], einDigits.substring(2, 9));
      }
    }
  } else if ((formData.accountType === 'corporation' || formData.accountType === '401k') && formData.ein) {
    const einDigits = formData.ein.replace(/\D/g, '');
    if (einDigits.length >= 9) {
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_14[0]'], einDigits.substring(0, 2));
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_15[0]'], einDigits.substring(2, 9));
    }
  } else if (formData.tinType === 'ssn' && formData.ssn) {
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    if (ssnDigits.length >= 9) {
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_11[0]'], ssnDigits.substring(0, 3));
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_12[0]'], ssnDigits.substring(3, 5));
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_13[0]'], ssnDigits.substring(5, 9));
    }
  } else if (formData.tinType === 'ein' && formData.ein) {
    const einDigits = formData.ein.replace(/\D/g, '');
    if (einDigits.length >= 9) {
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_14[0]'], einDigits.substring(0, 2));
      trySetTextField(form, ['topmostSubform[0].Page1[0].f1_15[0]'], einDigits.substring(2, 9));
    }
  }

  // ============================================
  // SIGNATURE & DATE
  // ============================================
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  console.log(`PDF dimensions: ${width} x ${height}`);
  
  const signatureFieldX = 140;
  const signatureFieldY = 185;
  const signatureFieldWidth = 300;

  const dateFieldX = 418;
  const dateFieldY = 185;

  if (formData.signature) {
    if (formData.signatureType === 'drawn') {
      try {
        const signatureData = formData.signature.split(',')[1];
        const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        const maxWidth = signatureFieldWidth;
        const maxHeight = 20;
        const aspectRatio = signatureImage.width / signatureImage.height;
        
        let sigWidth = maxWidth;
        let sigHeight = sigWidth / aspectRatio;
        
        if (sigHeight > maxHeight) {
          sigHeight = maxHeight;
          sigWidth = sigHeight * aspectRatio;
        }
        
        firstPage.drawImage(signatureImage, {
          x: signatureFieldX,
          y: signatureFieldY,
          width: sigWidth,
          height: sigHeight,
        });
        console.log(`Drew signature image at x=${signatureFieldX}, y=${signatureFieldY}, size=${sigWidth}x${sigHeight}`);
      } catch (error) {
        console.error('Failed to embed signature image:', error);
      }
    } else {
      try {
        const fontFamily = "'Dancing Script', cursive";
        const fontSize = 32;

        try {
          await document.fonts.load(`${fontSize}px 'Dancing Script'`);
          await document.fonts.ready;
        } catch (fontErr) {
          console.warn('Could not preload Dancing Script font:', fontErr);
        }

        const sigCanvas = document.createElement('canvas');
        const sigCtx = sigCanvas.getContext('2d')!;
        sigCtx.font = `${fontSize}px ${fontFamily}`;
        const textWidth = sigCtx.measureText(formData.signature).width;
        
        sigCanvas.width = Math.ceil(textWidth + 20);
        sigCanvas.height = Math.ceil(fontSize * 1.6);
        
        sigCtx.fillStyle = 'white';
        sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
        sigCtx.font = `${fontSize}px ${fontFamily}`;
        sigCtx.fillStyle = 'black';
        sigCtx.textBaseline = 'middle';
        sigCtx.fillText(formData.signature, 10, sigCanvas.height / 2);
        
        const dataUrl = sigCanvas.toDataURL('image/png');
        const sigData = dataUrl.split(',')[1];
        const sigBytes = Uint8Array.from(atob(sigData), c => c.charCodeAt(0));
        const sigImage = await pdfDoc.embedPng(sigBytes);
        
        const maxWidth = signatureFieldWidth;
        const maxHeight = 20;
        const aspectRatio = sigImage.width / sigImage.height;
        let sigWidth = maxWidth;
        let sigHeight = sigWidth / aspectRatio;
        if (sigHeight > maxHeight) {
          sigHeight = maxHeight;
          sigWidth = sigHeight * aspectRatio;
        }
        
        firstPage.drawImage(sigImage, {
          x: signatureFieldX,
          y: signatureFieldY,
          width: sigWidth,
          height: sigHeight,
        });
        console.log(`Drew typed signature as cursive image at x=${signatureFieldX}, y=${signatureFieldY}, size=${sigWidth}x${sigHeight}`);
      } catch (error) {
        console.error('Failed to render cursive signature, falling back to Helvetica:', error);
        firstPage.drawText(formData.signature, {
          x: signatureFieldX,
          y: signatureFieldY + 3,
          size: 12,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  // Date field
  if (formData.signatureDate) {
    const dateStr = new Date(formData.signatureDate).toLocaleDateString('en-US');
    firstPage.drawText(dateStr, {
      x: dateFieldX,
      y: dateFieldY + 3,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    console.log(`Drew date "${dateStr}" at x=${dateFieldX}, y=${dateFieldY + 3}`);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper function to create a download link
export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'W9-Filled.pdf') {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Helper function to create a preview URL
export function createPDFPreviewURL(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
