import React, { useState } from 'react';

interface AccreditationChoiceProps {
  onDone: () => void;
}

export const AccreditationChoice: React.FC<AccreditationChoiceProps> = ({ onDone }) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = './Accreditation_Letter_Template.pdf';
    link.download = 'Accredited_Investor_Verification_Letter.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
  };

  const handleVerifyInvestor = () => {
    window.open('https://verifyinvestor.com', '_blank');
  };

  return (
    <div className="w9-widget">
      <div className="w9-logo">
        <img
          src="https://assets.cdn.filesafe.space/hX83Iw1k4t1OkxxBWMGa/media/682cd4db7ae79b622bda02e9.png"
          alt="CS3 Investments"
          style={{ maxWidth: '200px' }}
        />
      </div>

      <div className="accreditation-choice">
        <div className="accreditation-header">
          <div className="accreditation-icon">🛡️</div>
          <h2>Accredited Investor Verification</h2>
          <p>
            As part of the investment process, we need to verify your accredited investor status.
            Please choose one of the options below:
          </p>
        </div>

        <div className="accreditation-options">
          <div className="accreditation-card" onClick={handleDownload}>
            <div className="accreditation-card-icon">📄</div>
            <h3>Download Verification Letter</h3>
            <p>
              Download the Accredited Investor Verification Letter and have it completed by your
              licensed attorney, CPA, investment advisor, or broker-dealer.
            </p>
            <span className="accreditation-card-action">Download PDF →</span>
          </div>

          <div className="accreditation-card" onClick={handleVerifyInvestor}>
            <div className="accreditation-card-icon">🌐</div>
            <h3>Verify via VerifyInvestor</h3>
            <p>
              Use VerifyInvestor.com, a third-party verification service, to complete your
              accredited investor verification online.
            </p>
            <span className="accreditation-card-action">Go to VerifyInvestor.com →</span>
          </div>
        </div>

        {downloaded && (
          <div className="accreditation-download-notice">
            ✅ Letter downloaded! Send it to your attorney, CPA, or financial advisor to complete.
          </div>
        )}

        <div className="accreditation-footer">
          <button type="button" className="w9-btn-link" onClick={onDone}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
