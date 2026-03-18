import React, { useState } from 'react';

interface StepSubAgreementProps {
  signingUrl: string;
  investorName: string;
  onContinue: () => void;
}

export const StepSubAgreement: React.FC<StepSubAgreementProps> = ({ signingUrl, investorName, onContinue }) => {
  const [clicked, setClicked] = useState(false);
  const firstName = investorName?.split(' ')[0] || 'there';

  const handleSign = () => {
    setClicked(true);
    window.open(signingUrl, '_blank');
  };

  return (
    <div className="w9-widget">
      <div className="w9-logo">
        <img
          src="https://cs3teste.web.app/images/logo_cs3_white.png"
          alt="CS3 Investments"
          style={{ maxWidth: '200px' }}
        />
      </div>

      <div style={{ padding: '24px 0', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
            Welcome, {firstName}!
          </h2>
          <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>
            To get started, please sign your Subscription Agreement first. After that, we will guide you through the remaining steps.
          </p>
        </div>

        <div style={{ background: '#1C2E47', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px' }}>✍️</span>
            <div>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>
                Step 1 of 3: Sign Your Subscription Agreement
              </h3>
              <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
                Review and sign your investment documents securely via SignNow.
              </p>
            </div>
          </div>

          <ul style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.8', paddingLeft: '20px', margin: '0 0 20px' }}>
            <li>Takes about 2 minutes to complete</li>
            <li>Review all details before signing</li>
            <li>You will receive a signed copy by email</li>
          </ul>

          <button
            onClick={handleSign}
            className="w9-btn w9-btn-primary"
            style={{ width: '100%', fontSize: '15px', padding: '14px', justifyContent: 'center' }}
          >
            Sign Subscription Agreement &rarr;
          </button>
        </div>

        {clicked && (
          <div style={{ background: '#0d3325', border: '1px solid #2e7d32', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', color: '#81c784', fontSize: '14px' }}>
            The signing link opened in a new tab. Come back here once you have signed.
          </div>
        )}

        {clicked && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>
              Already signed? Continue to fill your W-9.
            </p>
            <button
              onClick={onContinue}
              className="w9-btn w9-btn-secondary"
              style={{ fontSize: '14px' }}
            >
              Continue to W-9 &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
