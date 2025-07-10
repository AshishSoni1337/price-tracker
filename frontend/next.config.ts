import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'rukminim1.flixcart.com' },
            { protocol: 'https', hostname: 'rukminim2.flixcart.com' },
            { protocol: 'https', hostname: '**.media-amazon.com' },
            { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
            { protocol: 'https', hostname: 'm.media-amazon.com' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
        ],
    },
};

export default nextConfig;
