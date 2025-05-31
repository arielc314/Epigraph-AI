import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Epigraph-AI',
  description: 'אפליקציה לניתוח ארכיאולוגי מתקדם - Advanced Archaeological Analysis Application',
  keywords: 'archaeology, analysis, historical, research, ארכיאולוגיה, ניתוח, היסטוריה, מחקר',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}