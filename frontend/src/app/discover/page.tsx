'use client';

import { useState } from 'react';
import { addProduct } from '@/services/productService';
import type { Product } from '@/types';
import Image from 'next/image';
import { AxiosError } from 'axios';
import { Loader2, Link as LinkIcon } from 'lucide-react';

const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-fade-in-up">
        <div className="relative h-64 w-full">
            <Image
                src={product.images[0] || '/placeholder.png'}
                alt={product.name}
                layout="fill"
                objectFit="contain"
                className="p-4"
            />
        </div>
        <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3" title={product.name}>
                {product.name}
            </h3>
            <p className="text-3xl font-extrabold text-indigo-600 mb-4">
                {product.currentPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </p>
            <a 
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                View on {product.platform}
            </a>
        </div>
    </div>
);


export default function TrackProductPage() {
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!url) {
            setError('Please enter a product URL.');
            return;
        }
        setIsLoading(true);
        setProduct(null);
        setError(null);

        try {
            const result = await addProduct(url);
            setProduct(result);
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Failed to track product.');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
            setUrl('');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto max-w-2xl p-4 md:p-6">
                <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Track a New Product</h1>
                    <p className="text-center text-gray-500 mb-6">Enter a product URL to start tracking its price.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.amazon.com/dp/B08P2H5L72"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                disabled={isLoading}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    Tracking...
                                </>
                            ) : 'Track Product'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {product && (
                     <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Successfully Added Product!</h2>
                        <ProductCard product={product} />
                    </div>
                )}
            </div>
        </div>
    );
} 