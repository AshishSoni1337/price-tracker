import express from 'express';
const router = express.Router();
import { productController } from '../controllers/productController.js';

// @route   POST api/products
// @desc    Add a new product to track
// @access  Public
router.post('/', productController.createProduct);

// @route   GET api/products
// @desc    Get all tracked products
// @access  Public
router.get('/', productController.getAllProducts);

// @route   GET api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get('/:id', productController.getProductById);

// @route   GET api/products/:id/history
// @desc    Get price history for a product
// @access  Public
router.get('/:id/history', productController.getProductHistory);

// @route   POST api/products/test-scrape
// @desc    Test scraping a product URL without saving
// @access  Public
router.post('/test-scrape', productController.testScrape);

// @route   PATCH api/products/:id/status
// @desc    Update a product's status
// @access  Public
router.patch('/:id/status', productController.updateProductStatus);

export default router;
