import { Queue, Worker } from "bullmq";
import {
    REDIS_URL,
    MAX_CONCURRENT_TABS,
    MAX_SCRAPE_RETRIES,
    REDIS_MAX_RETRIES,
} from "./appConfig.js";
import { logger } from "./logger.js";

const QUEUE_NAME = "scraping-queue";

// Basic connection options
const connection = {
    connection: REDIS_URL,
    // Add ioredis options for robust connections
    maxRetriesPerRequest: null, // Set to null for BullMQ compatibility
    enableReadyCheck: false,
    retryStrategy: (times) => {
        if (times > REDIS_MAX_RETRIES) {
            logger.error(
                `Redis connection retries exhausted after ${
                    times - 1
                } attempts.`
            );
            // Stop retrying
            return null;
        }
        // Exponential backoff delay
        const delay = Math.min(times * 200, 3000); // e.g., 200ms, 400ms, ... up to 3s
        logger.warn(
            `Redis connection failed. Retrying in ${delay}ms... (Attempt ${times})`
        );
        return delay;
    },
};

/**
 * The main queue for product scraping jobs.
 * Jobs are added by the producer (cron scheduler).
 */
export const scrapingQueue = new Queue(QUEUE_NAME, {
    ...connection,
    defaultJobOptions: {
        attempts: MAX_SCRAPE_RETRIES, // Retry up to 3 times
        backoff: {
            type: "exponential",
            delay: 1000, // 1s, 2s, 4s
        },
        removeOnComplete: true, // Clean up successful jobs
        removeOnFail: 1000, // Keep last 1000 failed jobs
    },
});

/**
 * Creates a new worker for processing jobs from the scraping queue.
 * @param {Function} processor - The async function that will process each job.
 * @returns {Worker} A BullMQ Worker instance.
 */
export const createScrapingWorker = (processor) => {
    return new Worker(QUEUE_NAME, processor, {
        ...connection,
        concurrency: MAX_CONCURRENT_TABS,
        lockDuration: 300000, // 5 minutes
        lockRenewTime: 150000, // 2.5 minutes
    });
};
