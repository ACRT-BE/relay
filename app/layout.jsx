
import './globals.css';

export const metadata = { title: 'Kart Relay', description: 'Organiser les relais karting' };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
