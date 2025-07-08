import cron from "node-cron";
import { Product } from "../models/product.js";
import { scrapingQueue } from "../config/queue.js";
import { logger } from "../config/logger.js";

/**
 * Adds a job to the scraping queue.
 * Each job contains the ID of a product to be scraped.
 * @param {string} productId - The ID of the product to scrape.
 */
const addProductToQueue = async (productId) => {
    try {
        await scrapingQueue.add("scrape-product", { productId }, { jobId: productId });
        logger.info(`Added product ${productId} to the scraping queue.`);
    } catch (error) {
        logger.error(`Failed to add product ${productId} to queue:`, error);
    }
};

/**
 * Fetches all active products from the database and adds them
 * to the scraping queue for processing by the workers.
 */
const enqueueActiveProducts = async () => {
    logger.info(
        "Producer cron job started: Looking for active products to enqueue."
    );
    try {
        const products = await Product.find({ status: "ACTIVE" }, "_id");
        if (products.length === 0) {
            logger.info("No active products found to queue.");
            return;
        }

        logger.info(
            `Found ${products.length} active products. Adding to queue...`
        );
        for (const product of products) {
            await addProductToQueue(product._id.toString());
        }
    } catch (error) {
        logger.error("Error fetching and enqueuing active products:", error);
    } finally {
        logger.info("Producer cron job finished.");
    }
};

/**
 * Schedules the producer to run every minute.
 */
export const initScheduledJobs = () => {
    // Runs every minute
    cron.schedule("* * * * *", enqueueActiveProducts);
    logger.info("Producer cron job scheduled to run every minute.");
};
