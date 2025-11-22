// Script to create an Ethereal test account and print env lines
// Run: node create-ethereal-account.js

const nodemailer = require('nodemailer');

async function main() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal account created. Use these values in your .env (dev only):\n');
    console.log(`SMTP_HOST=${testAccount.smtp.host}`);
    console.log(`SMTP_PORT=${testAccount.smtp.port}`);
    console.log(`SMTP_SECURE=${testAccount.smtp.secure}`);
    console.log(`SMTP_USER=${testAccount.user}`);
    console.log(`SMTP_PASS=${testAccount.pass}`);
    console.log('\nExample SMTP_FROM: no-reply@yourdomain.com');
    console.log('\nNote: Ethereal is for development/testing only. Messages do not go to real inboxes but you can preview them using the preview URL returned by nodemailer.');
  } catch (err) {
    console.error('Error creating Ethereal account', err);
    process.exit(1);
  }
}

main();
