import express from 'express';
const router = express.Router();
import * as errorLogController from '../controllers/errorLogController.js';

// @route   GET api/errors
// @desc    Get paginated error logs
// @access  Public
router.get('/', errorLogController.getErrors);

// @route   GET api/errors/:id
// @desc    Get a single error log's details
// @access  Public
router.get('/:id', errorLogController.getErrorDetails);

// @route   GET api/errors/:id/screenshot
// @desc    Get the screenshot for a single error log
// @access  Public
router.get('/:id/screenshot', errorLogController.getErrorScreenshot);


export default router; 