import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

const BASE_FORM_URL = process.env.FORM_BASE_URL || 'https://matheus1211hanemann.github.io/w9-form-widget/';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

app.use(cors({
  origin: [
    'https://matheus1211hanemann.github.io',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get('/debug/config', (req, res) => {
  res.json({
    RESEND_API_KEY: RESEND_API_KEY ? `✓ set (${RESEND_API_KEY.substring(0, 6)}...)` : '✗ missing',
    PORT,
  });
});

// POST /api/generate-link
app.post('/api/generate-link', (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Both "email" and "name" are required.',
    });
  }

  const params = new URLSearchParams({ email, name });
  const formLink = `${BASE_FORM_URL}?${params.toString()}`;

  return res.json({
    formLink,
    investor: { email, name },
  });
});

// POST /api/send-w9-email
app.post('/api/send-w9-email', async (req, res) => {
  const { submitterName, formData, pdf } = req.body;

  if (!pdf?.base64 || !pdf?.filename) {
    return res.status(400).json({
      error: 'Missing PDF data',
      message: '"pdf.base64" and "pdf.filename" are required.',
    });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({
      error: 'Email not configured',
      message: 'RESEND_API_KEY is not set on the server.',
    });
  }

  const recipientEmails = (process.env.W9_RECIPIENT_EMAIL || 'matheus@cs3investments.com').split(',').map(e => e.trim());
  const fromAddress = process.env.EMAIL_FROM || 'W9 Forms <onboarding@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipientEmails,
        subject: `W9 Form Submitted – ${submitterName || 'Anonymous'}`,
        html: `
          <h2>New W9 Form Submission</h2>
          <p><strong>Submitted by:</strong> ${submitterName || 'Anonymous'}</p>
          ${formData ? `
          <h3>Form Details</h3>
          <ul>
            ${formData.accountType ? `<li><strong>Account Type:</strong> ${formData.accountType}</li>` : ''}
            ${formData.name ? `<li><strong>Name:</strong> ${formData.name}</li>` : ''}
            ${formData.businessName ? `<li><strong>Business:</strong> ${formData.businessName}</li>` : ''}
            ${formData.address ? `<li><strong>Address:</strong> ${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}</li>` : ''}
            ${formData.tinType ? `<li><strong>TIN Type:</strong> ${formData.tinType === 'ssn' ? 'SSN' : 'EIN'}</li>` : ''}
          </ul>` : ''}
          <p>The completed W9 PDF is attached.</p>
        `,
        attachments: [
          {
            filename: pdf.filename,
            content: pdf.base64,
          },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Email] Resend error:', result);
      return res.status(response.status).json({ error: 'Failed to send email', message: result.message || JSON.stringify(result) });
    }

    console.log(`[Email] W9 sent to ${recipientEmails.join(', ')} for ${submitterName} (id: ${result.id})`);
    return res.json({ success: true, message: `Email sent to ${recipientEmails.join(', ')}`, id: result.id });
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return res.status(500).json({ error: 'Failed to send email', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`W9 API server running on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/generate-link`);
  console.log(`POST http://localhost:${PORT}/api/send-w9-email`);
});
