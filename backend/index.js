// Load environment variables from .env (if present)
try {
	// prefer explicit local .env in backend/
	require('dotenv').config({ path: require('path').join(__dirname, '.env') });
} catch (e) {
	// ignore if dotenv isn't available (will use process.env)
}

// Map common DB env names (DB_*) to MYSQL_* used by the codebase if set
try {
	const map = { DB_HOST: 'MYSQL_HOST', DB_USER: 'MYSQL_USER', DB_PASS: 'MYSQL_PASSWORD', DB_NAME: 'MYSQL_DB', DB_PORT: 'MYSQL_PORT' };
	Object.keys(map).forEach((k) => {
		if (process.env[k] && !process.env[map[k]]) process.env[map[k]] = process.env[k];
	});
} catch (e) {}

// Log transport selection and validate mail config for easier onboarding
try {
	const usingSendGrid = Boolean(process.env.SENDGRID_API_KEY);
	const usingSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
	const transport = usingSendGrid ? 'sendgrid' : (usingSmtp ? 'smtp' : 'none');
	console.info(`[INFO][startup] Mail transport: ${transport}`);
	if (usingSendGrid && !process.env.SENDGRID_FROM) {
		console.warn('[WARN][startup] SENDGRID_API_KEY is set but SENDGRID_FROM is not. Set SENDGRID_FROM to a verified sender email.');
	}
	if (!usingSendGrid && !usingSmtp) {
		console.warn('[WARN][startup] No mail transport configured. Password reset emails will not be sent to real inboxes. Configure SENDGRID_API_KEY or SMTP_* variables in backend/.env');
	}
} catch (e) {}

const { App } = require('./app');
new App().listen();
