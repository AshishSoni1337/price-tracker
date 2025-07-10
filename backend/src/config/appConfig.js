// Server Configuration
export const PORT = process.env.PORT || 5001;
export const MONGODB_URL = process.env.MONGO_URI;
export const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
export const REDIS_MAX_RETRIES =
    parseInt(process.env.REDIS_MAX_RETRIES, 10) || 10;

// CORS Configuration
export const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000"];

// Scraper Configuration
export const MAX_CONCURRENT_TABS =
    parseInt(process.env.MAX_CONCURRENT_TABS, 10) || 3;
export const MAX_SCRAPE_RETRIES =
    parseInt(process.env.MAX_SCRAPE_RETRIES, 10) || 3;
export const HEADLESS = process.env.HEADLESS !== "false";

// influx db config
export const INFLUX_URL = process.env.INFLUXDB_URL;
export const INFLUX_TOKEN = process.env.INFLUXDB_TOKEN;
export const INFLUX_ORG = process.env.INFLUXDB_ORG;
export const INFLUX_BUCKET = process.env.INFLUXDB_BUCKET;

// Worker Configuration
export const ENABLE_JOB_PRODUCER =
    process.env.ENABLE_JOB_PRODUCER === "true";
export const ENABLE_SCRAPING_WORKER =
    process.env.ENABLE_SCRAPING_WORKER === "true";
