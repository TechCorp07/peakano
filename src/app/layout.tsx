import type { Metadata } from "next";
import { StoreProvider } from "@/store/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Medical Imaging Training Platform",
    template: "%s | Medical Imaging Training",
  },
  description: "Train to annotate medical images with AI-powered assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
