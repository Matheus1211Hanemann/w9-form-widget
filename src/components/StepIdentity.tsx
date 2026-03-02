import React from 'react';
import { W9FormData, ValidationErrors } from '../types';

interface StepIdentityProps {
  formData: W9FormData;
  updateFormData: (updates: Partial<W9FormData>) => void;
  errors: ValidationErrors;
}

export const StepIdentity: React.FC<StepIdentityProps> = ({ formData, updateFormData, errors }) => {
  const isIRA = formData.accountType === 'ira';
  const isIndividual = formData.accountType === 'individual';
  const isTrust = formData.accountType === 'trust';
  const isLLC = formData.accountType === 'llc';
  const isCorporation = formData.accountType === 'corporation';
  const is401k = formData.accountType === '401k';
  const isStandardLLC = isLLC && formData.llcType && formData.llcType !== 'disregarded';

  const showPersonalName = !isTrust && !isStandardLLC && !isCorporation && !is401k;
  const showBusinessName = !isIRA && !isIndividual;

  return (
    <div className="w9-step">
      {isIRA && (
        <div className="w9-info-message" style={{ background: 'rgba(247, 161, 26, 0.05)', border: '1px solid rgba(247, 161, 26, 0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
          <strong>IRA Account:</strong> Your name will appear on Line 2 as "FBO [Your Name] IRA". Line 1 will show the custodian name.
        </div>
      )}

      {showPersonalName && (
        <div className="w9-form-group">
          <label htmlFor="name" className="w9-label">{isIRA ? 'Your Name (Investor)' : 'Name'} <span className="w9-required">*</span></label>
          <p className="w9-help-text">{isIRA ? 'Enter your full legal name as the IRA account holder' : 'Enter your name as shown on your income tax return'}</p>
          <input type="text" id="name" className={`w9-input ${errors.name ? 'w9-input-error' : ''}`} value={formData.name} onChange={(e) => updateFormData({ name: e.target.value })} placeholder="First name, Middle initial, Last name" />
          {errors.name && <span className="w9-error-message">{errors.name}</span>}
        </div>
      )}

      {showBusinessName && (
        <div className="w9-form-group">
          <label htmlFor="businessName" className="w9-label">
            {isTrust ? 'Trust Name' : isLLC ? 'LLC Name' : isCorporation ? 'Corporation Name' : is401k ? '401k Plan Name' : 'Business Name'}
            {(isTrust || isLLC || isCorporation || is401k) && <span className="w9-required">*</span>}
          </label>
          <p className="w9-help-text">
            {isTrust ? 'Enter the full legal name of the trust' : isLLC ? 'Enter the full legal name of your LLC' : isCorporation ? 'Enter the full legal name of your corporation' : is401k ? 'Enter the full legal name of the 401k plan' : 'If different from above. Disregarded entity name, if applicable.'}
          </p>
          <input type="text" id="businessName" className={`w9-input ${errors.businessName ? 'w9-input-error' : ''}`} value={formData.businessName} onChange={(e) => updateFormData({ businessName: e.target.value })}
            placeholder={isTrust ? 'Full legal name of the trust' : isLLC ? 'Full legal name of the LLC' : isCorporation ? 'Full legal name of the corporation' : is401k ? 'Full legal name of the 401k plan' : 'Business name (optional)'} />
          {errors.businessName && <span className="w9-error-message">{errors.businessName}</span>}
        </div>
      )}
    </div>
  );
};
