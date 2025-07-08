/**
 * This script provides utility functions to be injected into the browser context.
 * These functions are not available in the Node.js environment directly.
 */

/**
 * Finds the first element that matches any of the given selectors.
 * @param {Element} baseElement - The base element to search within.
 * @param {string|string[]} selectors - A selector or an array of selectors to try.
 * @returns {Element|null} The found element or null.
 */
window.querySelectorWithFallbacks = (baseElement, selectors) => {
    if (!Array.isArray(selectors)) selectors = [selectors];
    for (const selector of selectors) {
        const element = baseElement.querySelector(selector);
        if (element) return element;
    }
    return null;
};

/**
 * Finds all elements that match any of the given selectors.
 * @param {Element} baseElement - The base element to search within.
 * @param {string|string[]} selectors - A selector or an array of selectors to try.
 * @returns {Element[]} An array of found elements.
 */
window.querySelectorAllWithFallbacks = (baseElement, selectors) => {
    if (!Array.isArray(selectors)) selectors = [selectors];
    for (const selector of selectors) {
        const elements = Array.from(baseElement.querySelectorAll(selector));
        if (elements.length > 0) return elements;
    }
    return [];
};

/**
 * Extracts a platform-specific unique identifier for a product.
 * @param {HTMLElement} node - The product's DOM element.
 * @param {string} url - The product's URL.
 * @param {string} platform - The e-commerce platform ('amazon', 'flipkart', etc.).
 * @returns {string|null} The unique ID or null if not found.
 */
window.getUniqueId = (node, url, platform) => {
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
