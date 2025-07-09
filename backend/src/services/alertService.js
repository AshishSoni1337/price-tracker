import { logger } from '../config/logger.js';
import * as emailService from './channels/emailService.js';
import * as telegramService from './channels/telegramService.js';

const alertChannels = [];

if (emailService.isEnabled()) {
    alertChannels.push({ name: 'Email', service: emailService });
    logger.info('Email alert channel has been registered.');
}

if (telegramService.isEnabled()) {
    alertChannels.push({ name: 'Telegram', service: telegramService });
    logger.info('Telegram alert channel has been registered.');
}

export const dispatchPriceDropAlert = async (product, oldPrice, newPrice) => {
    if (alertChannels.length === 0) {
        logger.warn('No alert channels are configured or enabled. Cannot send price drop alert.');
        return;
    }
    
    logger.info(`Dispatching price drop alert for "${product.name}"...`);

    const alertPayload = { product, oldPrice, newPrice };

    for (const channel of alertChannels) {
        try {
            await channel.service.sendMessage(alertPayload);
        } catch (error) {
            logger.error(`Failed to send alert via ${channel.name} for product ${product._id}:`, error);
        }
    }
}; 