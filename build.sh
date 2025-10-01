#!/bin/bash

# Script de build pour Render
echo "🚀 Début du build pour Render..."

# Vérifier que Node.js est disponible
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que npm est disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Afficher les versions
echo "📋 Versions:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# Nettoyer le cache npm
echo "🧹 Nettoyage du cache npm..."
npm cache clean --force

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm ci --only=production

# Build de l'application
echo "🏗️ Build de l'application Next.js..."
npm run build

echo "✅ Build terminé avec succès!"