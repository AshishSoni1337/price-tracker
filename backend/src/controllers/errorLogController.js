import { errorLogService } from '../services/errorLogService.js';

async function getErrors(req, res) {
    try {
        const { page = 1, limit = 10, sortBy = 'timestamp', order = 'desc' } = req.query;
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sortBy,
            order,
        };
        const result = await errorLogService.getPaginatedErrors(options);
        res.json(result);
    } catch (error) {
        console.error('Error in getErrors controller:', error);
        res.status(500).json({ message: 'Server error retrieving error logs.' });
    }
}

async function getErrorDetails(req, res) {
    try {
        const errorLog = await errorLogService.getErrorById(req.params.id);
        res.json(errorLog);
    } catch (error) {
        console.error(`Error in getErrorDetails for ${req.params.id}:`, error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}

async function getErrorScreenshot(req, res) {
    try {
        const errorLog = await errorLogService.getErrorById(req.params.id);
        if (!errorLog.screenshot) {
            return res.status(404).json({ message: 'No screenshot available for this error.' });
        }
        res.set('Content-Type', 'image/png');
        res.send(errorLog.screenshot);
    } catch (error) {
        console.error(`Error in getErrorScreenshot for ${req.params.id}:`, error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}


export const errorLogController = {
    getErrors,
    getErrorDetails,
    getErrorScreenshot,
}; 