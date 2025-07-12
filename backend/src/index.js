import "./config/env.js";
import express from "express";
import cors from "cors";

import { connectDB, disconnectDB } from "./config/db.js";
import "./config/influxdb.js";
import productRoutes from "./routes/products.js";
import errorLogRoutes from "./routes/errors.js";
import healthRoutes from "./routes/health.js";
import { initBrowser, closeBrowser } from "./services/browserManager.js";
import {
    PORT,
    CORS_ALLOWED_ORIGINS,
    ENABLE_JOB_PRODUCER,
    ENABLE_SCRAPING_WORKER,
} from "./config/appConfig.js";
import { initScheduledJobs } from "./cron/scheduler.js";
import { logger } from "./config/logger.js";
import { createScrapingWorker } from "./config/queue.js";
import { scrapingJobProcessor } from "./workers/scraper-consumer.js";

const app = express();

// CORS Configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (CORS_ALLOWED_ORIGINS.indexOf(origin) === -1) {
            const msg =
                "The CORS policy for this site does not allow access from the specified Origin.";
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
};

app.use(cors(corsOptions));

// Init Middleware
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from Price Stalker backend!");
});

// Define Routes
app.use("/api/products", productRoutes);
app.use("/api/errors", errorLogRoutes);
app.use("/api", healthRoutes);

function startWorker() {
    logger.info("Starting scraping worker in-process...");
    const worker = createScrapingWorker(scrapingJobProcessor);

    worker.on("completed", (job) => {
        logger.info(`Job ${job.id} has completed.`);
    });
    worker.on("failed", (job, err) => {
        logger.error(`Job ${job.id} has failed with error: ${err.message}`);
    });
    worker.on("error", (err) => {
        logger.error(`Scraping worker error: ${err.message}`);
    });
    worker.on("waiting", (job) => {
        logger.info(`Job ${job.idId} is waiting to be processed.`);
    });
    worker.on("active", (job) => {
        logger.info(`Job ${job.id} is active.`);
    });
    worker.on("stalled", (job) => {
        logger.warn(`Job ${job.id} is stalled.`);
    });
    logger.info("Scraping worker is running, waiting for jobs...");
}

async function startServer() {
    try {
        await connectDB();
        await initBrowser();

        if (ENABLE_JOB_PRODUCER) {
            logger.info("Job producer is enabled. Initializing scheduled jobs...");
            initScheduledJobs();
        } else {
            logger.info("Job producer is disabled. Skipping initialization.");
        }
        if (ENABLE_SCRAPING_WORKER) {
            logger.info("Scraping worker is enabled. Initializing worker...");
            startWorker();
        } else {
            logger.info("Scraping worker is disabled. Skipping initialization.");
        }

        logger.info(`Current environment: ${process.env.NODE_ENV}`);

        app.listen(PORT, () => {
            logger.info(`Backend server listening on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Failed to initialize and start server:", error);
        process.exit(1);
    }
}

async function gracefulShutdown() {
    logger.info("Shutting down gracefully...");
    await closeBrowser();
    await disconnectDB();
    process.exit(0);
}

startServer();

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
