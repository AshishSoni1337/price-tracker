import playwright from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { USER_AGENTS, MAX_CONCURRENT_TABS } from '../config/appConfig.js';

const stealth = stealthPlugin();
playwright.chromium.use(stealth);

let browser = null;
let activeTabCount = 0;
const requestQueue = [];

async function initBrowser() {
    if (browser) return;
    const { PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD, NODE_ENV } = process.env;

    const launchOptions = {
        headless: NODE_ENV === 'production',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    if (PROXY_HOST && PROXY_PORT) {
        launchOptions.proxy = {
            server: `http://${PROXY_HOST}:${PROXY_PORT}`,
            username: PROXY_USERNAME,
            password: PROXY_PASSWORD,
        };
    }

    browser = await playwright.chromium.launch(launchOptions);
    browser.on('disconnected', () => {
        console.log('Browser disconnected.');
        browser = null;
    });
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

async function withPage(fn) {
    if (activeTabCount >= MAX_CONCURRENT_TABS) {
        await new Promise(resolve => requestQueue.push(resolve));
    }
    activeTabCount++;

    if (!browser) {
        await initBrowser();
    }

    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();

    try {
        return await fn(page);
    } finally {
        await page.close();
        await context.close();
        activeTabCount--;
        if (requestQueue.length > 0) {
            requestQueue.shift()();
        }
    }
}

export const browserManager = {
    initBrowser,
    closeBrowser,
    withPage,
}; 