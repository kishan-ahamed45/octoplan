import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AsgardeoProvider } from '@asgardeo/nextjs/server';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Project Manager | Autonomous Agentic Software Engineering',
  description: 'An enterprise-grade project management application powered by autonomous AI agent tool execution and PostgreSQL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200`}>
        <AsgardeoProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </AsgardeoProvider>
      </body>
    </html>
  );
}
