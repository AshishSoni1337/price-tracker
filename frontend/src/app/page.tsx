'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, updateProductStatus } from '@/services/productService';
import type { Product } from '@/types';
import { MoreVertical, Eye, Trash2, PauseCircle, PlayCircle, ExternalLink, PlusCircle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';

const StatusBadge = ({ status }: { status: Product['status'] }) => {
    const statusClasses = {
        ACTIVE: "bg-green-100 text-green-800",
        PAUSED: "bg-yellow-100 text-yellow-800",
        ERROR: "bg-red-100 text-red-800",
    };
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide";
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

    // Use a portal or a library like Headless UI for production-grade dropdowns
    // to handle complex positioning and accessibility.
    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.preventDefault(); // Prevent link navigation on card click
                    setIsOpen(!isOpen);
                }}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <MoreVertical size={18} />
            </button>
            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <Link href={`/products/${product._id}`} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                            <Eye size={16} className="mr-3 text-gray-500" /> View Details
                        </Link>
                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                           <ExternalLink size={16} className="mr-3 text-gray-500" /> View on Store
                        </a>
                        
                        <div className="border-t my-1"></div>

                        {product.status === 'ACTIVE' ? (
                            <button onClick={() => handleStatusClick('PAUSED')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                <PauseCircle size={16} className="mr-3 text-yellow-500" /> Pause Tracking
                            </button>
                        ) : (
                            <button onClick={() => handleStatusClick('ACTIVE')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                <PlayCircle size={16} className="mr-3 text-green-500" /> Activate Tracking
                            </button>
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
    <Link href={`/products/${product._id}`} className="block bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out">
        <div className="flex flex-col h-full">
            <div className="relative h-40 sm:h-48">
                <Image
                    src={product.images[0] || '/placeholder.png'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    style={{ objectFit: 'contain' }}
                    className="p-4"
                />
            </div>
            <div className="p-4 flex flex-col flex-grow border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-800 mb-2 leading-snug flex-grow clamp-2">
                    {product.name}
                </h3>
                <div className="mt-auto">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-lg font-bold text-gray-900">{product.currentPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                        <StatusBadge status={product.status} />
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                        <ProductActions product={product} onStatusChange={onStatusChange} />
                    </div>
                </div>
            </div>
        </div>
    </Link>
);

const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-40 sm:h-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
)

interface SearchAndFilterProps {
    onSearch: (search: string) => void;
    onPlatformChange: (platform: string) => void;
    onClear: () => void;
    initialSearch: string;
    initialPlatform: string;
}

const SearchAndFilter = ({ onSearch, onPlatformChange, onClear, initialSearch, initialPlatform }: SearchAndFilterProps) => {
    const [search, setSearch] = useState(initialSearch);
    const [platform, setPlatform] = useState(initialPlatform);
    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        setSearch(initialSearch);
        setPlatform(initialPlatform);
    }, [initialSearch, initialPlatform]);

    useEffect(() => {
        onSearch(debouncedSearch);
    }, [debouncedSearch, onSearch]);

    const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPlatform = e.target.value;
        setPlatform(newPlatform);
        onPlatformChange(newPlatform);
    };

    const clearFilters = () => {
        setSearch('');
        setPlatform('');
        onClear();
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by product name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
            </div>
            <select
                value={platform}
                onChange={handlePlatformChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
            >
                <option value="">All Platforms</option>
                <option value="amazon">Amazon</option>
                <option value="flipkart">Flipkart</option>
            </select>
             <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
                <X size={16} />
                <span>Clear</span>
            </button>
        </div>
    );
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProducts({ page: 1, limit: 100, search, platform });
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [search, platform]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const handleSearch = (newSearch: string) => {
    setSearch(newSearch);
  };

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform);
  };

  const handleClearFilters = () => {
    setSearch('');
    setPlatform('');
  };

  return (
    <main className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Tracked Products</h1>
                 <Link href="/track-product" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <PlusCircle size={20} />
                    <span>Track New Product</span>
                </Link>
            </div>

            <SearchAndFilter
                onSearch={handleSearch}
                onPlatformChange={handlePlatformChange}
                onClear={handleClearFilters}
                initialSearch={search}
                initialPlatform={platform}
            />
            
            {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded-md">Error: {error}</p>}

            {!isLoading && !error && (
                <>
                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                            {products.map((product) => (
                                <ProductCard key={product._id} product={product} onStatusChange={handleStatusChange} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 sm:py-16 px-6 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">No products being tracked.</h2>
                            <p className="text-gray-500 mb-6 text-sm sm:text-base">Click the button below to add your first product.</p>
                            <Link href="/track-product" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <PlusCircle size={20} />
                                <span>Track a New Product</span>
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    </main>
  );
}
