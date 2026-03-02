const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

export type WebhookEvent = 'form.opened' | 'form.started' | 'form.progress' | 'form.completed';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  investor: { email: string; name: string; };
  formLink: string;
  progress?: { currentStep: number; totalSteps: number; stepName: string; percentComplete: number; };
  formData?: Record<string, any>;
  pdf?: { base64: string; filename: string; };
}

function buildFormLink(email: string, name: string): string {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({ email, name });
  return `${base}?${params.toString()}`;
}

async function fireWebhook(payload: WebhookPayload): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('[Webhook] No n8n webhook URL configured.');
    return false;
  }
  try {
    const response = await fetch(N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) { console.error(`[Webhook] n8n responded with ${response.status}`); return false; }
    return true;
  } catch (err) { console.error('[Webhook] Failed:', err); return false; }
}

export function notifyFormOpened(investorEmail: string, investorName: string): void {
  fireWebhook({ event: 'form.opened', timestamp: new Date().toISOString(), investor: { email: investorEmail, name: investorName }, formLink: buildFormLink(investorEmail, investorName) });
}

export function notifyFormStarted(investorEmail: string, investorName: string): void {
  fireWebhook({ event: 'form.started', timestamp: new Date().toISOString(), investor: { email: investorEmail, name: investorName }, formLink: buildFormLink(investorEmail, investorName) });
}

export function notifyFormProgress(investorEmail: string, investorName: string, currentStep: number, totalSteps: number, stepName: string): void {
  fireWebhook({ event: 'form.progress', timestamp: new Date().toISOString(), investor: { email: investorEmail, name: investorName }, formLink: buildFormLink(investorEmail, investorName), progress: { currentStep, totalSteps, stepName, percentComplete: Math.round((currentStep / totalSteps) * 100) } });
}

export async function notifyFormCompleted(investorEmail: string, investorName: string, formData: Record<string, any>, pdfBytes: Uint8Array): Promise<boolean> {
  const base64 = uint8ArrayToBase64(pdfBytes);
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = investorName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `W9_${safeName}_${timestamp}.pdf`;
  const safeFormData = { ...formData };
  delete safeFormData.ssn; delete safeFormData.ein; delete safeFormData.iraEin; delete safeFormData.signature;
  return fireWebhook({ event: 'form.completed', timestamp: new Date().toISOString(), investor: { email: investorEmail, name: investorName }, formLink: buildFormLink(investorEmail, investorName), formData: safeFormData, pdf: { base64, filename } });
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''; const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
