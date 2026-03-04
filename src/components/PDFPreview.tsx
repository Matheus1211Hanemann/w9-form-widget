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
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
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

  const handleComplete = async () => {
    if (pdfBytes && !completionSent.current) {
      setIsCompleting(true);
      setEmailError(null);
      completionSent.current = true;
      try {
        if (investorId && !hasBeenCompleted(investorId)) {
          markAsCompleted(investorId);
          await notifyFormCompleted(investorId, investorName, formData as any, pdfBytes);
        }
        const submitterName = formData.name || investorName || 'Anonymous';
        const emailSent = await sendW9Email(submitterName, formData as any, pdfBytes);
        if (!emailSent) {
          setEmailError('Failed to send email. The form was submitted but the email could not be sent.');
          completionSent.current = false;
        }
        clearFormData(storageKey);
        setIsCompleted(true);
      } catch (err) {
        setEmailError('An error occurred while submitting. Please try again.');
        completionSent.current = false;
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const handleDownload = () => {
    if (pdfBytes) {
      setIsDownloading(true);
      const timestamp = new Date().toISOString().split('T')[0];
      const safeName = formData.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `W9_${safeName}_${timestamp}.pdf`;
      downloadPDF(pdfBytes, filename);
      setTimeout(() => { setIsDownloading(false); }, 500);
    }
  };


  if (isGenerating) {
    return (<div className="w9-preview"><div className="w9-preview-loading"><div className="w9-spinner"></div><p>Generating your W-9 document...</p></div></div>);
  }
  if (error) {
    return (<div className="w9-preview"><div className="w9-preview-error"><div className="w9-error-icon">⚠️</div><h3>Error Generating PDF</h3><p>{error}</p><div className="w9-preview-actions"><button className="w9-btn w9-btn-secondary" onClick={onEdit}>← Go Back & Edit</button><button className="w9-btn w9-btn-primary" onClick={generatePreview}>Try Again</button></div></div></div>);
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
      {!isCompleted && (
        <div style={{ background: '#1C2E47', border: '1px solid #FFA100', borderRadius: '8px', padding: '12px 16px', margin: '16px 0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '20px', lineHeight: '1' }}>⚠️</span>
          <p style={{ margin: 0, color: '#e0e0e0', fontSize: '14px', lineHeight: '1.5' }}>
            <strong style={{ color: '#FFA100' }}>Important:</strong> You must click <strong>"Submit W-9"</strong> below to send your document to us. Downloading the PDF alone does not complete your submission.
          </p>
        </div>
      )}
      <div className="w9-preview-actions">
        <button className="w9-btn w9-btn-secondary" onClick={onEdit} disabled={isCompleted}>← Go Back & Edit</button>
        <button className="w9-btn w9-btn-primary" onClick={handleDownload} disabled={isDownloading || !pdfBytes}>
          {isDownloading ? (<><span className="w9-btn-spinner"></span> Downloading...</>) : (<>📄 Download PDF</>)}
        </button>
        {!isCompleted ? (
          <button className="w9-btn w9-btn-primary w9-btn-download" onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? (<><span className="w9-btn-spinner"></span> Submitting...</>) : (<>✅ Submit W-9</>)}
          </button>
        ) : (
          <button className="w9-btn w9-btn-primary w9-btn-download" onClick={onAccreditation}>
            Continue →
          </button>
        )}
      </div>
      {isCompleted && <div className="w9-success" style={{ marginTop: '12px', color: '#4CAF50' }}>Your W-9 has been submitted successfully!</div>}
      {emailError && <div className="w9-error" style={{ marginTop: '12px' }}>{emailError}</div>}
    </div>
  );
};
