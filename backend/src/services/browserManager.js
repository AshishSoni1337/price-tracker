    import playwright from "playwright-extra";
    import stealthPlugin from "puppeteer-extra-plugin-stealth";
    import UserAgent from "user-agents";
    import { MAX_CONCURRENT_TABS, HEADLESS } from "../config/appConfig.js";
    import { logger } from "../config/logger.js";

    const stealth = stealthPlugin();
    playwright.chromium.use(stealth);

    let browser = null;
    let activeTabCount = 0;
    const requestQueue = [];
    let jobsCompleted = 0;
    const MAX_JOBS_BEFORE_RESTART = 50;
    let isRestarting = false;

    async function restartBrowser() {
        if (isRestarting) return;
        isRestarting = true;
        logger.info("Restarting browser to prevent memory leaks...");

        try {
            await closeBrowser();
            await initBrowser();
            jobsCompleted = 0;
            logger.info("Browser restarted successfully.");
        } catch (error) {
            logger.error("Failed to restart browser:", error);
        } finally {
            isRestarting = false;
        }
    }

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
        if (activeTabCount >= MAX_CONCURRENT_TABS) {
            await new Promise((resolve) => requestQueue.push(resolve));
        }
        activeTabCount++;

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

        try {
            return await fn(page);
        } finally {
            await page.close();
            await context.close();

            activeTabCount--;
            jobsCompleted++;

            if (requestQueue.length > 0) {
                requestQueue.shift()();
            }

            if (jobsCompleted >= MAX_JOBS_BEFORE_RESTART && activeTabCount === 0) {
                await restartBrowser();
            }
        }
    }
