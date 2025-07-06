import mongoose from "mongoose";
import { MONGODB_URL } from "./appConfig.js";
import { logger } from "./logger.js";

let isConnected = false;

export const connectDB = async () => {
    if (isConnected) {
        logger.info("Database is already connected.");
        return;
    }

    if (!MONGODB_URL) {
        logger.error("MONGODB_URL is not defined in the configuration.");
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(MONGODB_URL);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        isConnected = true;
    } catch (error) {
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export const disconnectDB = async () => {
    if (!isConnected) {
        logger.info("Database is not connected.");
        return;
    }
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected.");
};
