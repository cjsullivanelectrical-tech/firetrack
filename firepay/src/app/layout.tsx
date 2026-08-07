import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "FirePay",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FirePay",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },

  title: {
    default: "FirePay",
    template: "%s | FirePay",
  },
  description:
    "Track firefighter calls, overtime, training and earnings accurately.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f4f5f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}