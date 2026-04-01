import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: { default: "HotelBook — Find Hotels Across India", template: "%s | HotelBook" },
  description: "Book hotels across India — from budget stays to luxury experiences. Best rates guaranteed.",
  keywords: ["hotel booking", "hotels India", "travel", "accommodation"],
  openGraph: {
    title: "HotelBook",
    description: "Book hotels across India",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "var(--font-dm-sans)",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 24px rgb(0 0 0 / 0.08)",
              },
              success: { iconTheme: { primary: "#1A3C5E", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="bg-navy-950 text-white mt-16">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-display text-lg font-semibold">HotelBook</span>
            </div>
            <p className="text-surface-400 text-sm leading-relaxed max-w-sm">
              India&apos;s trusted hotel booking platform. Discover, book and enjoy stays
              from budget to luxury across all major cities.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-surface-300 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm text-surface-400">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/guest/search" className="hover:text-white transition-colors">Search Hotels</a></li>
              <li><a href="/guest/dashboard" className="hover:text-white transition-colors">My Bookings</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-surface-300 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-surface-400">
              <li className="flex items-center gap-2">
                <span>📞</span> 1800-XXX-XXXX
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span> support@hotelbook.in
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-navy-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-surface-400">
          <p>© 2024 HotelBook. All rights reserved.</p>
          <p>GST compliant · Secure payments via Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
