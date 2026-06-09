const nodemailer = require('nodemailer');

// The transport is created lazily and cached, so a missing/incomplete SMTP
// config doesn't crash the server at startup — it only surfaces when an email
// is actually sent.
let transporter;

const getTransporter = () => {
    if (!transporter) {
        const port = parseInt(process.env.SMTP_PORT, 10) || 587;
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465, // implicit TLS on 465; STARTTLS otherwise
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

const sendOnboardingEmail = async (to, name, tempPassword) => {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const loginUrl = process.env.CLIENT_URL || '';

    const subject = 'Your Task Management System account';

    const text =
        `Hi ${name},\n\n` +
        `An account has been created for you on the Task Management System.\n\n` +
        `Email: ${to}\n` +
        `Temporary password: ${tempPassword}\n\n` +
        `For security, you must set a new password the first time you log in.\n` +
        (loginUrl ? `\nLog in here: ${loginUrl}\n` : '') +
        `\nIf you did not expect this email, please contact your administrator.`;

    const html =
        `<p>Hi ${name},</p>` +
        `<p>An account has been created for you on the <strong>Task Management System</strong>.</p>` +
        `<ul>` +
        `<li><strong>Email:</strong> ${to}</li>` +
        `<li><strong>Temporary password:</strong> <code>${tempPassword}</code></li>` +
        `</ul>` +
        `<p>For security, you must set a new password the first time you log in.</p>` +
        (loginUrl ? `<p><a href="${loginUrl}">Log in here</a></p>` : '') +
        `<p>If you did not expect this email, please contact your administrator.</p>`;

    await getTransporter().sendMail({ from, to, subject, text, html });
};

module.exports = { sendOnboardingEmail };
