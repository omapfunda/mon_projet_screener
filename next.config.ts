import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Optimisations pour la production - disabled for deployment compatibility
  // experimental: {
  //   optimizeCss: true,
  // },
  
  // Désactive le file tracing pour éviter l'erreur EPERM sur Windows
  outputFileTracing: false,
  
  // Change le répertoire de sortie (.next) pour éviter les conflits de permissions
  distDir: "next-dev",
  
  // Fix de la racine du workspace pour le file tracing de Next
  outputFileTracingRoot: path.join(__dirname),
  
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
