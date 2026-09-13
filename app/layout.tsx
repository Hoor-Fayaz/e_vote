import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Private Voting System',
  description: 'Simple and secure private voting platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col justify-between antialiased">
        <main className="flex-grow">{children}</main>
        <footer className="py-5 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p>© {new Date().getFullYear()} Private e-vote • Votes are strictly confidential</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
