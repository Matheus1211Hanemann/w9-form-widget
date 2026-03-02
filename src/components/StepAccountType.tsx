import React from 'react';
import { W9FormData, AccountType } from '../types';

interface StepAccountTypeProps {
  formData: W9FormData;
  errors: { [key: string]: string };
  onChange: (field: keyof W9FormData, value: any) => void;
}

const accountTypeOptions: { value: AccountType; label: string; description: string }[] = [
  { value: 'individual', label: 'Individual Account', description: 'Personal investment account' },
  { value: 'ira', label: 'IRA Account', description: 'Individual Retirement Account' },
  { value: 'trust', label: 'Trust', description: 'Trust or estate account' },
  { value: 'llc', label: 'LLC', description: 'Limited Liability Company' },
  { value: 'corporation', label: 'Corporation', description: 'C Corporation or S Corporation' },
  { value: '401k', label: '401(k) Plan', description: 'Employer-sponsored retirement plan' }
];

export const StepAccountType: React.FC<StepAccountTypeProps> = ({ formData, errors, onChange }) => {
  return (
    <div className="form-section">
      <h3>Select Account Type</h3>
      <p className="section-description">Choose the type of account for which you're completing this W-9 form</p>

      <div className="account-type-grid">
        {accountTypeOptions.map((option) => (
          <div
            key={option.value}
            className={`account-type-card ${formData.accountType === option.value ? 'selected' : ''}`}
            onClick={() => onChange('accountType', option.value)}
          >
            <div className="account-type-radio">
              <input type="radio" id={`account-${option.value}`} name="accountType" value={option.value}
                checked={formData.accountType === option.value}
                onChange={(e) => onChange('accountType', e.target.value as AccountType)} />
            </div>
            <div className="account-type-content">
              <label htmlFor={`account-${option.value}`}><strong>{option.label}</strong></label>
              <p className="account-type-description">{option.description}</p>
            </div>
          </div>
        ))}
      </div>

      {errors.accountType && <div className="error-message">{errors.accountType}</div>}
    </div>
  );
};
