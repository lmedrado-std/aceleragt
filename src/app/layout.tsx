
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Goal Getter',
  description: 'Acelere suas vendas e ganhos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${montserrat.className} font-sans antialiased bg-muted/40`}>
          <main className='p-4 sm:p-6 md:p-8'>{children}</main>
          <Toaster />
      </body>
    </html>
  );
}
