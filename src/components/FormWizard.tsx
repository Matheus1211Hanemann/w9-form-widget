import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  W9FormData,
  initialFormData,
  formSteps,
  validateStep,
  ValidationErrors
} from '../types';
import { StepAccountType } from './StepAccountType';
import { StepCustodian } from './StepCustodian';
import { StepLLCType } from './StepLLCType';
import { StepIdentity } from './StepIdentity';
import { StepTaxClassification } from './StepTaxClassification';
import { StepAddressTIN } from './StepAddressTIN';
import { StepSignature } from './StepSignature';
import { PDFPreview } from './PDFPreview';
import { AccreditationChoice } from './AccreditationChoice';
import {
  getInvestorEmailFromUrl,
  getInvestorNameFromUrl,
  hasInvestorContext,
  saveFormData,
  loadFormData,
  saveCurrentStep,
  loadCurrentStep,
  hasBeenOpened,
  markAsOpened,
  hasBeenStarted,
  markAsStarted,
} from '../services/trackingService';
import {
  notifyFormOpened,
  notifyFormStarted,
  notifyFormProgress,
} from '../services/webhookService';

export const FormWizard: React.FC = () => {
  const investorId = getInvestorEmailFromUrl();
  const investorName = getInvestorNameFromUrl() || 'Unknown';
  const isTracked = hasInvestorContext();
  const storageKey = investorId || 'anonymous';

  const loadInitialFormData = (): W9FormData => {
    const saved = loadFormData(storageKey);
    if (saved) return { ...initialFormData, ...saved };
    return initialFormData;
  };

  const loadInitialStep = (): number => {
    const saved = loadCurrentStep(storageKey);
    if (saved !== null) return saved;
    return 0;
  };

  const [currentStep, setCurrentStep] = useState(loadInitialStep);
  const [formData, setFormData] = useState<W9FormData>(loadInitialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAccreditation, setShowAccreditation] = useState(false);
  const hasNotifiedOpened = useRef(false);

  // Auto-set tax classification based on account type
  useEffect(() => {
    if (formData.accountType === 'ira') {
      setFormData(prev => ({ ...prev, taxClassification: 'other', otherDescription: 'IRA' }));
    } else if (formData.accountType === 'individual') {
      setFormData(prev => ({ ...prev, taxClassification: 'individual', llcClassification: null, otherDescription: '' }));
    } else if (formData.accountType === 'trust') {
      setFormData(prev => ({ ...prev, taxClassification: 'trustEstate', llcClassification: null, otherDescription: '' }));
    } else if (formData.accountType === '401k') {
      setFormData(prev => ({ ...prev, taxClassification: 'trustEstate', llcClassification: null, otherDescription: '' }));
    } else if (formData.accountType === 'corporation') {
      setFormData(prev => ({ ...prev, taxClassification: null as any, llcClassification: null, otherDescription: '' }));
    }
  }, [formData.accountType]);

  // Auto-set tax classification based on LLC type
  useEffect(() => {
    if (formData.accountType === 'llc' && formData.llcType) {
      if (formData.llcType === 'disregarded') {
        setFormData(prev => ({ ...prev, taxClassification: 'individual', llcClassification: null, otherDescription: '' }));
      } else if (formData.llcType === 'c-corp') {
        setFormData(prev => ({ ...prev, taxClassification: 'llc', llcClassification: 'C', otherDescription: '' }));
      } else if (formData.llcType === 's-corp') {
        setFormData(prev => ({ ...prev, taxClassification: 'llc', llcClassification: 'S', otherDescription: '' }));
      } else if (formData.llcType === 'partnership') {
        setFormData(prev => ({ ...prev, taxClassification: 'llc', llcClassification: 'P', otherDescription: '' }));
      }
    }
  }, [formData.accountType, formData.llcType]);

  // Webhook: form.opened
  useEffect(() => {
    if (isTracked && investorId && !hasNotifiedOpened.current) {
      hasNotifiedOpened.current = true;
      if (!hasBeenOpened(investorId)) {
        markAsOpened(investorId);
        notifyFormOpened(investorId, investorName);
      }
    }
  }, []);

  // Auto-save form data to localStorage
  const persistFormData = useCallback(() => {
    saveFormData(storageKey, formData);
  }, [storageKey, formData]);

  useEffect(() => {
    const timer = setTimeout(persistFormData, 300);
    return () => clearTimeout(timer);
  }, [formData, persistFormData]);

  useEffect(() => {
    saveCurrentStep(storageKey, currentStep);
  }, [currentStep, storageKey]);

  const updateFormData = (updates: Partial<W9FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    const updatedKeys = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedKeys.forEach(key => delete newErrors[key]);
      return newErrors;
    });
  };

  const onChange = (field: keyof W9FormData, value: any) => {
    updateFormData({ [field]: value });
  };

  const getVisibleSteps = () => {
    const steps = [formSteps[0]]; // Account Type always visible
    if (formData.accountType === 'ira') steps.push(formSteps[1]); // Custodian
    if (formData.accountType === 'llc') steps.push(formSteps[6]); // LLC Type
    steps.push(formSteps[2]); // Identity
    if (formData.accountType !== 'ira' && formData.accountType !== 'individual' && formData.accountType !== 'trust' && formData.accountType !== 'llc' && formData.accountType !== '401k') {
      steps.push(formSteps[3]); // Tax Classification
    }
    steps.push(formSteps[4], formSteps[5]); // Address/TIN, Signature
    return steps;
  };

  const getStepId = () => {
    const visibleSteps = getVisibleSteps();
    return visibleSteps[currentStep]?.id || 0;
  };

  const handleNext = () => {
    const stepId = getStepId();
    const stepErrors = validateStep(stepId, formData);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }

    const visibleSteps = getVisibleSteps();
    if (currentStep < visibleSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setErrors({});
      if (isTracked && investorId) {
        if (currentStep === 0 && !hasBeenStarted(investorId)) {
          markAsStarted(investorId);
          notifyFormStarted(investorId, investorName);
        }
        notifyFormProgress(investorId, investorName, nextStep, visibleSteps.length, visibleSteps[nextStep].title);
      }
    } else {
      setShowPreview(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) { setCurrentStep(prev => prev - 1); setErrors({}); }
  };

  const renderStep = () => {
    const stepId = getStepId();

    switch (stepId) {
      case 0:
        return <StepAccountType formData={formData} errors={errors} onChange={onChange} />;
      case 1:
        return <StepCustodian formData={formData} errors={errors} onChange={onChange} />;
      case 6:
        return <StepLLCType formData={formData} errors={errors} onChange={onChange} />;
      case 2:
        return <StepIdentity formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 3:
        return <StepTaxClassification formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 4:
        return <StepAddressTIN formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 5:
        return <StepSignature formData={formData} updateFormData={updateFormData} errors={errors} />;
      default:
        return null;
    }
  };

  if (showAccreditation) {
    return (
      <AccreditationChoice />
    );
  }

  if (showPreview) {
    return (
      <PDFPreview
        formData={formData}
        onEdit={() => setShowPreview(false)}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        investorId={investorId}
        investorName={investorName}
        storageKey={storageKey}
        onAccreditation={() => setShowAccreditation(true)}
      />
    );
  }

  return (
    <div className="w9-wizard">
      <div className="w9-logo">
        <img
          src="https://assets.cdn.filesafe.space/hX83Iw1k4t1OkxxBWMGa/media/682cd4db7ae79b622bda02e9.png"
          alt="CS3 Investments"
        />
      </div>

      <div className="w9-progress">
        {getVisibleSteps().map((step, index) => (
          <div key={step.id} className={`w9-progress-step ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}>
            <div className="w9-progress-number">{index < currentStep ? '\u2713' : index + 1}</div>
            <div className="w9-progress-label">{step.title}</div>
          </div>
        ))}
      </div>

      <div className="w9-step-header">
        <h2 className="w9-step-title">Step {currentStep + 1}: {getVisibleSteps()[currentStep].title}</h2>
        <p className="w9-step-description">{getVisibleSteps()[currentStep].description}</p>
      </div>

      <div className="w9-step-content">{renderStep()}</div>

      <div className="w9-navigation">
        <button type="button" className="w9-btn w9-btn-secondary" onClick={handleBack} disabled={currentStep === 0}>
          &larr; Back
        </button>
        <button type="button" className="w9-btn w9-btn-primary" onClick={handleNext}>
          {currentStep === getVisibleSteps().length - 1 ? 'Preview Document \u2192' : 'Next \u2192'}
        </button>
      </div>
    </div>
  );
};
