import cron from 'node-cron';
import { Product } from '../models/product.js';
import { productService } from '../services/productService.js';
import { MAX_CONCURRENT_TABS, MAX_SCRAPE_RETRIES } from '../config/appConfig.js';

// This is our main price tracking job
cron.schedule('* * * * *', async () => {
    const jobStartTime = new Date();
    console.log(`[${jobStartTime.toISOString()}] Running scheduled price tracking job...`);
    
    try {
        const productsToTrack = await Product.find({ status: 'ACTIVE' }).select('_id name retryCount');
        
        if (productsToTrack.length === 0) {
            console.log('No active products to track.');
            return;
        }

        console.log(`Found ${productsToTrack.length} active products to track. Concurrency limit: ${MAX_CONCURRENT_TABS}`);

        const updatePromises = productsToTrack.map(product =>
            (async () => {
                try {
                    console.log(`- Updating ${product.name} (ID: ${product._id})`);
                    await productService.updateProduct(product._id);
                } catch (error) {
                    console.error(`Error updating product ${product._id}: ${error.message}`);
                    
                    const newRetryCount = (product.retryCount || 0) + 1;
                    
                    if (newRetryCount >= MAX_SCRAPE_RETRIES) {
                        await Product.findByIdAndUpdate(product._id, { status: 'ERROR', retryCount: newRetryCount });
                        console.error(`Product ${product.name} (${product._id}) failed after ${newRetryCount} attempts. Setting status to ERROR.`);
                    } else {
                        await Product.findByIdAndUpdate(product._id, { retryCount: newRetryCount });
                        console.log(`Product ${product.name} (${product._id}) failed to update. Retry attempt ${newRetryCount} of ${MAX_SCRAPE_RETRIES}.`);
                    }
                }
            })()
        );

        await Promise.all(updatePromises);
        
        console.log(`Finished scheduled job. Total time: ${(new Date() - jobStartTime) / 1000}s`);

    } catch (error) {
        // This catches errors in the job runner itself (e.g., DB connection issue)
        console.error('A critical error occurred during the scheduled job runner:', error);
    }
});

console.log('Scheduled price tracking job is configured to run every minute.');
