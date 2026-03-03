import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { W9FormData, ValidationErrors } from '../types';

interface StepSignatureProps {
  formData: W9FormData;
  updateFormData: (updates: Partial<W9FormData>) => void;
  errors: ValidationErrors;
}

export const StepSignature: React.FC<StepSignatureProps> = ({ formData, updateFormData, errors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [signatureMode, setSignatureMode] = useState<'drawn' | 'typed'>(formData.signatureType);

  useEffect(() => {
    if (canvasRef.current && signatureMode === 'drawn') {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
      });

      if (formData.signature && formData.signatureType === 'drawn') {
        signaturePadRef.current.fromDataURL(formData.signature);
      }

      signaturePadRef.current.addEventListener('endStroke', () => {
        if (signaturePadRef.current) {
          const dataUrl = signaturePadRef.current.toDataURL('image/png');
          updateFormData({ signature: dataUrl, signatureType: 'drawn' });
        }
      });

      return () => { signaturePadRef.current?.off(); };
    }
  }, [signatureMode]);

  const clearSignature = () => {
    if (signaturePadRef.current) signaturePadRef.current.clear();
    updateFormData({ signature: '' });
  };

  const handleModeChange = (mode: 'drawn' | 'typed') => {
    setSignatureMode(mode);
    updateFormData({ signature: '', signatureType: mode });
  };

  const handleTypedSignatureChange = (value: string) => {
    updateFormData({ signature: value, signatureType: 'typed' });
  };

  return (
    <div className="w9-step">
      <div className="w9-section">
        <h3 className="w9-section-title">Certification</h3>
        <div className="w9-certification-text">
          <p>Under penalties of perjury, I certify that:</p>
          <ol>
            <li>The number shown on this form is my correct taxpayer identification number, and</li>
            <li>I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am no longer subject to backup withholding, and</li>
            <li>I am a U.S. citizen or other U.S. person, and</li>
            <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
          </ol>
        </div>
      </div>

      <div className="w9-form-group">
        <label className="w9-label">Signature Type</label>
        <div className="w9-signature-mode-toggle">
          <button type="button" className={`w9-mode-btn ${signatureMode === 'drawn' ? 'active' : ''}`} onClick={() => handleModeChange('drawn')}>✍️ Draw Signature</button>
          <button type="button" className={`w9-mode-btn ${signatureMode === 'typed' ? 'active' : ''}`} onClick={() => handleModeChange('typed')}>⌨️ Type Signature</button>
        </div>
      </div>

      <div className="w9-form-group">
        <label className="w9-label">Signature <span className="w9-required">*</span></label>
        {signatureMode === 'drawn' ? (
          <div className="w9-signature-drawn">
            <canvas ref={canvasRef} className={`w9-signature-canvas ${errors.signature ? 'w9-input-error' : ''}`} />
            <button type="button" className="w9-btn-clear" onClick={clearSignature}>Clear Signature</button>
          </div>
        ) : (
          <div className="w9-signature-typed">
            <input type="text" className={`w9-input w9-signature-input ${errors.signature ? 'w9-input-error' : ''}`}
              value={formData.signatureType === 'typed' ? formData.signature : ''} onChange={(e) => handleTypedSignatureChange(e.target.value)} placeholder="Type your full legal name" />
            {formData.signature && formData.signatureType === 'typed' && (
              <div className="w9-signature-preview">
                <span className="w9-signature-typed-display">{formData.signature}</span>
              </div>
            )}
          </div>
        )}
        {errors.signature && <span className="w9-error-message">{errors.signature}</span>}
      </div>

      <div className="w9-form-group">
        <label htmlFor="signatureDate" className="w9-label">Date <span className="w9-required">*</span></label>
        <input type="date" id="signatureDate" className={`w9-input w9-input-date ${errors.signatureDate ? 'w9-input-error' : ''}`}
          value={formData.signatureDate ? new Date(formData.signatureDate).toISOString().split('T')[0] : ''} onChange={(e) => updateFormData({ signatureDate: e.target.value })} />
        {errors.signatureDate && <span className="w9-error-message">{errors.signatureDate}</span>}
      </div>
    </div>
  );
};
