    import playwright from "playwright-extra";
    import stealthPlugin from "puppeteer-extra-plugin-stealth";
    import UserAgent from "user-agents";
    import { HEADLESS } from "../config/appConfig.js";
    import { logger } from "../config/logger.js";

    const stealth = stealthPlugin();
    playwright.chromium.use(stealth);

    let browser = null;

    // The complex browser restart logic has been removed for simplification.
    // Concurrency is now managed directly by the BullMQ worker settings.
    // For memory management, a simpler strategy is to periodically restart the entire worker process.

    export async function initBrowser() {
        if (browser) return;
        const { PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD } =
            process.env;

        const launchOptions = {
            headless: HEADLESS,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        };

        if (PROXY_HOST && PROXY_PORT) {
            launchOptions.proxy = {
                server: `http://${PROXY_HOST}:${PROXY_PORT}`,
                username: PROXY_USERNAME,
                password: PROXY_PASSWORD,
            };
        }

        browser = await playwright.chromium.launch(launchOptions);
        browser.on("disconnected", () => {
            logger.info("Browser disconnected.");
            browser = null;
        });
    }

    export async function closeBrowser() {
        if (browser) {
            await browser.close();
            browser = null;
        }
    }

    export async function withPage(fn) {
        if (!browser || !browser.isConnected()) {
            logger.info(
                "Browser not available or disconnected. Initializing a new one."
            );
            await initBrowser();
        }

        const userAgent = new UserAgent((data) => {
            const ua = data.userAgent.toLowerCase();
            return ua.includes("chrome/") && !ua.includes("edg/");
        });
        const context = await browser.newContext({
            userAgent: userAgent.toString(),
        });
        const page = await context.newPage();

        // Block images and other heavy resources to save memory
        await page.route("**/*", (route) => {
            const resourceType = route.request().resourceType();
            if (["image", "media", "font", "stylesheet"].includes(resourceType)) {
                route.abort();
            } else {
                route.continue();
            }
        });

        try {
            return await fn(page);
        } finally {
            await page.close();
            await context.close();
        }
    }
