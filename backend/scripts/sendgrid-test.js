// Simple SendGrid test script for local use
// Usage (PowerShell):
// $env:SENDGRID_API_KEY = "SG.xxxxx..."
// $env:SENDGRID_FROM = "atiliomarola.ag@gmail.com"
// node .\scripts\sendgrid-test.js

const sgMail = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM) {
  console.error('Falta SENDGRID_API_KEY o SENDGRID_FROM en el entorno');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendTest() {
  try {
    const appBase = process.env.APP_BASE_URL || 'http://localhost:5173';
    const unsubscribeEmail = process.env.LIST_UNSUBSCRIBE_EMAIL || `postmaster@${(process.env.SENDGRID_FROM || 'local.local').split('@')[1] || 'local.local'}`;
    const unsubscribeUrl = process.env.LIST_UNSUBSCRIBE_URL || `${appBase.replace(/\/$/, '')}/unsubscribe`;
    const listUnsubscribe = `<mailto:${unsubscribeEmail}>, <${unsubscribeUrl}>`;

    const msg = {
      to: process.env.SENDGRID_TEST_TO || process.env.SENDGRID_FROM,
      from: process.env.SENDGRID_FROM,
      subject: 'PPS - Prueba SendGrid',
      text: 'Hola — este es un correo de prueba desde PPS usando SendGrid.',
      html: '<p>Hola — este es un <strong>correo de prueba</strong> desde PPS usando SendGrid.</p>',
      headers: { 'List-Unsubscribe': listUnsubscribe }
    };

    const res = await sgMail.send(msg);
    console.log('Envío OK. Código status:', res && res[0] ? res[0].statusCode : 'unknown');
  } catch (err) {
    console.error('Error al enviar:', err.response ? err.response.body : err.message);
    process.exitCode = 1;
  }
}

sendTest();
