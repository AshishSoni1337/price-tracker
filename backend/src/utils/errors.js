/**
 * @description Base class for custom application errors.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Distinguish between operational and programming errors

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * @description For scraping-specific errors (e.g., selectors not found, page layout changed).
 */
class ScrapingError extends AppError {
    constructor(message = 'Could not process the page. The layout may have changed or the site is blocking the scraper.', statusCode = 500) {
        super(message, statusCode);
    }
}

/**
 * @description For when a resource is not found in the database.
 */
class NotFoundError extends AppError {
    constructor(message = 'The requested resource was not found.', statusCode = 404) {
        super(message, statusCode);
    }
}

/**
 * @description For when trying to create a resource that already exists.
 */
class DuplicateError extends AppError {
    constructor(message = 'This resource already exists.', statusCode = 409) {
        super(message, statusCode);
    }
}

/**
 * @description For general validation errors (e.g., missing URL).
 */
class ValidationError extends AppError {
    constructor(message = 'Invalid input provided.', statusCode = 400) {
        super(message, statusCode);
    }
}


export {
    AppError,
    ScrapingError,
    NotFoundError,
    DuplicateError,
    ValidationError,
}; 