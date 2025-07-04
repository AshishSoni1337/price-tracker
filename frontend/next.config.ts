import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.media-amazon.com',
            },
        ],
    },
};

export default nextConfig;
