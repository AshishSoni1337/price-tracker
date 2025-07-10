import { Product } from '../models/product.js';
import { scrapeProductPage, scrapeDiscoveryPage } from '../scraper/scraper.js';
import { getProductPageSelectors } from '../scraper/selectors.js';
import { bucket, queryApi, writeApi } from '../config/influxdb.js';
import { Point } from '@influxdata/influxdb-client';
import { ValidationError, DuplicateError, ScrapingError, NotFoundError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { withPage } from '../services/browserManager.js';
import { alertConfig } from '../config/alertConfig.js';
import { dispatchPriceDropAlert } from './alertService.js';

// --- Helper Functions for trackNewProduct ---

function _getPlatformFromUrl(url) {
    if (url.includes('amazon.')) return 'amazon';
    if (url.includes('flipkart.')) return 'flipkart';
    // Add other platforms as needed
    return 'other';
}

async function _validateProductDoesNotExist(url, platform, uniqueId) {
    if (platform !== 'other' && uniqueId) {
        const existingProduct = await Product.findOne({ platform, uniqueId });
        if (existingProduct) {
            throw new DuplicateError(`Product with ${platform} ID ${uniqueId} is already being tracked.`);
        }
    }
    const existingProductByUrl = await Product.findOne({ url });
    if (existingProductByUrl) {
        throw new DuplicateError('Product with this URL is already being tracked.');
    }
}

async function _scrapeAndValidateData(url, selectors) {
    const scrapedData = await scrapeProductPage(url, selectors);
    if (!scrapedData || !scrapedData.name) {
        throw new ScrapingError('Could not scrape product details. The page layout may have changed.');
    }
    return scrapedData;
}

async function _saveProductAndPrice(productData) {
    const newProduct = new Product(productData);
    await newProduct.save();

    if (productData.currentPrice) {
        const pricePoint = new Point('price')
            .tag('productId', newProduct._id.toString())
            .floatField('value', productData.currentPrice)
            .timestamp(new Date());
        
        writeApi.writePoint(pricePoint);
        await writeApi.flush();
        logger.info(`Initial price for ${newProduct.name} written to InfluxDB.`);
    }

    return newProduct;
}

// --- Main Service Functions ---

async function testScrapeProduct(url) {
    if (!url) {
        throw new ValidationError('URL is required for testing scrape.');
    }
    const selectors = getProductPageSelectors(url);
    if (!selectors) {
        throw new ScrapingError('This website is not supported for tracking.');
    }
    return await _scrapeAndValidateData(url, selectors);
}

async function trackNewProduct(url) {
    if (!url) {
        throw new ValidationError('URL is required');
    }

    const selectors = getProductPageSelectors(url);
    if (!selectors) {
        throw new ScrapingError('This website is not supported for tracking.');
    }

    const { name, price, description, images, uniqueId } = await _scrapeAndValidateData(url, selectors);
    const platform = _getPlatformFromUrl(url);

    await _validateProductDoesNotExist(url, platform, uniqueId);

    const productData = {
        url,
        name,
        platform,
        uniqueId,
        currentPrice: price,
        description,
        images,
        lastScrapedAt: new Date()
    };

    return await _saveProductAndPrice(productData);
}

async function updateProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) {
        throw new NotFoundError(`Product with ID ${productId} not found.`);
    }

    const selectors = getProductPageSelectors(product.url);
    if (!selectors) {
        throw new ScrapingError(`No selectors found for ${product.url}, cannot update.`);
    }

    const { name, price, description, images } = await _scrapeAndValidateData(product.url, selectors);

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.images = images || product.images;
    product.status = 'ACTIVE';
    product.retryCount = 0;

    const oldPrice = product.currentPrice;
    const isUpdatedToday = product.lastScrapedAt?.toDateString() === new Date().toDateString();

    // ANSI color codes
    const colors = {
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        cyan: '\x1b[36m',
        reset: '\x1b[0m'
    };

    // Check if the price has changed OR if it's the first scrape of the day
    if (price && (price !== product.currentPrice || !isUpdatedToday)) {
        if (price !== product.currentPrice) {
            logger.info(`Price changed for ${product.name}: ${colors.yellow}${product.currentPrice}${colors.reset} -> ${colors.green}${price}${colors.reset}`);
            
            // Check for price drop alert
            if (product.alertEnabled && oldPrice && price < oldPrice * (1 - alertConfig.priceDropThreshold)) {
                logger.info(`Price drop detected for ${product.name}. Triggering alert.`);
                // We don't want to wait for the alert to be sent
                dispatchPriceDropAlert(product, oldPrice, price).catch(err => {
                    logger.error(`Error dispatching price drop alert for ${product._id}`, err);
                });
            }

        } else {
            logger.info(`Price for ${product.name} is the same, recording daily price point: ${colors.cyan}${price}${colors.reset}`);
        }
        product.currentPrice = price;

        const pricePoint = new Point('price')
            .tag('productId', product._id.toString())
            .floatField('value', price)
            .timestamp(new Date()); // Use current time for the point
        
        writeApi.writePoint(pricePoint);
        await writeApi.flush();
    } else if (price) {
        logger.info(`Price for ${product.name} has not changed and was already updated today: ${colors.cyan}${price}${colors.reset}`);
    } else {
        logger.warn(`Could not scrape a valid price for ${product.name}.`);
    }

    product.lastScrapedAt = new Date();
    await product.save();
    return product;
}

