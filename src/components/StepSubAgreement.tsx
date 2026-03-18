import React, { useState, useRef, useEffect } from 'react';
import { generateSubAgreementPDF, hashPDF, SubAgreementFormData } from '../services/subAgreementPdfService';

interface StepSubAgreementProps {
  investorName: string;
  investmentAmount?: string; // pre-filled from URL param
  onContinue: () => void;    // called when sub agreement is done, proceed to W9
}

type Phase = 'intro' | 'form' | 'review' | 'sign' | 'submitting' | 'done' | 'error';

const SUB_AGREEMENT_PDF_URL = './sub-agreement.pdf';

export const StepSubAgreement: React.FC<StepSubAgreementProps> = ({
  investorName,
  investmentAmount: initialAmount = '',
  onContinue,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [amount, setAmount] = useState(initialAmount);
  const [confirmedName, setConfirmedName] = useState(investorName);
  const [hasRead, setHasRead] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firstName = investorName?.split(' ')[0] || 'there';

  // ── Signature canvas ──────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  useEffect(() => {
    if (phase === 'sign' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setSignatureDataUrl(null);
    }
    if (phase === 'review') {
      setHasRead(false);
    }
  }, [phase]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!signatureDataUrl) return;
    setPhase('submitting');
    try {
      const formData: SubAgreementFormData = {
        investorName: confirmedName,
        investmentAmount: amount,
        signatureDataUrl,
        signedAt: new Date().toISOString(),
      };

      const pdfBytes = await generateSubAgreementPDF(formData).catch(e => { throw new Error('PDF generation failed: ' + e.message); });
      const pdfHash = await hashPDF(pdfBytes);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < pdfBytes.length; i += chunkSize) {
        binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunkSize));
      }
      const pdfBase64 = btoa(binary);

      // Send to n8n for Drive upload + audit log (non-blocking — signing is valid regardless)
      const webhookUrl = import.meta.env.VITE_N8N_SUB_AGREEMENT_WEBHOOK_URL || '';
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'sub_agreement.signed',
              timestamp: formData.signedAt,
              investor: { name: confirmedName, email: new URLSearchParams(window.location.search).get('email') || '' },
              deal: new URLSearchParams(window.location.search).get('deal') || '',
              investmentAmount: amount,
              pdfHash,
              pdf: { base64: pdfBase64, filename: `${confirmedName.replace(/[^a-zA-Z0-9]/g, '_')}_SubAgreement.pdf` },
            }),
          });
        } catch (webhookErr) {
          console.warn('Audit trail webhook failed (non-fatal):', webhookErr);
        }
      }

      setPhase('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMsg(msg);
      setPhase('error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const logo = (
    <div className="w9-logo">
      <img src="https://cs3teste.web.app/images/logo_cs3_white.png" alt="CS3 Investments" style={{ maxWidth: '200px' }} />
    </div>
  );

  const card = (children: React.ReactNode, wide = false) => (
    <div className="w9-widget">
      {logo}
      <div style={{ padding: '24px 0', maxWidth: wide ? '720px' : '520px', margin: '0 auto' }}>{children}</div>
    </div>
  );

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') return card(
    <>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
          Welcome, {firstName}!
        </h2>
        <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>
          Before filling out your W-9, please sign your Subscription Agreement first.
        </p>
      </div>

      <div style={{ background: '#1C2E47', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.8', margin: 0 }}>
          This process has <strong style={{ color: '#fff' }}>3 steps</strong> and takes about 5 minutes:
        </p>
        <ol style={{ color: '#ccc', fontSize: '13px', lineHeight: '2', paddingLeft: '20px', margin: '12px 0 0' }}>
          <li><strong style={{ color: '#FFA100' }}>Subscription Agreement</strong> — review and sign</li>
          <li><strong style={{ color: '#fff' }}>W-9 Form</strong> — fill your tax information</li>
          <li><strong style={{ color: '#fff' }}>Accredited Investor Verification</strong></li>
        </ol>
      </div>

      <button onClick={() => setPhase('form')} className="w9-btn w9-btn-primary" style={{ width: '100%', fontSize: '15px', padding: '14px', justifyContent: 'center' }}>
        Get Started &rarr;
      </button>
    </>
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  if (phase === 'form') return card(
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>Step 1: Confirm Your Details</h2>
        <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>These will appear on your Subscription Agreement.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        <div>
          <label style={{ color: '#ccc', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Full Legal Name</label>
          <input
            value={confirmedName}
            onChange={e => setConfirmedName(e.target.value)}
            placeholder="As it should appear on the agreement"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2a3f5f', background: '#1C2E47', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ color: '#ccc', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Investment Amount (USD)</label>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 50000"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2a3f5f', background: '#1C2E47', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <button
        onClick={() => setPhase('review')}
        disabled={!confirmedName.trim() || !amount.trim()}
        className="w9-btn w9-btn-primary"
        style={{ width: '100%', fontSize: '15px', padding: '14px', justifyContent: 'center' }}
      >
        Review Document &rarr;
      </button>
    </>
  );

  // ── Review ────────────────────────────────────────────────────────────────
  if (phase === 'review') return card(
    <>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>Step 2: Review Your Agreement</h2>
        <div style={{ background: '#1C2E47', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
          <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            Please read the full Subscription Agreement before signing.
            For a better reading experience, you can{' '}
            <a
              href={SUB_AGREEMENT_PDF_URL}
              download
              style={{ color: '#FFA100', textDecoration: 'underline', fontWeight: '600' }}
            >
              download the document
            </a>
            {' '}or{' '}
            <a
              href={SUB_AGREEMENT_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FFA100', textDecoration: 'underline', fontWeight: '600' }}
            >
              open it in a new tab
            </a>
            .
          </p>
        </div>
      </div>

      {/* PDF viewer */}
      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a3f5f', marginBottom: '16px' }}>
        <iframe
          src={SUB_AGREEMENT_PDF_URL}
          title="Subscription Agreement"
          style={{ width: '100%', height: '500px', border: 'none', display: 'block', background: '#fff' }}
        />
      </div>

      {/* Checkbox confirmation */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '24px' }}>
        <input
          type="checkbox"
          checked={hasRead}
          onChange={e => setHasRead(e.target.checked)}
          style={{ marginTop: '2px', accentColor: '#FFA100', width: '16px', height: '16px', flexShrink: 0 }}
        />
        <span style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.6' }}>
          I have read and understood the Subscription Agreement and agree to its terms.
        </span>
      </label>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => setPhase('form')} className="w9-btn w9-btn-secondary" style={{ flex: 1 }}>
          &larr; Back
        </button>
        <button
          onClick={() => setPhase('sign')}
          disabled={!hasRead}
          className="w9-btn w9-btn-primary"
          style={{ flex: 2, fontSize: '15px', justifyContent: 'center' }}
        >
          Proceed to Sign &rarr;
        </button>
      </div>
    </>,
    true // wide layout for PDF
  );

  // ── Sign ──────────────────────────────────────────────────────────────────
  if (phase === 'sign') return card(
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>Step 3: Sign Your Agreement</h2>
        <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
          Draw your signature below. By signing, you confirm you have read and agree to the terms.
        </p>
      </div>

      <div style={{ background: '#1C2E47', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
        <canvas
          ref={canvasRef}
          width={460}
          height={120}
          style={{ background: '#fff', borderRadius: '4px', display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={clearSig} className="w9-btn w9-btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
          Clear
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => setPhase('review')} className="w9-btn w9-btn-secondary" style={{ flex: 1 }}>
          &larr; Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!signatureDataUrl}
          className="w9-btn w9-btn-primary"
          style={{ flex: 2, fontSize: '15px', justifyContent: 'center' }}
        >
          Submit Agreement &rarr;
        </button>
      </div>
    </>
  );

  // ── Submitting ────────────────────────────────────────────────────────────
  if (phase === 'submitting') return card(
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div className="w9-spinner" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: '#aaa', fontSize: '14px' }}>Generating and submitting your signed agreement...</p>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === 'error') return card(
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
      <h3 style={{ color: '#fff', marginBottom: '8px' }}>Something went wrong</h3>
      <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '24px' }}>{errorMsg}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={() => setPhase('sign')} className="w9-btn w9-btn-secondary">Back to Signature</button>
        <button onClick={handleSubmit} className="w9-btn w9-btn-primary">Try Again</button>
      </div>
    </div>
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  return card(
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>Agreement Signed!</h2>
      <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '32px' }}>
        Your Subscription Agreement has been submitted. You will receive a copy by email.
        <br /><br />
        Next: fill out your W-9 form.
      </p>
      <button onClick={onContinue} className="w9-btn w9-btn-primary" style={{ fontSize: '15px', padding: '14px 32px' }}>
        Continue to W-9 &rarr;
      </button>
    </div>
  );
};
