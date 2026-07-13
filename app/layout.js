import "./globals.css";

export const metadata = {
  title: "Bab Rayan | Sorties pédagogiques",
  description:
    "Réservez une sortie pédagogique solidaire à Bab Rayan pour financer le foyer et l'École Palmier.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
