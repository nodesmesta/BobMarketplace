"use client";

import { NextUIProvider } from "@nextui-org/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <main className="dark text-foreground bg-background min-h-screen">
        {children}
      </main>
    </NextUIProvider>
  );
}