async function getAllTrackedProducts(options = {}) {
    const { page = 1, limit = 10, search, platform } = options;
    const query = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    if (platform) {
        query.platform = platform;
    }

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit, 10);

    const products = await Product.find(query)
        .populate('variations')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitNum);

    return {
        products,
        totalPages,
        currentPage: parseInt(page, 10),
        totalProducts,
    };
}

async function getProductDetails(id) {
    const product = await Product.findById(id).populate('variations');
    if (!product) {
        throw new NotFoundError('Product not found');
    }
    return product;
}

async function getProductPriceHistory(productId, range = '-30d') {
    const fluxQuery = `
        from(bucket: "${bucket}")
        |> range(start: ${range})
        |> filter(fn: (r) => r._measurement == "price")
        |> filter(fn: (r) => r.productId == "${productId}")
        |> yield(name: "mean")
    `;

    return new Promise((resolve, reject) => {
        const data = [];
        queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                data.push(o);
            },
            error(error) {
                logger.error('Error from InfluxDB query:', { error });
                reject(error);
            },
            complete() {
                resolve(data);
            },
        });
    });
}

async function updateProductStatus(id, status) {
    const allowedStatuses = ['ACTIVE', 'PAUSED'];
    if (!status || !allowedStatuses.includes(status)) {
        throw new ValidationError('Invalid status provided.');
    }
    const product = await Product.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );
    if (!product) {
        throw new NotFoundError('Product not found for status update.');
    }
    logger.info(`Product ${id} status updated to ${status}.`);
    return product;
}

async function toggleProductAlert(id, isEnabled) {
    if (typeof isEnabled !== 'boolean') {
        throw new ValidationError('Invalid value for isEnabled. It must be a boolean.');
    }

    const product = await Product.findByIdAndUpdate(
        id,
        { alertEnabled: isEnabled },
        { new: true }
    );

    if (!product) {
        throw new NotFoundError('Product not found for alert toggle.');
    }

    logger.info(`Product ${id} alert has been ${isEnabled ? 'enabled' : 'disabled'}.`);
    return product;
}

async function testProductAlert(productId) {
    const product = await Product.findById(productId);
    if (!product) {
        throw new NotFoundError(`Product with ID ${productId} not found.`);
    }
    if (!product.currentPrice) {
        throw new ValidationError('Product does not have a current price, cannot simulate a drop.');
    }

    // Simulate a 20% price drop to ensure it crosses the threshold
    const oldPrice = product.currentPrice;
    const newPrice = oldPrice * 0.8;

    logger.info(`Simulating a price drop for "${product.name}" from ${oldPrice} to ${newPrice} to test alerts.`);

    // Dispatch the alert directly
    await dispatchPriceDropAlert(product, oldPrice, newPrice);

    return { message: `Test alert dispatched for ${product.name}. Check your configured channels.` };
}

// --- Discovery Service Functions ---

const buildSearchUrl = (platform, query) => {
    switch (platform) {
        case 'amazon':
            return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
        case 'flipkart':
            return `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
        default:
            return null;
    }
};

async function discoverProducts(platform, query) {
    if (!platform || !query) {
        throw new ValidationError('Platform and search query are required.');
    }

    const searchUrl = buildSearchUrl(platform, query);
    if (!searchUrl) {
        throw new ValidationError('The selected platform is not supported for discovery.');
    }

    const discoveredItems = await withPage(page => scrapeDiscoveryPage(page, searchUrl));

    if (discoveredItems.length === 0) {
        return [];
    }

    // From the discovered items, extract the unique IDs (if they exist) and the URLs.
    const discoveredIds = discoveredItems.map(item => item.uniqueId).filter(Boolean);
    const discoveredUrls = discoveredItems.map(item => item.url);

    // To check for tracked products, we build a query that looks for a match
    // on either the platform-specific unique ID or the product URL.
    const orConditions = [];
    if (discoveredIds.length > 0) {
        // Match documents where the platform and uniqueId are in the list of discovered IDs.
        orConditions.push({ platform, uniqueId: { $in: discoveredIds } });
    }
    // Always include a check for the URL as a fallback.
    orConditions.push({ url: { $in: discoveredUrls } });

    // Fetch products from the database that match any of our conditions.
    // We only select the 'uniqueId' and 'url' fields for efficiency.
    const trackedProducts = await Product.find({ $or: orConditions }).select('uniqueId url');

    // For efficient O(1) lookup, create sets of the unique IDs and URLs
    // of the products that are already being tracked.
    const trackedUniqueIds = new Set(trackedProducts.map(p => p.uniqueId).filter(Boolean));
    const trackedUrls = new Set(trackedProducts.map(p => p.url));

    // Augment the discovered items with an `isTracked` flag.
    const results = discoveredItems.map(item => ({
        ...item,
        // An item is considered tracked if its unique ID (for this platform) is known,
        // or if its URL is already in the database.
        isTracked: (item.uniqueId && trackedUniqueIds.has(item.uniqueId)) || trackedUrls.has(item.url),
    }));

    return results;
}

export const productService = {
    trackNewProduct,
    getAllTrackedProducts,
    getProductDetails,
    getProductPriceHistory,
    testScrapeProduct,
    updateProduct,
    updateProductStatus,
    discoverProducts,
    toggleProductAlert,
    testProductAlert,
}; 