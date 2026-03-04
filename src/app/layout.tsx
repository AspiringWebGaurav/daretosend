import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/context/LoadingContext";
import { NavigationLoader } from "@/components/layout/NavigationLoader";
import { GlobalErrorSetup } from "@/components/layout/GlobalErrorSetup";
import { DeviceGate } from "@/components/layout/DeviceGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DareToSend",
  description: "Moderation-first anonymous feedback platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LoadingProvider>
          <GlobalErrorSetup />
          <NavigationLoader />
          <DeviceGate>
            {children}
          </DeviceGate>
        </LoadingProvider>
      </body>
    </html>
  );
}

