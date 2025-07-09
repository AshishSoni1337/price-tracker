import mongoose from 'mongoose';
const { Schema } = mongoose;

const productVariationSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String },
    color: { type: String },
    price: { type: Number, required: true },
    // Potentially more variation attributes like style, material etc.
    attributes: { type: Map, of: String }
}, { timestamps: true });

const productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true, unique: true },
    images: [{ type: String }],
    platform: { type: String, required: true }, // e.g., 'amazon', 'flipkart'
    uniqueId: { type: String }, // e.g., ASIN for Amazon
    currentPrice: { type: Number },
    lastScrapedAt: { type: Date },
    status: {
        type: String,
        enum: ['ACTIVE', 'PAUSED', 'ERROR'],
        default: 'ACTIVE'
    },
    retryCount: { type: Number, default: 0 },
    tracking_frequency: { type: String, default: '0 * * * *' }, // Default to every hour
    variations: [{ type: Schema.Types.ObjectId, ref: 'ProductVariation' }],
    
    // Alerting field
    alertEnabled: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ platform: 1, uniqueId: 1 }, { unique: true, sparse: true });

export const ProductVariation = mongoose.model('ProductVariation', productVariationSchema);
export const Product = mongoose.model('Product', productSchema); 