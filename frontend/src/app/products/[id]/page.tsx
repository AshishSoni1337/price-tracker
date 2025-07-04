'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PriceChart from '../../components/PriceChart';
import { getProductById, getProductHistory } from '@/services/productService';
import type { Product, ProductDetails, PriceHistoryPoint } from '@/types';
import { ChevronLeft, ExternalLink, TrendingUp, Tag, Info } from 'lucide-react';

const StatusBadge = ({ status }: { status: Product['status'] }) => {
    const statusClasses = {
        ACTIVE: "bg-green-100 text-green-800",
        PAUSED: "bg-yellow-100 text-yellow-800",
        ERROR: "bg-red-100 text-red-800",
    };
    const baseClasses = "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider";
    return (
        <span className={`${baseClasses} ${statusClasses[status]}`}>
            {status}
        </span>
    );
};

export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (typeof id !== 'string') return;
    
    const fetchProductAndHistory = async () => {
      setIsLoading(true);
      try {
        const [productData, historyData] = await Promise.all([
          getProductById(id),
          getProductHistory(id)
        ]);
        setProduct(productData);
        setPriceHistory(historyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductAndHistory();
  }, [id]);

  if (isLoading) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md max-w-lg w-full">
            <h2 className="font-bold text-xl mb-2">Error</h2>
            <p>{error}</p>
            <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
                &larr; Go back to Dashboard
            </Link>
        </div>
    </div>
  );
  
  if (!product) return <p className="p-4">Product not found.</p>;

  return (
    <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="mb-6">
                <Link href="/" className="inline-flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                    <ChevronLeft size={20} className="mr-1" />
                    Back to Dashboard
                </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center aspect-square">
                        <div className="relative w-full h-full">
                            <Image
                                src={product.images[activeImage]}
                                alt={product.name}
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {product.images.slice(0, 5).map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveImage(index)}
                                className={`aspect-square relative rounded-md overflow-hidden border-2 ${activeImage === index ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <Image src={image} alt={`thumbnail ${index+1}`} layout="fill" objectFit="contain" className="p-1"/>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">{product.name}</h1>
                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-indigo-600 hover:underline">
                            View on Store <ExternalLink size={14} className="ml-1.5" />
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-600 text-sm flex items-center"><Tag size={16} className="mr-2" /> Current Price</p>
                            <StatusBadge status={product.status} />
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900">
                            {product.variations[0]?.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                       <h2 className="font-semibold text-lg text-gray-800 flex items-center mb-4"><Info size={20} className="mr-2" /> Description</h2>
                       <p className="text-gray-600 text-sm leading-relaxed">{product.description || 'No description available.'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 lg:mt-12 bg-white rounded-lg shadow-md p-6">
                <h2 className="font-semibold text-xl text-gray-800 flex items-center mb-4"><TrendingUp size={22} className="mr-2" /> Price History</h2>
                <div className="h-80">
                    <PriceChart data={priceHistory} />
                </div>
            </div>
        </div>
    </div>
  );
} 