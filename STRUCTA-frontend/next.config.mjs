/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rzzzwsmkysjlrazpohpa.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Suppress WalletConnect dynamic require warnings
    config.ignoreWarnings = [
      { module: /node_modules\/pino\/lib\/tools\.js/ },
      { module: /node_modules\/ox\/_esm\/tempo/ },
    ];

    if (!isServer) {
      // Node.js built-ins not available in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
