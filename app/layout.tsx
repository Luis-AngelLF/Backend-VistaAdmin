import type { Metadata } from "next";

import Script from "next/script";
import "./globals.css";



export const metadata: Metadata = {
  title: "Cripto Proyecto",
  description: "Antigravity Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
