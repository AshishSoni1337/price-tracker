const amazonSelectors = {
    product: {
        nameSelector: ["#productTitle"],
        priceSelector: [
            "#centerCol .a-price-whole"
        ],
        descriptionSelector: ["#feature-bullets"],
        imageSelector: ["#landingImage"],
        // This is now handled by custom logic in the scraper
        uniqueIdSelector: [],
        variationContainerSelector: "#twister-wrapper",
        variationOptionSelector: ".twister-button-inner",
        // Generic selectors for "continue" or "verify" buttons on interstitial pages
        interstitialButtonSelectors: [
            'button:has-text("Continue shopping")',
            'input[value="Continue shopping"]',
        ],
    },
    discovery: {
        // Using `div[data-asin]` is more reliable as it directly targets product containers
        // that have an ASIN (Amazon Standard Identification Number), which we use as a uniqueId.
        productListSelector: "div[data-asin]",
        nameSelector: [
            "a.a-link-normal h2 span",
        ],
        priceSelector: [
            ".a-price-whole",
        ],
        linkSelector: "a.a-link-normal",
        imageSelector: ["img.s-image"],
        nextButtonSelector: "a.s-pagination-item.s-pagination-next",
    },
};

const flipkartSelectors = {
    product: {
        nameSelector: ["span.B_NuCI"],
        priceSelector: ["div._30jeq3._16Jk6d"],
        descriptionSelector: ["div._1mXcCf.RmoJUa"],
        imageSelector: ["img._396cs4._2amPTt._3qGmMb"],
        uniqueIdSelector: [], // Flipkart's Unique ID (FSN) is often in the URL, not easily found on page.
        variationContainerSelector: null,
        variationOptionSelector: null,
        interstitialButtonSelectors: [], // No known interstitial pages for Flipkart yet
    },
    discovery: {
        productListSelector: "div._1AtVbE",
        nameSelector: ["div._4rR01T"],
        priceSelector: ["div._30jeq3._1_WHN1"],
        linkSelector: "a._1fQZEK",
        imageSelector: ["img._396cs4"],
        nextButtonSelector: "a._1LKTO3",
    },
};

function getSelectors(url, type) {
    if (url.includes("amazon.com") || url.includes("amazon.in")) {
        return { platform: "amazon", ...amazonSelectors[type] };
    }
    if (url.includes("flipkart.com")) {
        return { platform: "flipkart", ...flipkartSelectors[type] };
    }
    return null;
}

export function getProductPageSelectors(url) {
    return getSelectors(url, "product");
}

export function getDiscoveryPageSelectors(url) {
    return getSelectors(url, "discovery");
}
