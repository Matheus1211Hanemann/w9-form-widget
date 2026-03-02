import React from 'react';
import { W9FormData, ValidationErrors, TINType, usStates } from '../types';

interface StepAddressTINProps {
  formData: W9FormData;
  updateFormData: (updates: Partial<W9FormData>) => void;
  errors: ValidationErrors;
}

export const StepAddressTIN: React.FC<StepAddressTINProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const isIRA = formData.accountType === 'ira';
  const isIndividual = formData.accountType === 'individual';
  const isTrust = formData.accountType === 'trust';
  const isLLC = formData.accountType === 'llc';
  const isDisregardedLLC = isLLC && formData.llcType === 'disregarded';
  const isStandardLLC = isLLC && formData.llcType && formData.llcType !== 'disregarded';

  // Format IRA EIN as user types (XX-XXXXXXX)
  const handleIRAEINChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 2);
      if (digits.length > 2) {
        formatted += '-' + digits.substring(2, 9);
      }
    }
    updateFormData({ iraEin: formatted });
  };

  // Format SSN as user types (XXX-XX-XXXX)
  const handleSSNChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format with dashes
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 3);
      if (digits.length > 3) {
        formatted += '-' + digits.substring(3, 5);
      }
      if (digits.length > 5) {
        formatted += '-' + digits.substring(5, 9);
      }
    }
    
    updateFormData({ ssn: formatted });
  };

  // Format EIN as user types (XX-XXXXXXX)
  const handleEINChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format with dash
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 2);
      if (digits.length > 2) {
        formatted += '-' + digits.substring(2, 9);
      }
    }
    
    updateFormData({ ein: formatted });
  };

  // Format ZIP code
  const handleZIPChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits.substring(0, 5);
    if (digits.length > 5) {
      formatted += '-' + digits.substring(5, 9);
    }
    updateFormData({ zipCode: formatted });
  };

  return (
    <div className="w9-step">
      {/* Address Section - hidden for IRA (uses custodian address automatically) */}
      {!isIRA && (
        <div className="w9-section">
          <h3 className="w9-section-title">Address</h3>
          
          <div className="w9-form-group">
            <label htmlFor="address" className="w9-label">
              Street Address <span className="w9-required">*</span>
            </label>
            <input
              type="text"
              id="address"
              className={`w9-input ${errors.address ? 'w9-input-error' : ''}`}
              value={formData.address}
              onChange={(e) => updateFormData({ address: e.target.value })}
              placeholder="Number, street, and apt. or suite no."
            />
            {errors.address && <span className="w9-error-message">{errors.address}</span>}
          </div>

          <div className="w9-form-row">
            <div className="w9-form-group w9-form-group-half">
              <label htmlFor="city" className="w9-label">
                City <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="city"
                className={`w9-input ${errors.city ? 'w9-input-error' : ''}`}
                value={formData.city}
                onChange={(e) => updateFormData({ city: e.target.value })}
                placeholder="City"
              />
              {errors.city && <span className="w9-error-message">{errors.city}</span>}
            </div>

            <div className="w9-form-group w9-form-group-quarter">
              <label htmlFor="state" className="w9-label">
                State <span className="w9-required">*</span>
              </label>
              <select
                id="state"
                className={`w9-select ${errors.state ? 'w9-input-error' : ''}`}
                value={formData.state}
                onChange={(e) => updateFormData({ state: e.target.value })}
              >
                <option value="">Select</option>
                {usStates.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.value}
                  </option>
                ))}
              </select>
              {errors.state && <span className="w9-error-message">{errors.state}</span>}
            </div>

            <div className="w9-form-group w9-form-group-quarter">
              <label htmlFor="zipCode" className="w9-label">
                ZIP Code <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="zipCode"
                className={`w9-input ${errors.zipCode ? 'w9-input-error' : ''}`}
                value={formData.zipCode}
                onChange={(e) => handleZIPChange(e.target.value)}
                placeholder="12345"
                maxLength={10}
              />
              {errors.zipCode && <span className="w9-error-message">{errors.zipCode}</span>}
            </div>
          </div>
        </div>
      )}

      {/* TIN Section */}
      <div className="w9-section">
        <h3 className="w9-section-title">Taxpayer Identification Number (TIN)</h3>
        
        {isIRA ? (
          <>
            <div className="w9-ira-ein-notice">
              <div className="w9-ira-ein-icon">⚠️</div>
              <div className="w9-ira-ein-content">
                <strong>Important:</strong> Enter the <strong>IRA-specific EIN</strong> assigned to your Self-Directed IRA account.
                <ul className="w9-ira-ein-list">
                  <li>This is <strong>NOT</strong> your personal Social Security Number</li>
                  <li>This is <strong>NOT</strong> the custodian's general EIN</li>
                  <li>You must apply for this EIN on the <strong>IRS website</strong> (irs.gov)</li>
                </ul>
                <div className="w9-ira-ein-video">
                  <p className="w9-ira-ein-video-label">📹 Watch how to apply for an IRA EIN on the IRS website:</p>
                  <div className="w9-ira-ein-video-wrapper">
                    <iframe
                      src="https://www.loom.com/embed/07f7f5d1b3ac4c06ac834ed6c3eeabab"
                      frameBorder="0"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, borderRadius: '8px' }}
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
            <div className="w9-form-group">
              <label htmlFor="iraEin" className="w9-label">
                IRA EIN <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="iraEin"
                className={`w9-input w9-input-tin w9-input-ira-ein ${errors.iraEin ? 'w9-input-error' : ''}`}
                value={formData.iraEin}
                onChange={(e) => handleIRAEINChange(e.target.value)}
                placeholder="XX-XXXXXXX"
                maxLength={10}
              />
              {errors.iraEin && <span className="w9-error-message">{errors.iraEin}</span>}
            </div>
          </>
        ) : isIndividual ? (
          <>
            <p className="w9-help-text">
              Enter your Social Security Number.
            </p>
            <div className="w9-form-group">
              <label htmlFor="ssn" className="w9-label">
                Social Security Number <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="ssn"
                className={`w9-input w9-input-tin ${errors.ssn ? 'w9-input-error' : ''}`}
                value={formData.ssn}
                onChange={(e) => handleSSNChange(e.target.value)}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
              />
              {errors.ssn && <span className="w9-error-message">{errors.ssn}</span>}
            </div>
          </>
        ) : isTrust ? (
          <>
            <div className="w9-trust-tin-notice">
              <div className="w9-trust-tin-question">
                <span className="w9-trust-tin-icon">❓</span>
                <span className="w9-trust-tin-text">
                  Does the trust have its own EIN, or does it use your Social Security Number?
                </span>
              </div>
              <p className="w9-trust-tin-help">
                Select the appropriate option below based on how the trust files taxes.
              </p>
            </div>

            <div className="w9-form-group">
              <div className="w9-tin-toggle">
                <button
                  type="button"
                  className={`w9-tin-toggle-btn ${formData.tinType === 'ein' ? 'active' : ''}`}
                  onClick={() => updateFormData({ tinType: 'ein' as TINType, ssn: '' })}
                >
                  Trust EIN
                </button>
                <button
                  type="button"
                  className={`w9-tin-toggle-btn ${formData.tinType === 'ssn' ? 'active' : ''}`}
                  onClick={() => updateFormData({ tinType: 'ssn' as TINType, ein: '' })}
                >
                  Your SSN
                </button>
              </div>
            </div>

            {formData.tinType === 'ein' ? (
              <div className="w9-form-group">
                <label htmlFor="ein" className="w9-label">
                  Trust EIN <span className="w9-required">*</span>
                </label>
                <input
                  type="text"
                  id="ein"
                  className={`w9-input w9-input-tin ${errors.ein ? 'w9-input-error' : ''}`}
                  value={formData.ein}
                  onChange={(e) => handleEINChange(e.target.value)}
                  placeholder="XX-XXXXXXX"
                  maxLength={10}
                />
                {errors.ein && <span className="w9-error-message">{errors.ein}</span>}
              </div>
            ) : (
              <div className="w9-form-group">
                <label htmlFor="ssn" className="w9-label">
                  Your Social Security Number <span className="w9-required">*</span>
                </label>
                <input
                  type="text"
                  id="ssn"
                  className={`w9-input w9-input-tin ${errors.ssn ? 'w9-input-error' : ''}`}
                  value={formData.ssn}
                  onChange={(e) => handleSSNChange(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
                {errors.ssn && <span className="w9-error-message">{errors.ssn}</span>}
              </div>
            )}
          </>
        ) : isDisregardedLLC ? (
          <>
            <div className="w9-llc-tin-notice">
              <p><strong>Disregarded Entity LLC:</strong> Since your LLC is a disregarded entity (single-member LLC), 
              we need both your personal SSN and the LLC's EIN.</p>
            </div>
            
            <div className="w9-form-group">
              <label htmlFor="ssn" className="w9-label">
                Your Social Security Number <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="ssn"
                className={`w9-input w9-input-tin ${errors.ssn ? 'w9-input-error' : ''}`}
                value={formData.ssn}
                onChange={(e) => handleSSNChange(e.target.value)}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
              />
              {errors.ssn && <span className="w9-error-message">{errors.ssn}</span>}
            </div>

            <div className="w9-form-group">
              <label htmlFor="ein" className="w9-label">
                LLC's EIN <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="ein"
                className={`w9-input w9-input-tin ${errors.ein ? 'w9-input-error' : ''}`}
                value={formData.ein}
                onChange={(e) => handleEINChange(e.target.value)}
                placeholder="XX-XXXXXXX"
                maxLength={10}
              />
              {errors.ein && <span className="w9-error-message">{errors.ein}</span>}
            </div>
          </>
        ) : isStandardLLC ? (
          <>
            <p className="w9-help-text">
              Enter your LLC's Employer Identification Number (EIN).
            </p>
            <div className="w9-form-group">
              <label htmlFor="ein" className="w9-label">
                LLC's EIN <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="ein"
                className={`w9-input w9-input-tin ${errors.ein ? 'w9-input-error' : ''}`}
                value={formData.ein}
                onChange={(e) => handleEINChange(e.target.value)}
                placeholder="XX-XXXXXXX"
                maxLength={10}
              />
              {errors.ein && <span className="w9-error-message">{errors.ein}</span>}
            </div>
          </>
        ) : (formData.accountType === 'corporation' || formData.accountType === '401k') ? (
          <>
            <p className="w9-help-text">
              {formData.accountType === '401k'
                ? 'Enter the 401k plan\'s Employer Identification Number (EIN).'
                : 'Enter your corporation\'s Employer Identification Number (EIN).'}
            </p>
            <div className="w9-form-group">
              <label htmlFor="ein" className="w9-label">
                Employer Identification Number <span className="w9-required">*</span>
              </label>
              <input
                type="text"
                id="ein"
                className={`w9-input w9-input-tin ${errors.ein ? 'w9-input-error' : ''}`}
                value={formData.ein}
                onChange={(e) => handleEINChange(e.target.value)}
                placeholder="XX-XXXXXXX"
                maxLength={10}
              />
              {errors.ein && <span className="w9-error-message">{errors.ein}</span>}
            </div>
          </>
        ) : (
          <>
            <p className="w9-help-text">
              Enter your TIN. For individuals, this is your Social Security Number (SSN).
              For businesses, this is your Employer Identification Number (EIN).
            </p>

            <div className="w9-form-group">
              <div className="w9-tin-toggle">
                <button
                  type="button"
                  className={`w9-tin-toggle-btn ${formData.tinType === 'ssn' ? 'active' : ''}`}
                  onClick={() => updateFormData({ tinType: 'ssn' as TINType, ein: '' })}
                >
                  SSN (Individual)
                </button>
                <button
                  type="button"
                  className={`w9-tin-toggle-btn ${formData.tinType === 'ein' ? 'active' : ''}`}
                  onClick={() => updateFormData({ tinType: 'ein' as TINType, ssn: '' })}
                >
                  EIN (Business)
                </button>
              </div>
            </div>

            {formData.tinType === 'ssn' ? (
              <div className="w9-form-group">
                <label htmlFor="ssn" className="w9-label">
                  Social Security Number <span className="w9-required">*</span>
                </label>
                <input
                  type="text"
                  id="ssn"
                  className={`w9-input w9-input-tin ${errors.ssn ? 'w9-input-error' : ''}`}
                  value={formData.ssn}
                  onChange={(e) => handleSSNChange(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
                {errors.ssn && <span className="w9-error-message">{errors.ssn}</span>}
              </div>
            ) : (
              <div className="w9-form-group">
                <label htmlFor="ein" className="w9-label">
                  Employer Identification Number <span className="w9-required">*</span>
                </label>
                <input
                  type="text"
                  id="ein"
                  className={`w9-input w9-input-tin ${errors.ein ? 'w9-input-error' : ''}`}
                  value={formData.ein}
                  onChange={(e) => handleEINChange(e.target.value)}
                  placeholder="XX-XXXXXXX"
                  maxLength={10}
                />
                {errors.ein && <span className="w9-error-message">{errors.ein}</span>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Optional Fields - hide for Individual, IRA, Trust, LLC, Corporation, and 401k accounts */}
      {!isIndividual && !isIRA && !isTrust && !isLLC && formData.accountType !== 'corporation' && formData.accountType !== '401k' && (
        <div className="w9-section w9-section-optional">
          <h3 className="w9-section-title">Optional Information</h3>
          
          <div className="w9-form-group">
            <label htmlFor="accountNumbers" className="w9-label">
              Account Number(s)
            </label>
            <input
              type="text"
              id="accountNumbers"
              className="w9-input"
              value={formData.accountNumbers}
              onChange={(e) => updateFormData({ accountNumbers: e.target.value })}
              placeholder="Optional - for requester's use"
            />
          </div>
        </div>
      )}
    </div>
  );
};
