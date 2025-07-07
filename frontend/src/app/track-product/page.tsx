'use client';

import { useState } from 'react';
import { addProduct } from '@/services/productService';
import { testScrapeProduct } from '@/services/trackProductService';
import type { DiscoveredProduct } from '@/types';
import Image from 'next/image';
import { AxiosError } from 'axios';
import { Loader2, Link as LinkIcon, Search, PlusCircle } from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';
import { useRouter } from 'next/navigation';

const ScrapedProductCard = ({ product, onConfirm, isAdding }: { product: DiscoveredProduct, onConfirm: () => void, isAdding: boolean }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in-up border">
        <div className="relative h-48 sm:h-64 w-full">
            <Image
                src={product.image || '/placeholder.png'}
                alt={product.name}
                fill
                style={{objectFit: 'contain'}}
                className="p-4"
            />
        </div>
        <div className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2 clamp-2" title={product.name}>
                {product.name}
            </h3>
            {product.price && (
                <p className="text-2xl font-extrabold text-indigo-600 mb-4">
                    {product.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </p>
            )}
            <button
                onClick={onConfirm}
                disabled={isAdding}
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
                {isAdding ? (
                    <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Adding...
                    </>
                ) : (
                    <>
                        <PlusCircle size={20} className="mr-2" />
                        Confirm and Track
                    </>
                )}
            </button>
        </div>
    </div>
);

export default function Page() {
    const [scrapedProduct, setScrapedProduct] = useState<DiscoveredProduct | null>(null);
    const [isScraping, setIsScraping] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const toast = useToast();
    const router = useRouter();

    const handleScrape = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!url) {
            setError('Please enter a product URL.');
            return;
        }
        setIsScraping(true);
        setScrapedProduct(null);
        setError(null);

        try {
            const result = await testScrapeProduct(url);
            if (result && result.length > 0) {
                 // Assuming the first result is the main product
                setScrapedProduct(result[0]);
            } else {
                setError('Could not find a product on this page. Please check the URL.');
            }
        } catch (err) {
            handleError(err, 'Failed to scrape product data.');
        } finally {
            setIsScraping(false);
        }
    };
    
    const handleConfirmTrack = async () => {
        if (!url) return;
        setIsAdding(true);
        setError(null);

        try {
            const newProduct = await addProduct(url);
            toast(`Started tracking "${newProduct.name}"!`, { type: 'success' });
            router.push(`/products/${newProduct._id}`);
        } catch (err) {
            handleError(err, 'This product is already being tracked or could not be added.');
        } finally {
            setIsAdding(false);
        }
    }

    const handleError = (err: unknown, defaultMessage: string) => {
        let message = defaultMessage;
        if (err instanceof AxiosError) {
            message = err.response?.data?.message || defaultMessage;
        } else if (err instanceof Error) {
            message = err.message;
        }
        setError(message);
        toast(message, { type: 'error' });
    }

    return (
        <main className="bg-gray-50 min-h-screen">
            <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">Track a New Product</h1>
                    <p className="text-center text-gray-500 mb-6">Enter a product URL to fetch its details.</p>
                    <form onSubmit={handleScrape}>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="e.g., https://www.amazon.com/dp/B08P2H5L72"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                disabled={isScraping}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isScraping}
                            className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            {isScraping ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    Fetching Details...
                                </>
                            ) : (
                                <>
                                    <Search size={20} className="mr-2" />
                                    Fetch Product
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {error && !scrapedProduct && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {scrapedProduct && (
                     <div className="animate-fade-in-up space-y-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800">Product Found!</h2>
                        <ScrapedProductCard product={scrapedProduct} onConfirm={handleConfirmTrack} isAdding={isAdding}/>
                    </div>
                )}
            </div>
        </main>
    );
} 