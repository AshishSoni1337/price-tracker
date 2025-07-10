import { logger } from "../config/logger.js";
import ErrorLog from "../models/errorLog.js";
import { withPage } from "../services/browserManager.js";
import { ScrapingError } from "../utils/errors.js";
import { getDiscoveryPageSelectors } from "./selectors.js";

async function getKnownErrorType(page) {
    const errorType = await page.evaluate(() => {
        const pageText = document.body.innerText;
        if (pageText.includes("Sorry, we couldn't find that page")) {
            return "Page Not Found";
        }
        if (pageText.includes("The request is invalid")) {
            return "Invalid Request";
        }
        if (
            pageText.includes("We're sorry") &&
            pageText.includes(
                "An error occurred when we tried to process your request"
            )
        ) {
            return "Processing Error";
        }
        if (pageText.includes("It's rush hour and traffic is piling up")) {
            return "Rush Hour Error";
        }
        return null;
    });
    return errorType;
}

async function logScrapingError(page, url, error, isDataMissing = false) {
    const knownErrorType = await getKnownErrorType(page);
    const errorMessage = isDataMissing
        ? `Failed to scrape essential data. Name and/or Price are missing.`
        : error.message;

    const errorLog = {
        errorMessage,
        stackTrace: error.stack,
        url,
        errorType: "unknown",
    };

    if (knownErrorType) {
        logger.warn(
            `Known error page detected at ${url}: ${knownErrorType}. Skipping screenshot.`
        );
        errorLog.errorType = knownErrorType;
    } else {
        logger.error(
            `Unhandled error during scrape on ${url}. Taking screenshot.`,
            { message: error.message, stack: error.stack }
        );
        errorLog.screenshot = await page.screenshot({ fullPage: true });
    }

    await ErrorLog.create(errorLog);
}

async function solveCaptchaIfNeeded(page) {
    const isCaptchaVisible = await page.evaluate(() => {
        const recaptcha = document.querySelector(".g-recaptcha");
        return recaptcha ? true : false;
    });

    if (isCaptchaVisible) {
        logger.warn(
            "CAPTCHA detected. This is a placeholder for solving logic.");
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

async function simulateHumanBehavior(page) {
    logger.info("Simulating human behavior...");
    await page.mouse.move(Math.random() * 800 + 100, Math.random() * 600 + 100);
    await page.waitForTimeout(Math.random() * 500 + 300);
    const viewportHeight = page.viewportSize()?.height || 768;
    for (let i = 0; i < viewportHeight; i += 100) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(Math.random() * 400 + 200);
    }
    await page.mouse.move(Math.random() * 800 + 100, Math.random() * 600 + 100);
    logger.info("Human behavior simulation complete.");
}

async function handleInterstitialPage(page, selectors) {
    if (!selectors || selectors.length === 0) {
        return; // No interstitial selectors to check for this site.
    }

    logger.info("Checking for interstitial page...");
    for (const selector of selectors) {
        try {
            const button = await page.waitForSelector(selector, {
                state: "visible",
                timeout: 3000,
            });
            if (button) {
                logger.info(
                    `Interstitial button found with selector: "${selector}". Clicking...`
                );

                // Add a human-like delay
                const delay = Math.random() * 2000 + 1000; // 1-3 seconds
                await page.waitForTimeout(delay);

                await Promise.all([
                    page.waitForNavigation({
                        waitUntil: "domcontentloaded",
                        timeout: 60000,
                    }),
                    button.click(),
                ]);
                logger.info("Successfully navigated past interstitial page.");
                return; // Stop after handling one interstitial.
            }
        } catch (error) {
            // This is expected if the button is not found within the timeout.
            // We can ignore timeout errors and continue.
            if (!error.message.includes("timeout")) {
                logger.warn(
                    `An error occurred while checking for interstitial selector "${selector}":`,
                    error.message
                );
            }
        }
    }
    logger.info("No interstitial page found.");
}

export async function scrapeProductPage(url, selectors) {
    return withPage(async (page) => {
        try {
            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 60000,
            });

            // Handle potential "are you a bot" pages before scraping.
            await handleInterstitialPage(
                page,
                selectors.interstitialButtonSelectors
            );

            await solveCaptchaIfNeeded(page);
            await simulateHumanBehavior(page);

            const details = await page.evaluate((sel) => {
                const querySelectorWithFallbacks = (baseElement, selectors) => {
                    if (!Array.isArray(selectors)) selectors = [selectors];
                    for (const selector of selectors) {
                        const element = baseElement.querySelector(selector);
                        if (element) return element;
                    }
                    return null;
                };
                const querySelectorAllWithFallbacks = (baseElement, selectors) => {
                    if (!Array.isArray(selectors)) selectors = [selectors];
                    for (const selector of selectors) {
                        const elements = Array.from(baseElement.querySelectorAll(selector));
                        if (elements.length > 0) return elements;
                    }
                    return [];
                };
                function findAmazonAsin() {
                    // Strategy 1: Find in the product details table
                    const thElements = Array.from(
                        document.querySelectorAll("th")
                    );
                    for (const th of thElements) {
                        if (
                            th.innerText &&
                            th.innerText.trim().includes("ASIN")
                        ) {
                            const td = th.nextElementSibling;
                            if (td && td.innerText) return td.innerText.trim();
                        }
                    }

                    // Strategy 2: Find in the detail bullets list
                    const liElements = Array.from(
                        document.querySelectorAll(
                            "#detailBullets_feature_div li"
                        )
                    );
                    for (const li of liElements) {
                        if (
                            li.innerText &&
                            li.innerText.toUpperCase().includes("ASIN")
                        ) {
                            const parts = li.innerText.split(":");
                            if (parts.length > 1) return parts[1].trim();
                        }
                    }
                    return null;
                }

                const name = querySelectorWithFallbacks(document, sel.nameSelector)
                    ?.innerText.trim();
                const priceString = querySelectorWithFallbacks(document, sel.priceSelector)
                    ?.innerText.trim();
                const price = priceString
                    ? parseFloat(priceString.replace(/[^0-9.-]+/g, ""))
                    : null;
                const description = querySelectorWithFallbacks(document, sel.descriptionSelector)
                    ?.innerText.trim();
                const images = querySelectorAllWithFallbacks(document, sel.imageSelector)
                    .map((img) => img.src);
                const availabilityText = querySelectorWithFallbacks(document, sel.availabilitySelector)
                    ?.innerText.trim().toLowerCase();
                
                let availability = "In Stock";
                if (availabilityText && (availabilityText.includes('out of stock') || availabilityText.includes('unavailable'))) {
                    availability = "Out of Stock";
                }

                let uniqueId = null;
                if (sel.platform === "amazon") {
                    uniqueId = findAmazonAsin();
                } else {
                    // For other platforms, try the standard selector if it exists
                    uniqueId = querySelectorWithFallbacks(document, sel.uniqueIdSelector)
                        ?.innerText.trim();
                }

                return { name, price, description, images, uniqueId, availability };
            }, selectors);

            // After scraping, validate essential data
            if (!details.name || (!details.price && details.availability === 'In Stock')) {
                const scrapingError = new ScrapingError(
                    `Failed to scrape essential data. Name: ${details.name}, Price: ${details.price}, Availability: ${details.availability}`);
                await logScrapingError(page, url, scrapingError, true);
                throw scrapingError;
            }

            // Variation scraping placeholder
            const variations = [];
            if (
                selectors.variationContainerSelector &&
                selectors.variationOptionSelector
            ) {
                logger.info(
                    "Variation selectors found, but this logic is a placeholder.");
            }

            return { ...details, variations };
        } catch (error) {
            await logScrapingError(page, url, error);
            throw error;
        }
    });
}

