import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QALBI Cafe | Tea, Coffee & Fast Food",
  description: "Browse our tea, coffee, gobi, fried rice and fast food menu. Order directly from your table and pay at the counter.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#241713",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth selection:bg-[#C6A46C] selection:text-[#241713]">
      <body className="min-h-full flex flex-col font-sans bg-[#F7F2EA] text-[#241713] antialiased">
        {children}
      </body>
    </html>
  );
}
