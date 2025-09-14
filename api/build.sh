#!/usr/bin/env bash
# exit on error
set -o errexit

# Installe les dépendances nécessaires pour ajouter le dépôt de Chrome
apt-get update
apt-get install -y wget gnupg

# Ajoute la clé de signature de Google
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -

# Ajoute le dépôt officiel de Google Chrome
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'

# Met à jour la liste des paquets et installe Chrome
apt-get update
apt-get install -y google-chrome-stable

# Nettoie le cache pour réduire la taille de l'image
rm -rf /var/lib/apt/lists/*