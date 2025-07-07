import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ReduxProvider from "./components/common/ReduxProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Price Stalker",
  description: "Track prices across multiple websites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <header className="bg-gray-800 text-white shadow-md">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
              <Link href="/" className="text-xl font-bold hover:text-gray-300">
                Price Stalker
              </Link>
              <div className="space-x-4">
                <Link href="/" className="hover:text-gray-300">Dashboard</Link>
                <Link href="/track-product" className="hover:text-gray-300">Track Product</Link>
                <Link href="/discover" className="hover:text-gray-300">Discover</Link>
                <Link href="/errors" className="hover:text-gray-300">Error Logs</Link>
              </div>
            </nav>
          </header>
          <main>{children}</main>
        </ReduxProvider>
      </body>
    </html>
  );
}
