import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Bob Marketplace | Official Extension Registry for IBM Bob 2.0",
  description: "Discover, install, and share AI Skills, Modes, Rules, and MCP servers for IBM Bob 2.0 IDE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D11] text-[#ECEDEE] antialiased selection:bg-[#0F62FE] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
