import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'VerifyDoc — Plateforme de vérification de rapports académiques',
  description: 'Vérifiez l\'authenticité et la traçabilité de vos rapports académiques',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
