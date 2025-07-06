import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import './config/db.js';
import './config/influxdb.js';
import productRoutes from './routes/products.js';
import errorLogRoutes from './routes/errors.js';
import { initBrowser, closeBrowser } from './services/browserManager.js';
import { PORT, CORS_ALLOWED_ORIGINS } from './config/appConfig.js';
import './cron/scheduler.js';

const app = express();

// CORS Configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (CORS_ALLOWED_ORIGINS.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

app.use(cors(corsOptions));

// Init Middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Price Stalker backend!');
});

// Define Routes
app.use('/api/products', productRoutes);
app.use('/api/errors', errorLogRoutes);

async function startServer() {
    try {
        await initBrowser();
        console.log('Browser initialized for scraping.');
        app.listen(PORT, () => {
            console.log(`Backend server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize browser and start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Received shutdown signal, cleaning up...');
    try {
        await closeBrowser();
        console.log('Browser closed gracefully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
