const FORM_DATA_PREFIX = 'w9_formdata_';
const TRACKING_PREFIX = 'w9_tracking_';

export function getInvestorEmailFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('email');
}

export function getInvestorNameFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('name');
}

export function hasInvestorContext(): boolean {
  return !!getInvestorEmailFromUrl();
}

export function saveFormData(investorId: string, formData: any): void {
  try { localStorage.setItem(FORM_DATA_PREFIX + investorId, JSON.stringify(formData)); } catch (e) { console.warn('Failed to save form data:', e); }
}

export function loadFormData(investorId: string): any | null {
  try { const raw = localStorage.getItem(FORM_DATA_PREFIX + investorId); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function clearFormData(investorId: string): void {
  localStorage.removeItem(FORM_DATA_PREFIX + investorId);
}

export function saveCurrentStep(investorId: string, step: number): void {
  try { localStorage.setItem(TRACKING_PREFIX + investorId + '_step', String(step)); } catch { /* ignore */ }
}

export function loadCurrentStep(investorId: string): number | null {
  const raw = localStorage.getItem(TRACKING_PREFIX + investorId + '_step');
  return raw !== null ? parseInt(raw, 10) : null;
}

export function hasBeenOpened(investorId: string): boolean {
  return localStorage.getItem(TRACKING_PREFIX + investorId + '_opened') === '1';
}
export function markAsOpened(investorId: string): void {
  localStorage.setItem(TRACKING_PREFIX + investorId + '_opened', '1');
}

export function hasBeenStarted(investorId: string): boolean {
  return localStorage.getItem(TRACKING_PREFIX + investorId + '_started') === '1';
}
export function markAsStarted(investorId: string): void {
  localStorage.setItem(TRACKING_PREFIX + investorId + '_started', '1');
}

export function hasBeenCompleted(investorId: string): boolean {
  return localStorage.getItem(TRACKING_PREFIX + investorId + '_completed') === '1';
}
export function markAsCompleted(investorId: string): void {
  localStorage.setItem(TRACKING_PREFIX + investorId + '_completed', '1');
}
