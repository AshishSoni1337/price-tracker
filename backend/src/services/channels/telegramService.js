import TelegramBot from 'node-telegram-bot-api';
import { logger } from '../../config/logger.js';
import { alertConfig } from '../../config/alertConfig.js';

const { telegram: telegramConfig } = alertConfig.channels;
let bot;

if (telegramConfig.enabled) {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
        logger.warn('Telegram channel is enabled, but botToken or chatId is missing. Telegram alerts will not be sent.');
        bot = null;
    } else {
        bot = new TelegramBot(telegramConfig.botToken);
        logger.info('Telegram bot initialized. Channel is ready.');
    }
} else {
    logger.info('Telegram channel is disabled.');
    bot = null;
}

const createTelegramContent = (product, oldPrice, newPrice) => {
    const messageParts = [
        `<b>Price Drop Alert!</b>`,
        ``, // blank line
        `<b>${product.name}</b>`,
        `Old Price: <s>${oldPrice.toFixed(2)}</s>`,
        `New Price: <b>${newPrice.toFixed(2)}</b>`,
        ``, // blank line
        `<a href="${product.url}">View Product</a>`
    ];
    return messageParts.join('\n');
};

export const sendMessage = async ({ product, oldPrice, newPrice }) => {
    if (!bot) {
        logger.warn('Attempted to send Telegram message, but the bot is not configured or disabled.');
        return;
    }

    const chatId = telegramConfig.chatId;
    const message = createTelegramContent(product, oldPrice, newPrice);

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        logger.info(`Telegram message sent successfully to chat ID: ${chatId}.`);
    } catch (error) {
        logger.error(`Failed to send Telegram message to chat ID ${chatId}:`, error);
        throw new Error('Failed to send Telegram alert.');
    }
};

export const isEnabled = () => telegramConfig.enabled && !!bot; 