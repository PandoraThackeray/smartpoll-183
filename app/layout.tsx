import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppFrame } from "@/components/layout/app-frame";
import { appConfig } from "@/lib/app-config";

export const metadata: Metadata = {
  title: `${appConfig.appName} | Community decisions on Base`,
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans text-text">
        <Providers>
          <AppFrame>{children}</AppFrame>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
