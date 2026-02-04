import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shema Meaning Maps',
  description: 'Semantic Mapping of Biblical Text for AI-Assisted OBT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
