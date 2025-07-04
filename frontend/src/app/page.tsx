'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, updateProductStatus } from '@/services/productService';
import type { Product } from '@/types';
import { MoreVertical, Eye, Trash2, PauseCircle, PlayCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';

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

const ProductActions = ({ product, onStatusChange }: { product: Product, onStatusChange: (id: string, status: 'ACTIVE' | 'PAUSED') => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleStatusClick = (newStatus: 'ACTIVE' | 'PAUSED') => {
        onStatusChange(product._id, newStatus);
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <MoreVertical size={20} className="text-gray-500" />
            </button>
            {isOpen && (
                <div 
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <Link href={`/products/${product._id}`} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                            <Eye size={16} className="mr-3" /> View Details
                        </Link>
                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                           <ExternalLink size={16} className="mr-3" /> View on Store
                        </a>
                        
                        {product.status === 'ACTIVE' && (
                            <button onClick={() => handleStatusClick('PAUSED')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                <PauseCircle size={16} className="mr-3" /> Pause Tracking
                            </button>
                        )}
                        {product.status === 'PAUSED' && (
                            <button onClick={() => handleStatusClick('ACTIVE')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                <PlayCircle size={16} className="mr-3" /> Activate Tracking
                            </button>
                        )}
                         {product.status === 'ERROR' && (
                            <>
                                <button onClick={() => handleStatusClick('ACTIVE')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                    <PlayCircle size={16} className="mr-3" /> Reactivate Tracking
                                </button>
                                <button onClick={() => handleStatusClick('PAUSED')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                    <PauseCircle size={16} className="mr-3" /> Set to Paused
                                </button>
                            </>
                        )}

                        <div className="border-t my-1"></div>

                        <button className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" role="menuitem">
                            <Trash2 size={16} className="mr-3" /> Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductCard = ({ product, onStatusChange }: { product: Product, onStatusChange: (id: string, status: 'ACTIVE' | 'PAUSED') => void }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
        <Link href={`/products/${product._id}`} className="block h-48 relative">
            <Image
                src={product.images[0] || '/placeholder.png'}
                alt={product.name}
                layout="fill"
                objectFit="contain"
                className="p-4"
            />
        </Link>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-md font-semibold text-gray-800 mb-2 leading-snug">
                <Link href={`/products/${product._id}`} title={product.name} className="hover:text-indigo-600 transition-colors">
                    {product.name}
                </Link>
            </h3>
            <div className="mt-auto">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xl font-bold text-gray-900">{product.currentPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                    <StatusBadge status={product.status} />
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Added: {new Date(product.createdAt).toLocaleDateString()}</span>
                    <ProductActions product={product} onStatusChange={onStatusChange} />
                </div>
            </div>
        </div>
    </div>
);


export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleStatusChange = async (productId: string, status: 'ACTIVE' | 'PAUSED') => {
    try {
        const updatedProduct = await updateProductStatus(productId, status);
        setProducts(products.map(p => p._id === productId ? updatedProduct : p));
        toast(`Product status successfully updated to ${status.toLowerCase()}.`, { type: 'success' });
    } catch (error) {
        console.error("Failed to update status:", error);
        toast("Failed to update product status. Please try again.", { type: 'error' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Tracked Products</h1>
            
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                            <div className="h-48 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded-md">Error: {error}</p>}

            {!isLoading && !error && (
                <>
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product._id} product={product} onStatusChange={handleStatusChange} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No products yet!</h2>
                            <p className="text-gray-500 mb-6">Start tracking a product to see it here.</p>
                            <Link href="/discover" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                                Track a New Product
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
}
