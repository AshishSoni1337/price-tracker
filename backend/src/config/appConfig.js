import 'dotenv/config';

// Server Configuration
export const PORT = process.env.PORT || 5001;

// CORS Configuration
export const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

// Scraper Configuration
export const MAX_CONCURRENT_TABS = parseInt(process.env.MAX_CONCURRENT_TABS, 10) || 5;
export const MAX_SCRAPE_RETRIES = parseInt(process.env.MAX_SCRAPE_RETRIES, 10) || 3;
export const HEADLESS = process.env.HEADLESS !== 'false';
