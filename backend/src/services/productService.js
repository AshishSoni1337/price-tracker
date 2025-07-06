import { Product } from '../models/product.js';
import { scrapeProductPage } from '../scraper/scraper.js';
import { getProductPageSelectors } from '../scraper/selectors.js';
import { bucket, queryApi, writeApi } from '../config/influxdb.js';
import { Point } from '@influxdata/influxdb-client';
import { ValidationError, DuplicateError, ScrapingError, NotFoundError } from '../utils/errors.js';

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
        console.log(`Initial price for ${newProduct.name} written to InfluxDB.`);
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

    const { name, price, description, images, uniqueId } = await _scrapeAndValidateData(product.url, selectors);

    // Update product fields
    product.name = name;
    product.description = description;
    product.images = images;
    product.lastScrapedAt = new Date();
    product.status = 'ACTIVE';
    product.retryCount = 0;

    // Check if the price has changed
    if (price && price !== product.currentPrice) {
        console.log(`Price changed for ${name}: ${product.currentPrice} -> ${price}`);
        product.currentPrice = price;

        const pricePoint = new Point('price')
            .tag('productId', product._id.toString())
            .floatField('value', price)
            .timestamp(product.lastScrapedAt);
        
        writeApi.writePoint(pricePoint);
        await writeApi.flush();
    } else if (price) {
        console.log(`Price for ${name} has not changed: ${price}`);
    } else {
        console.warn(`Could not scrape a valid price for ${name}.`);
    }

    await product.save();
    return product;
}

async function getAllTrackedProducts() {
    return await Product.find().populate('variations').sort({ createdAt: -1 });
}

async function getProductDetails(id) {
    const product = await Product.findById(id).populate('variations');
    if (!product) {
        throw new NotFoundError('Product not found');
    }
    return product;
}

async function getProductPriceHistory(productId) {
    const fluxQuery = `
        from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "price")
        |> filter(fn: (r) => r.productId == "${productId}")
        |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
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
                console.error('\\nError from InfluxDB query:', error);
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

    const product = await Product.findById(id);
    if (!product) {
        throw new NotFoundError('Product not found');
    }

    product.status = status;
    await product.save();
    return product;
}

export const productService = {
    trackNewProduct,
    getAllTrackedProducts,
    getProductDetails,
    getProductPriceHistory,
    testScrapeProduct,
    updateProduct,
    updateProductStatus,
}; 