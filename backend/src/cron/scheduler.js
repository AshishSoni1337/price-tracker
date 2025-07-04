import cron from 'node-cron';
import { Product } from '../models/product.js';
import { productService } from '../services/productService.js';

// This is our main price tracking job
cron.schedule('* * * * *', async () => {
    const jobStartTime = new Date();
    console.log(`[${jobStartTime.toISOString()}] Running scheduled price tracking job...`);
    
    try {
        const productsToTrack = await Product.find({ status: 'ACTIVE' }).select('_id name');
        
        if (productsToTrack.length === 0) {
            console.log('No active products to track.');
            return;
        }

        console.log(`Found ${productsToTrack.length} active products to track.`);

        for (const product of productsToTrack) {
            try {
                console.log(`- Updating ${product.name} (ID: ${product._id})`);
                await productService.updateProduct(product._id);
            } catch (error) {
                console.error(`Error updating product ${product._id}: ${error.message}`);
                // The error logging (with screenshot) is handled inside the scraper,
                // so here we just need to mark the product as errored.
                await Product.findByIdAndUpdate(product._id, { status: 'ERROR' });
            }
        }
        
        console.log(`Finished scheduled job. Total time: ${(new Date() - jobStartTime) / 1000}s`);

    } catch (error) {
        // This catches errors in the job runner itself (e.g., DB connection issue)
        console.error('A critical error occurred during the scheduled job runner:', error);
    }
});

console.log('Scheduled price tracking job is configured to run every minute.');
