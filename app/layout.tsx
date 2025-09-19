import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kart Relay App",
  description: "Organisez les relais karting en temps réel",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <div className="mx-auto max-w-md p-3">{children}</div>
      </body>
    </html>
  );
}
