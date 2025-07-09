import nodemailer from 'nodemailer';
import { logger } from '../../config/logger.js';
import { alertConfig } from '../../config/alertConfig.js';

const { email: emailConfig } = alertConfig.channels;

let transporter;

if (emailConfig.enabled) {
    if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
        logger.warn('Email channel is enabled, but SMTP configuration is incomplete. Emails will not be sent.');
        transporter = null;
    } else {
        transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.pass,
            },
        });

        transporter.verify()
            .then(() => logger.info('Email transporter is configured and ready to send emails.'))
            .catch(err => logger.error('Email transporter configuration is invalid.', err));
    }
} else {
    logger.info('Email channel is disabled.');
    transporter = null;
}

const createEmailContent = (product, oldPrice, newPrice) => {
    const subject = `Price Drop Alert for ${product.name}`;
    const html = `
        <h1>Price Drop Alert!</h1>
        <p>The price for <strong>${product.name}</strong> has dropped.</p>
        <p>Old Price: <s>${oldPrice.toFixed(2)}</s></p>
        <p><strong>New Price: ${newPrice.toFixed(2)}</strong></p>
        <p>You can view the product here: <a href="${product.url}">${product.url}</a></p>
        <hr>
        <p><em>Thank you for using Price Tracker!</em></p>
    `;
    return { subject, html };
};

export const sendMessage = async ({ product, oldPrice, newPrice }) => {
    if (!transporter) {
        logger.warn('Attempted to send email, but the transporter is not configured or disabled.');
        return;
    }

    const { subject, html } = createEmailContent(product, oldPrice, newPrice);
    const to = alertConfig.recipientEmail;

    const mailOptions = {
        from: emailConfig.from,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    } catch (error) {
        logger.error(`Failed to send email to ${to}. Subject: "${subject}"`, error);
        throw new Error('Failed to send email alert.');
    }
};

export const isEnabled = () => emailConfig.enabled && !!transporter; 