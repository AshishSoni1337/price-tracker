"use client";

import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { Loader2, Search, PlusCircle, CheckCircle } from "lucide-react";
import {
    discoverProducts,
    DiscoverAPIResponse,
} from "@/services/discoverService";
import { addProduct } from "@/services/productService";
import { AxiosError } from "axios";
import Image from "next/image";

const DiscoveredProductCard = ({
    product,
    onTrack,
    isTracking,
}: {
    product: DiscoverAPIResponse;
    onTrack: (url: string) => void;
    isTracking: boolean;
}) => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
        <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative h-48 sm:h-56 w-full"
        >
            <Image
                src={product.image || '/placeholder.png'}
                alt={product.name}
                fill
                style={{ objectFit: "contain" }}
                className="p-4"
            />
        </a>
        <div className="p-4 flex flex-col flex-grow">
            <h3
                className="text-sm font-medium text-gray-800 mb-2 leading-snug flex-grow clamp-2"
                title={product.name}
            >
                {product.name}
            </h3>
            <div className="mt-auto">
                {product.price && (
                    <p className="text-lg font-bold text-gray-900 mb-3">
                        {product.price.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                        })}
                    </p>
                )}

                <button
                    onClick={() => onTrack(product.url)}
                    disabled={product.isTracked || isTracking}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:cursor-not-allowed transition-colors
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                                bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                >
                    {isTracking && (
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    )}
                    {product.isTracked ? (
                        <>
                            <CheckCircle size={16} className="mr-2" />
                            Tracked
                        </>
                    ) : (
                        <>
                            <PlusCircle size={16} className="mr-2" />
                            Track
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
);

export default function DiscoverPage() {
    const [query, setQuery] = useState("");
    const [platform, setPlatform] = useState("amazon");
    const [isLoading, setIsLoading] = useState(false);
    const [isTracking, setIsTracking] = useState<string | null>(null); // Holds the URL of the product being tracked
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<DiscoverAPIResponse[]>([]);
    const toast = useToast();

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setResults([]);
        if (!query) return;

        setIsLoading(true);
        try {
            const data = await discoverProducts(platform, query);
            if (!data?.length) {
                setError(
                    "No products found for this query. Try being more specific."
                );
                return;
            }
            setResults(data);
        } catch (err) {
            const message =
                err instanceof AxiosError
                    ? err.response?.data?.message
                    : "An unexpected error occurred during search.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTrackProduct = async (url: string) => {
        setIsTracking(url);
        try {
            const newProduct = await addProduct(url);
            toast(`Started tracking "${newProduct.name}"!`, {
                type: "success",
            });
            setResults((prevResults) =>
                prevResults.map((r) =>
                    r.url === url ? { ...r, isTracked: true } : r
                )
            );
        } catch (err) {
            const message =
                err instanceof AxiosError
                    ? err.response?.data?.message
                    : "Failed to track product.";
            toast(message, { type: "error" });
        } finally {
            setIsTracking(null);
        }
    };

    return (
        <main className="bg-gray-50 min-h-screen">
            <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
                        Discover New Products
                    </h1>
                    <p className="text-center text-gray-500 mb-6">
                        Search for products by keyword to start tracking.
                    </p>
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                                disabled={isLoading}
                            >
                                <option value="amazon">Amazon</option>
                                <option value="flipkart">Flipkart</option>
                            </select>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., 'mechanical keyboard' or 'running shoes'"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <Search
                                    size={20}
                                    className={isLoading ? "animate-spin" : ""}
                                />
                                <span className="ml-2">Search</span>
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">
                        <p>{error}</p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto" />
                        <p className="mt-4 text-gray-500">
                            Searching for products...
                        </p>
                    </div>
                )}

                {results.length > 0 && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {results.map((product) => (
                            <DiscoveredProductCard
                                key={product.url}
                                product={product}
                                onTrack={handleTrackProduct}
                                isTracking={isTracking === product.url}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
