import React from 'react';
import { W9FormData, ValidationErrors, TaxClassification, LLCClassification, taxClassificationOptions } from '../types';

interface StepTaxClassificationProps {
  formData: W9FormData;
  updateFormData: (updates: Partial<W9FormData>) => void;
  errors: ValidationErrors;
}

export const StepTaxClassification: React.FC<StepTaxClassificationProps> = ({ formData, updateFormData, errors }) => {
  const isIRA = formData.accountType === 'ira';
  const isCorporation = formData.accountType === 'corporation';

  const handleTaxClassificationChange = (value: TaxClassification) => {
    if (isIRA) return;
    const updates: Partial<W9FormData> = { taxClassification: value };
    if (value !== 'llc') updates.llcClassification = null;
    if (value !== 'other') updates.otherDescription = '';
    updateFormData(updates);
  };

  return (
    <div className="w9-step">
      {isIRA && (
        <div className="w9-info-message" style={{ background: 'rgba(247, 161, 26, 0.05)', border: '1px solid rgba(247, 161, 26, 0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
          <strong>IRA Account:</strong> Tax classification is automatically set to "Other - IRA" for IRA accounts.
        </div>
      )}

      {isCorporation ? (
        <div className="w9-form-group">
          <label className="w9-label">Corporation Type <span className="w9-required">*</span></label>
          <p className="w9-help-text">Select whether your corporation is a C Corporation or S Corporation.</p>
          <div className="w9-radio-group">
            <label className="w9-radio-label">
              <input type="radio" name="taxClassification" value="cCorporation" checked={formData.taxClassification === 'cCorporation'} onChange={() => handleTaxClassificationChange('cCorporation')} className="w9-radio" />
              <span className="w9-radio-text">C Corporation</span>
            </label>
            <label className="w9-radio-label">
              <input type="radio" name="taxClassification" value="sCorporation" checked={formData.taxClassification === 'sCorporation'} onChange={() => handleTaxClassificationChange('sCorporation')} className="w9-radio" />
              <span className="w9-radio-text">S Corporation</span>
            </label>
          </div>
          {errors.taxClassification && <span className="w9-error-message">{errors.taxClassification}</span>}
        </div>
      ) : (
        <div className="w9-form-group">
          <label className="w9-label">Federal Tax Classification <span className="w9-required">*</span></label>
          <p className="w9-help-text">Check the appropriate box for federal tax classification</p>
          <div className="w9-radio-group">
            {taxClassificationOptions.map((option) => (
              <label key={option.value} className="w9-radio-label">
                <input type="radio" name="taxClassification" value={option.value} checked={formData.taxClassification === option.value} onChange={() => handleTaxClassificationChange(option.value)} className="w9-radio" disabled={isIRA} />
                <span className="w9-radio-text">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.taxClassification && <span className="w9-error-message">{errors.taxClassification}</span>}
        </div>
      )}

      {formData.taxClassification === 'llc' && (
        <div className="w9-form-group w9-conditional-field">
          <label className="w9-label">LLC Tax Classification <span className="w9-required">*</span></label>
          <p className="w9-help-text">Enter the tax classification (C=C corporation, S=S corporation, P=Partnership)</p>
          <div className="w9-radio-group w9-radio-group-horizontal">
            {[
              { value: 'C' as LLCClassification, label: 'C - C Corporation' },
              { value: 'S' as LLCClassification, label: 'S - S Corporation' },
              { value: 'P' as LLCClassification, label: 'P - Partnership' }
            ].map((option) => (
              <label key={option.value} className="w9-radio-label">
                <input type="radio" name="llcClassification" value={option.value} checked={formData.llcClassification === option.value} onChange={() => updateFormData({ llcClassification: option.value })} className="w9-radio" />
                <span className="w9-radio-text">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.llcClassification && <span className="w9-error-message">{errors.llcClassification}</span>}
        </div>
      )}

      {formData.taxClassification === 'other' && (
        <div className="w9-form-group w9-conditional-field">
          <label htmlFor="otherDescription" className="w9-label">Entity Type Description <span className="w9-required">*</span></label>
          <p className="w9-help-text">Describe your entity type</p>
          <input type="text" id="otherDescription" className={`w9-input ${errors.otherDescription ? 'w9-input-error' : ''}`} value={formData.otherDescription} onChange={(e) => updateFormData({ otherDescription: e.target.value })} placeholder="Enter entity type" disabled={isIRA} readOnly={isIRA} />
          {errors.otherDescription && <span className="w9-error-message">{errors.otherDescription}</span>}
        </div>
      )}

      <div className="w9-form-row">
        <div className="w9-form-group w9-form-group-half">
          <label htmlFor="exemptPayeeCode" className="w9-label">Exempt Payee Code</label>
          <p className="w9-help-text">If applicable (1-13)</p>
          <input type="text" id="exemptPayeeCode" className="w9-input" value={formData.exemptPayeeCode} onChange={(e) => updateFormData({ exemptPayeeCode: e.target.value })} placeholder="Optional" maxLength={2} />
        </div>
        <div className="w9-form-group w9-form-group-half">
          <label htmlFor="fatcaExemptionCode" className="w9-label">FATCA Exemption Code</label>
          <p className="w9-help-text">If applicable (A-M)</p>
          <input type="text" id="fatcaExemptionCode" className="w9-input" value={formData.fatcaExemptionCode} onChange={(e) => updateFormData({ fatcaExemptionCode: e.target.value.toUpperCase() })} placeholder="Optional" maxLength={1} />
        </div>
      </div>
    </div>
  );
};
