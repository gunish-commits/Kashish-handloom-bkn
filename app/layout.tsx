import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { StoreSettingsProvider } from '../context/StoreSettingsContext';
import LoadingScreen from '../components/layout/LoadingScreen';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Kashish Handloom — Premium Handloom Since 1976',
    template: '%s | Kashish Handloom',
  },
  description: 'Shop premium handloom bedsheets, curtains, blankets, comforters and home décor. Delivering across India since 1976. Order on WhatsApp.',
  keywords: ['handloom', 'bedsheets', 'curtains', 'blankets', 'Bikaner', 'Rajasthan', 'home decor', 'Indian handloom'],
  openGraph: {
    siteName: 'Kashish Handloom',
    locale: 'en_IN',
  },
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/logo.jpg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAF7F2]">
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              <LoadingScreen />
              {children}
            </CartProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
