import * as productService from "../services/productService.js";
import { logger } from "../config/logger.js";
import { Product } from "../models/product.js";

/**
 * The core logic for processing a single scraping job.
 * @param {import('bullmq').Job} job - The job object from the queue.
 */
export const scrapingJobProcessor = async (job) => {
    const { productId } = job.data;

    if (!productId) {
        logger.warn("Job received without a productId.", { jobId: job.id });
        return;
    }

    logger.info(`Processing job ${job.id} for product: ${productId}`);

    const product = await Product.findById(productId);
    if (!product) {
        logger.warn(`Product ${productId} not found. Skipping job ${job.id}.`);
        return;
    }

    try {
        await productService.updateProduct(productId);
        logger.info(
            `Successfully processed job ${job.id} for product ${productId} (${product.name}).`
        );
    } catch (error) {
        logger.error(
            `Error processing job ${job.id} for product ${productId} (${product.name}):`,
            error
        );

        // BullMQ handles retries based on the queue's defaultJobOptions.
        // This logic now only needs to handle the final failure case.
        if (job.attemptsMade >= job.opts.attempts) {
            logger.error(
                `Job for product ${productId} has failed its final attempt. Setting status to ERROR.`
            );
            await Product.findByIdAndUpdate(productId, { status: "ERROR" });
        }

        // Re-throw the error to let BullMQ know the job has failed
        throw error;
    }
};
