// Fichier : frontend/app/layout.js
import "./globals.css";

export const metadata = {
  title: "Screener de Valeur Mondial",
  description: "Application d'analyse financière avec Next.js et Python",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
