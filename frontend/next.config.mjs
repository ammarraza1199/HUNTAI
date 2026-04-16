/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for deployment optimization
    // output: 'standalone',
    
    // Enable modern images support (e.g. SVG favicons)
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'www.google.com',
                port: '',
                pathname: '/s2/favicons/**',
            },
        ],
    },
    
    // Allow experimental features if needed
    experimental: {
    },
};

export default nextConfig;
