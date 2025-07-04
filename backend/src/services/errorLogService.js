import ErrorLog from '../models/errorLog.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Fetches a paginated list of error logs from the database.
 * @param {object} options - Pagination and sorting options.
 * @param {number} [options.page=1] - The page number to retrieve.
 * @param {number} [options.limit=10] - The number of items per page.
 * @param {string} [options.sortBy='timestamp'] - The field to sort by.
 * @param {string} [options.order='desc'] - The sort order ('asc' or 'desc').
 * @returns {Promise<object>} An object containing the paginated results and metadata.
 */
async function getPaginatedErrors({ page = 1, limit = 10, sortBy = 'timestamp', order = 'desc' }) {
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };

    // Run queries in parallel for better performance and to avoid hanging
    const [errors, totalCount] = await Promise.all([
        ErrorLog.find()
            .select('-screenshot -stackTrace') // Exclude large fields from the list view
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        ErrorLog.countDocuments()
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
        errors,
        currentPage: page,
        totalPages,
        totalCount,
    };
}

/**
 * Fetches a single error log by its ID, including all fields.
 * @param {string} id - The ID of the error log.
 * @returns {Promise<object>} The full error log document.
 */
async function getErrorById(id) {
    const errorLog = await ErrorLog.findById(id);
    if (!errorLog) {
        throw new NotFoundError(`Error log with ID ${id} not found.`);
    }
    return errorLog;
}


export const errorLogService = {
    getPaginatedErrors,
    getErrorById,
}; 