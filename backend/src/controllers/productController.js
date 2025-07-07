import { productService } from '../services/productService.js';
import { logger } from '../config/logger.js';

async function createProduct(req, res, next) {
    const { url } = req.body;
    try {
        if (!url) {
            // This case should be caught by the service, but as a safeguard:
            throw new ValidationError('URL is required.');
        }
        const newProduct = await productService.trackNewProduct(url);
        res.status(201).json(newProduct);
    } catch (error) {
        logger.error(`[CONTROLLER_ERROR] Failed to create product for URL: ${url}. Reason: ${error.message}`);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}

async function getAllProducts(req, res, next) {
    try {
        const products = await productService.getAllTrackedProducts();
        res.json(products);
    } catch (error) {
        logger.error('Error in getAllProducts:', error.message);
        res.status(500).json({ message: 'Server error retrieving products.' });
    }
}

async function getProductById(req, res, next) {
    try {
        const product = await productService.getProductDetails(req.params.id);
        res.json(product);
    } catch (error) {
        logger.error(`Error in getProductById for ${req.params.id}:`, { message: error.message });
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}

async function getProductHistory(req, res, next) {
    try {
        const data = await productService.getProductPriceHistory(req.params.id);
        res.json(data);
    } catch (error) {
        logger.error(`Error in getProductHistory for ${req.params.id}:`, { message: error.message });
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}

async function testScrape(req, res, next) {
    const { url } = req.body;
    try {
        if (!url) {
            throw new ValidationError('URL is required for test scrape.');
        }
        const scrapedData = await productService.testScrapeProduct(url);
        res.json(scrapedData);
    } catch (error) {
        logger.error(`[CONTROLLER] Failed to test scrape for URL ${url}: ${error.message}`);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}

async function updateProductStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedProduct = await productService.updateProductStatus(id, status);
        res.json(updatedProduct);
    } catch (error) {
        logger.error(`Error in updateProductStatus for ${req.params.id}:`, { message: error.message });
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}

async function discoverProducts(req, res) {
    const { platform, query } = req.body;
    try {
        const results = await productService.discoverProducts(platform, query);
        res.json(results);
    } catch (error) {
        logger.error(`[CONTROLLER] Failed to discover products for query "${query}" on platform "${platform}": ${error.message}`);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}

export const productController = {
    createProduct,
    getAllProducts,
    getProductById,
    getProductHistory,
    testScrape,
    updateProductStatus,
    discoverProducts,
}; 