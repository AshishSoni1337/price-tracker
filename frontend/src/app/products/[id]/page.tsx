'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PriceChart from '../../components/PriceChart';
import { getProductById, getProductHistory, toggleProductAlert } from '@/services/productService';
import type { Product, ProductDetails, PriceHistoryPoint } from '@/types';
import { ChevronLeft, ExternalLink, TrendingUp, Tag, Info, ShoppingCart, Bell } from 'lucide-react';
import { Switch } from '../../components/common/Switch';
import { useToast } from '@/hooks/useToast';

const StatusBadge = ({ status }: { status: Product['status'] }) => {
    const statusClasses = {
        ACTIVE: "bg-green-100 text-green-800",
        PAUSED: "bg-yellow-100 text-yellow-800",
        ERROR: "bg-red-100 text-red-800",
    };
    const baseClasses = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider";
    return (
        <span className={`${baseClasses} ${statusClasses[status]}`}>
            {status}
        </span>
    );
};

const AvailabilityBadge = ({ availability }: { availability: string }) => {
    const isAvailable = availability === 'In Stock';
    const baseClasses = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider";
    const availabilityClasses = isAvailable
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";

    return (
        <span className={`${baseClasses} ${availabilityClasses}`}>
            {availability}
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
  const [range, setRange] = useState('-30d');
  const [isAlertEnabled, setIsAlertEnabled] = useState(false);
  const [isTogglingAlert, setIsTogglingAlert] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (typeof id !== 'string') return;
    
    const fetchProductData = async () => {
      try {
        const productData = await getProductById(id);
        setProduct(productData);
        setIsAlertEnabled(productData.alertEnabled);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    };

    fetchProductData();
  }, [id]);

  useEffect(() => {
    if (typeof id !== 'string') return;

    const fetchHistoryData = async () => {
      // Don't set loading for history, to avoid flashing
      try {
        const historyData = await getProductHistory(id, range);
        setPriceHistory(historyData);
      } catch (err) {
        // History fetching error is less critical, can be logged or shown subtly
        console.error("Failed to fetch price history:", err);
        setPriceHistory([]); // Clear old history
      }
    };
    
    fetchHistoryData();
  }, [id, range]);

  const handleAlertToggle = async (isEnabled: boolean) => {
    if (typeof id !== 'string' || !product) return;

    setIsTogglingAlert(true);
    try {
        const updatedProduct = await toggleProductAlert(id, isEnabled);
        setProduct(updatedProduct);
        setIsAlertEnabled(updatedProduct.alertEnabled);
        toast(
            `Alerts have been ${updatedProduct.alertEnabled ? 'enabled' : 'disabled'}.`,
            { type: 'success' }
        );
    } catch {
        toast(
            'Failed to update alert status. Please try again.',
            { type: 'error' }
        );
        // Revert the switch state on error
        setIsAlertEnabled(!isEnabled);
    } finally {
        setIsTogglingAlert(false);
    }
  };


  useEffect(() => {
    if (product || error) {
      setIsLoading(false);
    }
  }, [product, error]);

  if (isLoading) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md max-w-md w-full">
            <h2 className="font-bold text-lg mb-2">Something went wrong</h2>
            <p className="text-sm">{error}</p>
            <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-semibold">
                &larr; Back to Dashboard
            </Link>
        </div>
    </div>
  );
  
  if (!product) return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Product not found.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-semibold">
              &larr; Back to Dashboard
          </Link>
        </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="mb-6">
                <Link href="/" className="inline-flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium text-lg">
                    <ChevronLeft size={22} className="mr-1" />
                    Back to Dashboard
                </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center aspect-square">
                        <div className="relative w-full h-full">
                            <Image
                                src={product.images[activeImage] || '/placeholder.png'}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                style={{objectFit: "contain"}}
                                priority
                            />
                        </div>
                    </div>
                    {product.images.length > 1 && (
                      <div className="grid grid-cols-5 gap-2">
                          {product.images.slice(0, 5).map((image, index) => (
                              <button
                                  key={index}
                                  onClick={() => setActiveImage(index)}
                                  className={`aspect-square relative rounded-md overflow-hidden border-2 ${activeImage === index ? 'border-indigo-500 shadow-sm' : 'border-gray-200 hover:border-gray-400'}`}
                              >
                                  <Image src={image} alt={`thumbnail ${index+1}`} fill style={{objectFit: "contain"}} sizes="20vw" className="p-1"/>
                              </button>
                          ))}
                      </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{product.name}</h1>
                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-indigo-600 hover:underline">
                            View on Store <ExternalLink size={14} className="ml-1.5" />
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-gray-600 text-sm flex items-center mb-2"><Tag size={16} className="mr-2" /> Current Price</p>
                                <p className="text-3xl md:text-4xl font-extrabold text-gray-900">
                                    {product.availability === 'In Stock'
                                        ? (product.currentPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A')
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-600 text-sm flex items-center justify-end mb-2"><Info size={16} className="mr-2" /> Status</p>
                                <div className="flex justify-end items-center gap-2">
                                    <AvailabilityBadge availability={product.availability} />
                                    <StatusBadge status={product.status} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Bell size={18} className="text-gray-600 mr-3" />
                                    <span className="font-medium text-gray-800">Price Drop Alerts</span>
                                </div>
                                <Switch
                                    checked={isAlertEnabled}
                                    onChange={handleAlertToggle}
                                    disabled={isTogglingAlert}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Get notified when the price drops significantly.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                       <h2 className="font-semibold text-lg text-gray-800 flex items-center mb-4"><Info size={20} className="mr-2" /> Description</h2>
                       <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description || 'No description available.'}</p>
                    </div>

                     <a 
                        href={product.availability === 'In Stock' ? product.url : undefined} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`flex items-center justify-center gap-2 w-full text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            product.availability === 'In Stock' 
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                            if (product.availability !== 'In Stock') {
                                e.preventDefault();
                            }
                        }}
                    >
                        <ShoppingCart size={20} />
                        <span>{product.availability === 'In Stock' ? 'Buy on Store' : 'Out of Stock'}</span>
                    </a>
                </div>
            </div>

            {priceHistory && priceHistory.length > 0 ? (
              <div className="mt-8 lg:mt-12 bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                      <h2 className="font-semibold text-xl text-gray-800 flex items-center mb-3 sm:mb-0">
                          <TrendingUp size={22} className="mr-2" /> Price History
                      </h2>
                      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                          {['-7d', '-30d', '-90d', '-365d'].map((r) => (
                              <button
                                  key={r}
                                  onClick={() => setRange(r)}
                                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${range === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                              >
                                  {r.replace('-', '').replace('d', 'D')}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="h-80">
                      <PriceChart data={priceHistory} />
                  </div>
              </div>
            ) : (
                <div className="mt-8 lg:mt-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="font-semibold text-xl text-gray-800 flex items-center mb-4"><TrendingUp size={22} className="mr-2" /> Price History</h2>
                    <div className="text-center py-12">
                        <p className="text-gray-500">No price history available yet.</p>
                        <p className="text-sm text-gray-400 mt-2">Check back later after the price has been tracked.</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
} 