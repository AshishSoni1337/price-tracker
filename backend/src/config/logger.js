import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const { combine, timestamp, printf, colorize, align } = winston.format;

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "..", "..", "logs");

// Base format for file transports (without color)
const fileLogFormat = combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(({ level, message, timestamp }) => {
        // Strip ANSI color codes for file logging
        const cleanMessage = message.replace(/\\x1b\[[0-9;]*m/g, "");
        return `${timestamp} ${level}: ${cleanMessage}`;
    })
);

// Specific format for the console (with color)
const consoleLogFormat = combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    align(),
    printf(
        ({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`
    )
);

// Common configuration for all DailyRotateFile transports
const dailyRotateFileOptions = {
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
};

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: fileLogFormat, // Default format for all transports
    transports: [
        new winston.transports.Console({
            format: consoleLogFormat, // Override format for the console
        }),
        new winston.transports.DailyRotateFile({
            ...dailyRotateFileOptions,
            level: "error",
            filename: path.join(logDir, "error-%DATE%.log"),
        }),
        new winston.transports.DailyRotateFile({
            ...dailyRotateFileOptions,
            level: "warn",
            filename: path.join(logDir, "warn-%DATE%.log"),
        }),
        new winston.transports.DailyRotateFile({
            ...dailyRotateFileOptions,
            filename: path.join(logDir, "combined-%DATE%.log"),
        }),
    ],
    exitOnError: false, // Do not exit on handled exceptions
});
