import React, { useEffect, useState, useRef } from 'react';
import { W9FormData } from '../types';
import { generateFilledW9PDF, downloadPDF } from '../services/pdfService';
import { notifyFormCompleted } from '../services/webhookService';
import { sendW9Email } from '../services/emailService';
import { markAsCompleted, hasBeenCompleted, clearFormData } from '../services/trackingService';

interface PDFPreviewProps {
  formData: W9FormData;
  onEdit: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  investorId: string | null;
  investorName: string;
  storageKey: string;
  onAccreditation: () => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ formData, onEdit, isGenerating, setIsGenerating, investorId, investorName, storageKey, onAccreditation }) => {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const completionSent = useRef(false);

  useEffect(() => {
    generatePreview();
    return () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); };
  }, []);

  const generatePreview = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const bytes = await generateFilledW9PDF(formData);
      setPdfBytes(bytes);
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (pdfBytes) {
      setIsDownloading(true);
      setEmailError(null);
      const timestamp = new Date().toISOString().split('T')[0];
      const safeName = formData.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `W9_${safeName}_${timestamp}.pdf`;

      if (!completionSent.current) {
        completionSent.current = true;
        try {
          if (investorId && !hasBeenCompleted(investorId)) {
            markAsCompleted(investorId);
            await notifyFormCompleted(investorId, investorName, formData as any, pdfBytes);
          }
          const submitterName = formData.name || investorName || 'Anonymous';
          const emailSent = await sendW9Email(submitterName, formData as any, pdfBytes);
          if (!emailSent) {
            setEmailError('Failed to send email. The form was downloaded but the email could not be sent.');
            completionSent.current = false;
          }
          clearFormData(storageKey);
        } catch (err) {
          setEmailError('An error occurred while submitting. Please try again.');
          completionSent.current = false;
        }
      }

      downloadPDF(pdfBytes, filename);
      setTimeout(() => { setIsDownloading(false); setDownloadComplete(true); }, 500);
    }
  };

  const handleOpenInNewTab = () => { if (pdfBlobUrl) window.open(pdfBlobUrl, '_blank'); };

  if (isGenerating) {
    return (<div className="w9-preview"><div className="w9-preview-loading"><div className="w9-spinner"></div><p>Generating your W-9 document...</p></div></div>);
  }
  if (error) {
    return (<div className="w9-preview"><div className="w9-preview-error"><div className="w9-error-icon">⚠️</div><h3>Error Generating PDF</h3><p>{error}</p><div className="w9-preview-actions"><button className="w9-btn w9-btn-secondary" onClick={onEdit}>← Go Back & Edit</button><button className="w9-btn w9-btn-primary" onClick={generatePreview}>Try Again</button></div></div></div>);
  }
  if (downloadComplete) {
    return (<div className="w9-preview"><div className="w9-preview-success"><div className="w9-success-icon">✓</div><h3>Submission Complete!</h3><p>Your W-9 form has been submitted and downloaded successfully.</p><div className="w9-preview-actions"><button className="w9-btn w9-btn-secondary" onClick={handleDownload}>Download Again</button><button className="w9-btn w9-btn-primary" onClick={onAccreditation}>Continue to Accreditation →</button></div></div></div>);
  }

  return (
    <div className="w9-preview">
      <div className="w9-preview-header"><h2>Your W-9 is Ready!</h2><p>Your W-9 form has been generated successfully.</p></div>
      <div className="w9-preview-summary">
        <h3>Form Summary</h3>
        <div className="w9-summary-grid">
          <div className="w9-summary-item"><span className="w9-summary-label">Name:</span><span className="w9-summary-value">{formData.name}</span></div>
          {formData.businessName && <div className="w9-summary-item"><span className="w9-summary-label">Business:</span><span className="w9-summary-value">{formData.businessName}</span></div>}
          <div className="w9-summary-item"><span className="w9-summary-label">Address:</span><span className="w9-summary-value">{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</span></div>
          <div className="w9-summary-item"><span className="w9-summary-label">TIN Type:</span><span className="w9-summary-value">{formData.tinType === 'ssn' ? 'Social Security Number' : 'Employer ID Number'}</span></div>
        </div>
      </div>
      <div className="w9-preview-actions">
        <button className="w9-btn w9-btn-secondary" onClick={onEdit}>← Go Back & Edit</button>
        <button className="w9-btn w9-btn-primary" onClick={handleOpenInNewTab}>📄 Review PDF</button>
        <button className="w9-btn w9-btn-primary w9-btn-download" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (<><span className="w9-btn-spinner"></span> Completing...</>) : (<>✅ Complete & Download</>)}
        </button>
      </div>
      {emailError && <div className="w9-error" style={{ marginTop: '12px' }}>{emailError}</div>}
    </div>
  );
};
