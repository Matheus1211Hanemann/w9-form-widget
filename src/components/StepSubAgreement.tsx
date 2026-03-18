import React, { useState, useRef, useEffect } from 'react';
import { generateSubAgreementPDF, hashPDF, SubAgreementFormData } from '../services/subAgreementPdfService';

interface StepSubAgreementProps {
  investorName: string;
  investmentAmount?: string; // pre-filled from URL param
  onContinue: () => void;    // called when sub agreement is done, proceed to W9
}

type Phase = 'intro' | 'form' | 'sign' | 'submitting' | 'done' | 'error';

export const StepSubAgreement: React.FC<StepSubAgreementProps> = ({
  investorName,
  investmentAmount: initialAmount = '',
  onContinue,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [amount, setAmount] = useState(initialAmount);
  const [confirmedName, setConfirmedName] = useState(investorName);
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

      const pdfBytes = await generateSubAgreementPDF(formData);
      const pdfHash = await hashPDF(pdfBytes);
      const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

      // Send to n8n for Drive upload + audit log
      const webhookUrl = import.meta.env.VITE_N8N_SUB_AGREEMENT_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL || '';
      if (webhookUrl) {
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
      }

      setPhase('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPhase('error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const logo = (
    <div className="w9-logo">
      <img src="https://cs3teste.web.app/images/logo_cs3_white.png" alt="CS3 Investments" style={{ maxWidth: '200px' }} />
    </div>
  );

  const card = (children: React.ReactNode) => (
    <div className="w9-widget">
      {logo}
      <div style={{ padding: '24px 0', maxWidth: '520px', margin: '0 auto' }}>{children}</div>
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
          <li><strong style={{ color: '#FFA100' }}>Subscription Agreement</strong> — confirm details and sign</li>
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
        onClick={() => setPhase('sign')}
        disabled={!confirmedName.trim() || !amount.trim()}
        className="w9-btn w9-btn-primary"
        style={{ width: '100%', fontSize: '15px', padding: '14px', justifyContent: 'center' }}
      >
        Continue to Signature &rarr;
      </button>
    </>
  );

  // ── Sign ──────────────────────────────────────────────────────────────────
  if (phase === 'sign') return card(
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>Sign Your Agreement</h2>
        <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
          Draw your signature below. By signing, you agree to the terms of the Subscription Agreement.
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
        <button onClick={() => setPhase('form')} className="w9-btn w9-btn-secondary" style={{ flex: 1 }}>
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
      <button onClick={() => setPhase('sign')} className="w9-btn w9-btn-primary">Try Again</button>
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
