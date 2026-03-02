import React from 'react';
import { W9FormData, Custodian, custodianData, usStates } from '../types';

interface StepCustodianProps {
  formData: W9FormData;
  errors: { [key: string]: string };
  onChange: (field: keyof W9FormData, value: any) => void;
}

const custodianOptions: { value: Custodian; label: string }[] = [
  { value: 'equity-trust', label: 'Equity Trust Company Custodian' },
  { value: 'ira-innovations', label: 'IRA Innovations' },
  { value: 'ira-financial', label: 'IRA Financials Trust Company' },
  { value: 'other', label: 'Other Custodian' }
];

export const StepCustodian: React.FC<StepCustodianProps> = ({ formData, errors, onChange }) => {
  const handleCustodianChange = (custodian: Custodian) => {
    onChange('custodian', custodian);
    if (custodian !== 'other' && custodianData[custodian]) {
      const data = custodianData[custodian];
      onChange('custodianName', data.name);
      onChange('custodianAddress', data.address);
      onChange('custodianCity', data.city);
      onChange('custodianState', data.state);
      onChange('custodianZip', data.zip);
    } else if (custodian === 'other') {
      onChange('custodianName', '');
      onChange('custodianAddress', '');
      onChange('custodianCity', '');
      onChange('custodianState', '');
      onChange('custodianZip', '');
    }
  };

  return (
    <div className="form-section">
      <h3>IRA Custodian Information</h3>
      <p className="section-description">Select your IRA custodian and provide account details</p>

      <div className="form-group">
        <label htmlFor="custodian">IRA Custodian <span className="required">*</span></label>
        <select id="custodian" value={formData.custodian || ''} onChange={(e) => handleCustodianChange(e.target.value as Custodian)} className={errors.custodian ? 'error' : ''}>
          <option value="">Select a custodian...</option>
          {custodianOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.custodian && <div className="error-message">{errors.custodian}</div>}
      </div>

      {formData.custodian === 'other' && (
        <>
          <div className="form-group">
            <label htmlFor="custodianName">Custodian Name <span className="required">*</span></label>
            <input type="text" id="custodianName" value={formData.custodianName} onChange={(e) => onChange('custodianName', e.target.value)} className={errors.custodianName ? 'error' : ''} placeholder="Enter custodian name" />
            {errors.custodianName && <div className="error-message">{errors.custodianName}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="custodianAddress">Address <span className="required">*</span></label>
            <input type="text" id="custodianAddress" value={formData.custodianAddress} onChange={(e) => onChange('custodianAddress', e.target.value)} className={errors.custodianAddress ? 'error' : ''} placeholder="Street address" />
            {errors.custodianAddress && <div className="error-message">{errors.custodianAddress}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="custodianCity">City <span className="required">*</span></label>
              <input type="text" id="custodianCity" value={formData.custodianCity} onChange={(e) => onChange('custodianCity', e.target.value)} className={errors.custodianCity ? 'error' : ''} placeholder="City" />
              {errors.custodianCity && <div className="error-message">{errors.custodianCity}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="custodianState">State <span className="required">*</span></label>
              <select id="custodianState" value={formData.custodianState} onChange={(e) => onChange('custodianState', e.target.value)} className={errors.custodianState ? 'error' : ''}>
                <option value="">Select...</option>
                {usStates.map((state) => (<option key={state.value} value={state.value}>{state.label}</option>))}
              </select>
              {errors.custodianState && <div className="error-message">{errors.custodianState}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="custodianZip">ZIP Code <span className="required">*</span></label>
              <input type="text" id="custodianZip" value={formData.custodianZip} onChange={(e) => onChange('custodianZip', e.target.value)} className={errors.custodianZip ? 'error' : ''} placeholder="12345" />
              {errors.custodianZip && <div className="error-message">{errors.custodianZip}</div>}
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="iraAccountNumber">IRA Account Number <span className="required">*</span></label>
        <input type="text" id="iraAccountNumber" value={formData.iraAccountNumber} onChange={(e) => onChange('iraAccountNumber', e.target.value)} className={errors.iraAccountNumber ? 'error' : ''} placeholder="Enter your IRA account number" />
        {errors.iraAccountNumber && <div className="error-message">{errors.iraAccountNumber}</div>}
        <p className="help-text">This is your account number with the custodian</p>
      </div>
    </div>
  );
};
