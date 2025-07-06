import { logger } from '../config/logger.js';
import ErrorLog from '../models/errorLog.js';
import { withPage } from '../services/browserManager.js';

async function solveCaptchaIfNeeded(page) {
    const isCaptchaVisible = await page.evaluate(() => {
        const recaptcha = document.querySelector('.g-recaptcha');
        return recaptcha ? true : false;
    });

    if (isCaptchaVisible) {
        logger.warn('CAPTCHA detected. This is a placeholder for solving logic.');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

async function simulateHumanBehavior(page) {
    logger.info('Simulating human behavior...');
    await page.mouse.move(Math.random() * 800 + 100, Math.random() * 600 + 100);
    await page.waitForTimeout(Math.random() * 500 + 300);
    const viewportHeight = page.viewportSize()?.height || 768;
    for (let i = 0; i < viewportHeight; i += 100) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(Math.random() * 400 + 200);
    }
    await page.mouse.move(Math.random() * 800 + 100, Math.random() * 600 + 100);
    logger.info('Human behavior simulation complete.');
}

async function handleInterstitialPage(page, selectors) {
    if (!selectors || selectors.length === 0) {
        return; // No interstitial selectors to check for this site.
    }

    logger.info('Checking for interstitial page...');
    for (const selector of selectors) {
        try {
            const button = await page.waitForSelector(selector, { state: 'visible', timeout: 3000 });
            if (button) {
                logger.info(`Interstitial button found with selector: "${selector}". Clicking...`);
                
                // Add a human-like delay
                const delay = Math.random() * 2000 + 1000; // 1-3 seconds
                await page.waitForTimeout(delay);

                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
                    button.click(),
                ]);
                logger.info('Successfully navigated past interstitial page.');
                return; // Stop after handling one interstitial.
            }
        } catch (error) {
            // This is expected if the button is not found within the timeout.
            // We can ignore timeout errors and continue.
            if (!error.message.includes('timeout')) {
                logger.warn(`An error occurred while checking for interstitial selector "${selector}":`, error.message);
            }
        }
    }
    logger.info('No interstitial page found.');
}

async function scrapeProductPage(url, selectors) {
    return withPage(async (page) => {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Handle potential "are you a bot" pages before scraping.
            await handleInterstitialPage(page, selectors.interstitialButtonSelectors);

            await solveCaptchaIfNeeded(page);
            await simulateHumanBehavior(page);

            const details = await page.evaluate((sel) => {
                function querySelectorWithFallbacks(baseElement, selectors) {
                    if (!Array.isArray(selectors)) selectors = [selectors];
                    for (const selector of selectors) {
                        const element = baseElement.querySelector(selector);
                        if (element) return element;
                    }
                    return null;
                }

                function querySelectorAllWithFallbacks(baseElement, selectors) {
                    if (!Array.isArray(selectors)) selectors = [selectors];
                    for (const selector of selectors) {
                        const elements = Array.from(baseElement.querySelectorAll(selector));
                        if (elements.length > 0) return elements;
                    }
                    return [];
                }

                function findAmazonAsin() {
                    // Strategy 1: Find in the product details table
                    const thElements = Array.from(document.querySelectorAll('th'));
                    for (const th of thElements) {
                        if (th.innerText && th.innerText.trim().includes('ASIN')) {
                            const td = th.nextElementSibling;
                            if (td && td.innerText) return td.innerText.trim();
                        }
                    }

                    // Strategy 2: Find in the detail bullets list
                    const liElements = Array.from(document.querySelectorAll('#detailBullets_feature_div li'));
                    for (const li of liElements) {
                        if (li.innerText && li.innerText.toUpperCase().includes('ASIN')) {
                            const parts = li.innerText.split(':');
                            if (parts.length > 1) return parts[1].trim();
                        }
                    }
                    return null;
                }

                const name = querySelectorWithFallbacks(document, sel.nameSelector)?.innerText.trim();
                const priceString = querySelectorWithFallbacks(document, sel.priceSelector)?.innerText.trim();
                const price = priceString ? parseFloat(priceString.replace(/[^0-9.-]+/g, "")) : null;
                const description = querySelectorWithFallbacks(document, sel.descriptionSelector)?.innerText.trim();
                const images = querySelectorAllWithFallbacks(document, sel.imageSelector).map(img => img.src);
                
                let uniqueId = null;
                if (sel.platform === 'amazon') {
                    uniqueId = findAmazonAsin();
                } else {
                    // For other platforms, try the standard selector if it exists
                    uniqueId = querySelectorWithFallbacks(document, sel.uniqueIdSelector)?.innerText.trim();
                }

                return { name, price, description, images, uniqueId };
            }, selectors);

            // Variation scraping placeholder
            const variations = [];
            if (selectors.variationContainerSelector && selectors.variationOptionSelector) {
                logger.info('Variation selectors found, but this logic is a placeholder.');
            }

            return { ...details, variations };

        } catch (error) {
            logger.error(`Error during product page scrape on ${url}:`, { message: error.message, stack: error.stack });
            const screenshot = await page.screenshot({ fullPage: true });
            await ErrorLog.create({
                errorMessage: error.message,
                stackTrace: error.stack,
                url,
                screenshot
            });
            throw error;
        }
    });
}

export {
    scrapeProductPage,
};
