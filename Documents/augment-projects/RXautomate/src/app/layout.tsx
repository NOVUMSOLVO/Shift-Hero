import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '../providers/session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RXautomate - UK Pharmacy Automation',
  description: 'Automating UK pharmacy processes including NHS prescription handling, inventory management, and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
