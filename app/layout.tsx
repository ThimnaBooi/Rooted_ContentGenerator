import './globals.css';
import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rooted.example'),
  title: 'Rooted — Every Story Begins with Roots',
  description:
    'Rooted helps families preserve memories, traditions, stories, and heritage for future generations in one secure digital archive.',
  openGraph: {
    title: 'Rooted — Every Story Begins with Roots',
    description:
      'Preserve the stories that shape your family. A warm, timeless digital archive for memories, traditions, recipes, and heritage.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rooted — Every Story Begins with Roots',
    description:
      'Preserve the stories that shape your family in one secure digital archive.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