/**
 * Scrapes a discovery (search result) page to extract a list of products.
 * @param {import('playwright').Page} page - The Playwright page object.
 * @param {string} url - The URL of the discovery page.
 * @returns {Promise<object[]>} An array of objects, each representing a discovered product.
 */
export async function scrapeDiscoveryPage(page, url) {
    // Forward browser console logs to the Node.js console
    page.on("console", (msg) => logger.info(`[BROWSER CONSOLE] ${msg.text()}`));

    try {
        logger.info(`Navigating to discovery URL: ${url}`);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        const selectors = getDiscoveryPageSelectors(url);
        if (!selectors) {
            throw new Error(
                `Could not find discovery page selectors for URL: ${url}`);
        }

        // Wait for the list of products to be present on the page.
        await page.waitForSelector(selectors.productListSelector, {
            timeout: 15000,
        });

        const discoveredProducts = await page.evaluate((s) => {
            const querySelectorWithFallbacks = (baseElement, selectors) => {
                if (!Array.isArray(selectors)) selectors = [selectors];
                for (const selector of selectors) {
                    const element = baseElement.querySelector(selector);
                    if (element) return element;
                }
                return null;
            };
            const getUniqueId = (node, url, platform) => {
                if (platform === "amazon") {
                    // For Amazon, the ASIN is in the `data-asin` attribute.
                    return node.dataset.asin || null;
                }
                if (platform === "flipkart" && url) {
                    // For Flipkart, the Product ID (pid) is in the URL query parameters.
                    try {
                        const urlObject = new URL(url);
                        return urlObject.searchParams.get("pid");
                    } catch {
                        return null; // Ignore URL parsing errors.
                    }
                }
                return null;
            };


            const productNodes = document.querySelectorAll(
                s.productListSelector
            );
            const products = [];

            productNodes.forEach((node) => {
                const name =
                    querySelectorWithFallbacks(node, s.nameSelector)
                        ?.innerText.trim() || null;
                const priceString =
                    querySelectorWithFallbacks(node, s.priceSelector)
                        ?.innerText.trim() || null;
                const url =
                    querySelectorWithFallbacks(node, s.linkSelector)?.href ||
                    null;
                const image =
                    querySelectorWithFallbacks(node, s.imageSelector)?.src ||
                    null;
                const uniqueId = getUniqueId(node, url, s.platform);

                if (name && priceString && url) {
                    const priceMatch = priceString
                        .replace(/[^0-9.]/g, "")
                        .match(/[\d,]+\.?\d*/);
                    const price = priceMatch
                        ? parseFloat(priceMatch[0].replace(/,/g, ""))
                        : null;

                    products.push({ name, price, url, image, uniqueId });
                }
            });
            return products;
        }, selectors);

        logger.info(
            `Discovered ${discoveredProducts.length} products from URL: ${url}`);

        if (discoveredProducts.length === 0) {
            logger.warn(
                `No products found on ${url}. The selector might be outdated.`);
        }

        return discoveredProducts;
    } catch (error) {
        const errorMessage = `Error scraping discovery page ${url}: ${error.message}`;
        logger.error(errorMessage);
        throw new ScrapingError(errorMessage, { cause: error });
    }
}
