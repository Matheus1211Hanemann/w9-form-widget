const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''; const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function sendW9Email(submitterName: string, formData: Record<string, any>, pdfBytes: Uint8Array): Promise<boolean> {
  if (!API_URL) { console.warn('[Email] No API URL configured.'); return false; }
  const base64 = uint8ArrayToBase64(pdfBytes);
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = submitterName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `W9_${safeName}_${timestamp}.pdf`;
  const safeFormData = { ...formData };
  delete safeFormData.ssn; delete safeFormData.ein; delete safeFormData.iraEin; delete safeFormData.signature;

  try {
    const response = await fetch(`${API_URL}/api/send-w9-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submitterName, formData: safeFormData, pdf: { base64, filename } }),
    });
    if (!response.ok) { console.error('[Email] Server error:', await response.json().catch(() => ({}))); return false; }
    return true;
  } catch (err) { console.error('[Email] Failed:', err); return false; }
}
