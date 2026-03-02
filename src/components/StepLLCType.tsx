import React from 'react';
import { W9FormData, ValidationErrors, LLCType } from '../types';

interface StepLLCTypeProps {
  formData: W9FormData;
  errors: ValidationErrors;
  onChange: (field: keyof W9FormData, value: any) => void;
}

const llcTypes: { value: LLCType; label: string; description: string }[] = [
  { value: 'disregarded', label: 'Disregarded Entity (Single-Member LLC)', description: 'A single-member LLC that is disregarded for tax purposes. Taxed as a sole proprietorship.' },
  { value: 'c-corp', label: 'LLC taxed as C Corporation', description: 'An LLC that has elected to be taxed as a C Corporation.' },
  { value: 's-corp', label: 'LLC taxed as S Corporation', description: 'An LLC that has elected to be taxed as an S Corporation.' },
  { value: 'partnership', label: 'LLC taxed as Partnership', description: 'A multi-member LLC taxed as a partnership.' }
];

export const StepLLCType: React.FC<StepLLCTypeProps> = ({ formData, errors, onChange }) => {
  return (
    <div className="w9-step">
      <div className="w9-llc-type-question">
        <span className="w9-llc-type-icon">{'\u{1F3E2}'}</span>
        <span className="w9-llc-type-text">What type of LLC do you have?</span>
      </div>
      <p className="w9-help-text" style={{ marginBottom: '24px' }}>
        This determines how your LLC is classified for tax purposes on the W-9 form.
      </p>

      <div className="w9-account-type-grid">
        {llcTypes.map((type) => (
          <div key={type.value}
            className={`w9-account-type-card ${formData.llcType === type.value ? 'selected' : ''} ${errors.llcType ? 'error' : ''}`}
            onClick={() => onChange('llcType', type.value)}>
            <div className="account-type-radio">
              <input type="radio" name="llcType" value={type.value} checked={formData.llcType === type.value} onChange={() => onChange('llcType', type.value)} />
            </div>
            <div className="account-type-content">
              <label>{type.label}</label>
              <p className="account-type-description">{type.description}</p>
            </div>
          </div>
        ))}
      </div>
      {errors.llcType && <span className="w9-error-message">{errors.llcType}</span>}
    </div>
  );
};
