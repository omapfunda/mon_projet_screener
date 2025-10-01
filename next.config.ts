import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisations pour la production
  experimental: {
    optimizeCss: true,
  },
  
  // Configuration des variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  },
  
  // Configuration des images (si nécessaire)
  images: {
    domains: ['localhost'],
    unoptimized: true, // Pour éviter les problèmes sur Render
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Configuration TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
